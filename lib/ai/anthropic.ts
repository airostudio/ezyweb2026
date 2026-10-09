import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT } from "./prompt";
import { GenerationError, MAX_OUTPUT_TOKENS, type TextStreamer } from "./shared";

/**
 * Claude provider. Defaults to Claude Haiku 5.5, the cheapest Claude model
 * ($0.10 / $0.50 per million input / output tokens). Override with
 * ANTHROPIC_MODEL if needed.
 */
export const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-haiku-5-5";

let client: Anthropic | null = null;
const getClient = () => (client ??= new Anthropic());

export const streamAnthropic: TextStreamer = async function* (userMessage, signal) {
  const stream = getClient().messages.stream(
    {
      model: ANTHROPIC_MODEL,
      max_tokens: MAX_OUTPUT_TOKENS,
      // Low effort keeps hidden reasoning (billed as output) to a minimum;
      // building one page from a short brief doesn't need deep thought.
      output_config: { effort: "low" },
      // Frozen system prompt marked cacheable: repeat builds read it from
      // cache at a fraction of the input price (silently a no-op if the
      // prefix is below the model's minimum cacheable length).
      system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: userMessage }],
    },
    { signal },
  );

  try {
    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        yield event.delta.text;
      }
    }
    const final = await stream.finalMessage();
    if (final.stop_reason === "refusal") {
      throw new GenerationError("That one's not something we can build. Try a different idea?");
    }
    if (final.stop_reason === "max_tokens") {
      // The page ran past the budget; the caller decides whether what we
      // have is usable (it usually is, minus the tail).
      console.warn("[anthropic] hit max_tokens", final.usage);
    }
  } catch (err) {
    if (err instanceof GenerationError) throw err;
    if (err instanceof Anthropic.APIUserAbortError) throw err;
    if (err instanceof Anthropic.RateLimitError) {
      throw new GenerationError("We're a bit swamped right now. Give it a minute and try again.");
    }
    if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) {
      console.error("[anthropic] credentials problem", err.message);
      throw new GenerationError("Our builder is misconfigured. We're on it.");
    }
    if (err instanceof Anthropic.APIError) {
      console.error(`[anthropic] API error ${err.status}`, err.message);
      throw new GenerationError("The builder hiccuped. Give it another go?");
    }
    throw err;
  }
};
