import OpenAI from "openai";
import { SYSTEM_PROMPT } from "./prompt";
import { GenerationError, MAX_OUTPUT_TOKENS, type TextStreamer } from "./shared";

/**
 * OpenAI provider. Defaults to GPT-5.6 Luna (the budget tier). Override with
 * OPENAI_MODEL, and OPENAI_REASONING_EFFORT if the model rejects "low".
 */
export const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-5.6-luna";
const EFFORT = (process.env.OPENAI_REASONING_EFFORT ?? "low") as OpenAI.ReasoningEffort;

let client: OpenAI | null = null;
const getClient = () => (client ??= new OpenAI());

export const streamOpenAI: TextStreamer = async function* (userMessage, signal) {
  try {
    const stream = await getClient().responses.create(
      {
        model: OPENAI_MODEL,
        instructions: SYSTEM_PROMPT,
        input: userMessage,
        max_output_tokens: MAX_OUTPUT_TOKENS,
        reasoning: { effort: EFFORT },
        stream: true,
        store: false,
      },
      { signal },
    );
    for await (const event of stream) {
      if (event.type === "response.output_text.delta") yield event.delta;
      else if (event.type === "response.refusal.done") {
        throw new GenerationError("That one's not something we can build. Try a different idea?");
      } else if (event.type === "response.failed" || event.type === "error") {
        console.error("[openai] stream failed", JSON.stringify(event).slice(0, 500));
        throw new GenerationError("The builder hiccuped. Give it another go?");
      }
    }
  } catch (err) {
    if (err instanceof GenerationError) throw err;
    if (err instanceof OpenAI.APIUserAbortError) throw err;
    if (err instanceof OpenAI.RateLimitError) {
      throw new GenerationError("We're a bit swamped right now. Give it a minute and try again.");
    }
    if (err instanceof OpenAI.AuthenticationError || err instanceof OpenAI.PermissionDeniedError) {
      console.error("[openai] credentials problem", err.message);
      throw new GenerationError("Our builder is misconfigured. We're on it.");
    }
    if (err instanceof OpenAI.APIError) {
      console.error(`[openai] API error ${err.status}`, err.message);
      throw new GenerationError("The builder hiccuped. Give it another go?");
    }
    throw err;
  }
};
