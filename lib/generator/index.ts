/**
 * Mock aduma.io generator.
 *
 * `generate()` and `edit()` are pure and synchronous; the API route wraps them
 * in a timed stream so the UI experiences realistic latency + streaming.
 */
import { ARCHETYPES, FALLBACK } from "./archetypes";
import { applyEdit } from "./edit";
import { parsePrompt } from "./parse";
import { renderSite } from "./render";
import type { SiteSpec } from "./types";

export * from "./types";
export { renderSite } from "./render";

export interface GenerationResult {
  spec: SiteSpec;
  html: string;
  /** Narration lines streamed as the model's "thoughts" */
  thoughts: string[];
  summary: string;
}

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `site_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export function generate(prompt: string): GenerationResult {
  const ctx = parsePrompt(prompt);
  const archetype = ARCHETYPES.find((a) => a.match.test(ctx.lower)) ?? FALLBACK;
  const built = archetype.build(ctx);

  const spec: SiteSpec = {
    id: uid(),
    archetype: archetype.id,
    title: built.title,
    tagline: built.tagline,
    emoji: built.emoji,
    theme: built.theme,
    footer: built.footer,
    sections: built.sections.map((s, i) => ({ ...s, id: `s${i}` }) as SiteSpec["sections"][number]),
  };

  const thoughts = [
    `Reading the vibe… ${archetype.label.toLowerCase()} energy detected ${built.emoji}`,
    ctx.name ? `Starring ${ctx.name}. Obviously.` : "Inventing a name worthy of this masterpiece",
    ctx.age ? `Lighting ${ctx.age} candles 🕯️` : `Mixing a ${built.theme.name} palette`,
    `Pairing ${built.theme.headingFont} headlines with ${built.theme.bodyFont}`,
    `Arranging ${spec.sections.length} sections: ${spec.sections.map((s) => s.kind).join(", ")}`,
    built.theme.confetti ? "Loading the confetti cannon" : "Adding the finishing touches",
  ];

  return {
    spec,
    html: renderSite(spec),
    thoughts,
    summary: `Here's “${spec.title}”: ${built.tagline.toLowerCase()}. Want changes? Just ask — try “make it darker” or “add a photo gallery”.`,
  };
}

export function edit(spec: SiteSpec, instruction: string): GenerationResult {
  const { spec: next, changes } = applyEdit(spec, instruction);
  return {
    spec: next,
    html: renderSite(next),
    thoughts: ["Got it — tweaking things…", ...changes],
    summary: changes.length === 1 ? `Done! ${changes[0]}.` : `Done! ${changes.join(" · ")}.`,
  };
}
