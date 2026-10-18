import OpenAI from "openai";
import { SYSTEM_PROMPT } from "./prompt";
import { GenerationError, MAX_OUTPUT_TOKENS, type TextStreamer } from "./shared";

/**
 * DeepSeek, served by Fireworks AI — the only AI engine. Fireworks exposes an
 * OpenAI-compatible Chat Completions API, so we use the OpenAI SDK pointed
 * at Fireworks with FIREWORKS_API_KEY.
 *
 * Model defaults to DeepSeek V4.1 Flash (deepseek-v4p1-flash-1017). Fireworks model ids are full
 * paths ("accounts/fireworks/models/<name>"); a bare name in FIREWORKS_MODEL
 * is expanded to that form. The frozen system prompt is a stable prefix, so
 * prompt caching applies on repeat builds.
 */
const MODEL_SETTING = process.env.FIREWORKS_MODEL || "accounts/fireworks/models/deepseek-v4p1-flash-1017";
export const DEEPSEEK_MODEL = MODEL_SETTING.includes("/") ? MODEL_SETTING : `accounts/fireworks/models/${MODEL_SETTING}`;
const BASE_URL = process.env.FIREWORKS_BASE_URL || "https://api.fireworks.ai/inference/v1";

let client: OpenAI | null = null;
const getClient = () => (client ??= new OpenAI({ apiKey: process.env.FIREWORKS_API_KEY, baseURL: BASE_URL }));

export const streamDeepSeek: TextStreamer = async function* (userMessage, signal) {
  try {
    const stream = await getClient().chat.completions.create(
      {
        model: DEEPSEEK_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        max_tokens: MAX_OUTPUT_TOKENS,
        stream: true,
      },
      { signal },
    );
    let reasoningChars = 0;
    let answerChars = 0;
    for await (const chunk of stream) {
      const choice = chunk.choices[0];
      // Only the answer text is used; any reasoning stream is just counted.
      const reasoning = (choice?.delta as { reasoning_content?: string } | undefined)?.reasoning_content;
      if (reasoning) reasoningChars += reasoning.length;
      const text = choice?.delta?.content;
      if (text) {
        answerChars += text.length;
        yield text;
      }
      if (choice?.finish_reason === "content_filter") {
        throw new GenerationError("That one's not something we can build. Try a different idea?");
      }
      if (choice?.finish_reason === "length") console.warn(
          `[fireworks] hit max_tokens (${MAX_OUTPUT_TOKENS}); reasoning ${reasoningChars} chars, answer ${answerChars} chars`,
        );
    }
  } catch (err) {
    if (err instanceof GenerationError) throw err;
    if (err instanceof OpenAI.APIUserAbortError) throw err;
    if (err instanceof OpenAI.RateLimitError) {
      throw new GenerationError("We're a bit swamped right now. Give it a minute and try again.");
    }
    if (err instanceof OpenAI.AuthenticationError || err instanceof OpenAI.PermissionDeniedError) {
      console.error("[fireworks] credentials problem", err.message);
      throw new GenerationError("Our builder is misconfigured. We're on it.");
    }
    if (err instanceof OpenAI.APIError) {
      // 404 (or 400) usually means the model id is wrong — check FIREWORKS_MODEL;
      // 402/412 usually means the Fireworks account is out of credit.
      console.error(`[fireworks] API error ${err.status} (model "${DEEPSEEK_MODEL}")`, err.message);
      throw new GenerationError("The builder hiccuped. Give it another go?");
    }
    throw err;
  }
};
