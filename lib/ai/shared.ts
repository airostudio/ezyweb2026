/**
 * Shared bits for the LLM providers: budget constants, provider selection
 * and post-processing of generated HTML.
 */

/**
 * Hard ceiling on output tokens per build (covers any hidden reasoning plus
 * the page). A ~22 KB page is roughly 6-7k tokens, so this leaves headroom
 * while capping worst-case spend per build at a fraction of a cent on
 * Haiku 5.5 ($0.50 per million output tokens).
 */
export const MAX_OUTPUT_TOKENS = 12_000;

/** Max size of an existing page we'll send back for an edit (~30k tokens). */
export const MAX_EDIT_HTML_CHARS = 120_000;

/** An error whose message is safe and friendly to show the user. */
export class GenerationError extends Error {
  override name = "GenerationError";
}

/** Streams raw text deltas for one user message. */
export type TextStreamer = (userMessage: string, signal?: AbortSignal) => AsyncGenerator<string>;

export type ProviderId = "anthropic" | "openai" | "mock";

/**
 * Which backend builds sites. AI_PROVIDER forces one; otherwise the first
 * provider with an API key wins (Anthropic, then OpenAI); with no keys the
 * built-in mock keeps the product fully usable for free.
 */
export function activeProvider(): ProviderId {
  const forced = process.env.AI_PROVIDER?.toLowerCase();
  if (forced === "anthropic" || forced === "openai" || forced === "mock") return forced;
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.OPENAI_API_KEY) return "openai";
  return "mock";
}

/**
 * Cleans model output into a safe, self-contained page:
 *  - strips markdown fences / chatter around the document
 *  - removes external scripts and non-font stylesheets (we promise
 *    hand-rolled, dependency-free pages, and they'd cost visitors bandwidth)
 * Returns null if the output doesn't look like an HTML document at all.
 */
export function cleanHtml(raw: string): string | null {
  let html = raw.trim().replace(/^```(?:html)?\s*/i, "").replace(/```\s*$/, "");
  const start = html.search(/<!doctype html|<html[\s>]/i);
  if (start === -1) return null;
  html = html.slice(start);
  const end = html.toLowerCase().lastIndexOf("</html>");
  html = end === -1 ? `${html}\n</body></html>` : html.slice(0, end + "</html>".length);

  return html
    .replace(/<script\b[^>]*\bsrc\s*=[^>]*>\s*<\/script>/gi, "")
    .replace(/<link\b(?![^>]*fonts\.(?:googleapis|gstatic)\.com)[^>]*rel=["']?stylesheet[^>]*>/gi, "")
    .replace(/<iframe\b[\s\S]*?<\/iframe>/gi, "");
}

/** Pulls a title + description out of a generated page for cards and drafts. */
export function pageMeta(html: string): { title: string | null; tagline: string | null } {
  const decode = (s: string) =>
    s.replace(/&amp;/g, "&").replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
  const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1];
  const desc = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i)?.[1];
  return { title: title ? decode(title).slice(0, 80) : null, tagline: desc ? decode(desc).slice(0, 140) : null };
}
