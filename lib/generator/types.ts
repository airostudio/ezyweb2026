/**
 * The structured representation of a generated site.
 *
 * The mock generator produces a `SiteSpec` from a prompt, follow-up edits
 * transform the spec, and `renderSite()` turns it into a standalone HTML
 * document. When the real aduma.io API is wired in, it can return HTML
 * directly; the spec is optional and only used for local edits/thumbnails.
 */

export type StyleFamily = "neon" | "playful" | "elegant" | "brutal" | "retro" | "cosy";
export type ColorMode = "light" | "dark";

export interface Palette {
  bg: string;
  surface: string;
  text: string;
  muted: string;
}

export interface ThemeSpec {
  id: string;
  name: string;
  style: StyleFamily;
  mode: ColorMode;
  light: Palette;
  dark: Palette;
  accent: string;
  accent2: string;
  /** Google Fonts family names */
  headingFont: string;
  bodyFont: string;
  /** Scale multiplier for the hero headline (1 = default) */
  heroScale: number;
  confetti: boolean;
}

export type Section =
  | { kind: "hero"; id: string; eyebrow: string; title: string; subtitle: string; cta: string; emoji: string }
  | { kind: "about"; id: string; heading: string; body: string }
  | { kind: "cards"; id: string; heading: string; items: { emoji: string; title: string; body: string }[] }
  | { kind: "gallery"; id: string; heading: string; items: { emoji: string; caption: string }[] }
  | { kind: "countdown"; id: string; heading: string; date: string; note: string }
  | { kind: "rsvp"; id: string; heading: string; note: string }
  | { kind: "quote"; id: string; text: string; by: string }
  | { kind: "timeline"; id: string; heading: string; items: { when: string; what: string }[] }
  | { kind: "stats"; id: string; items: { value: string; label: string }[] }
  | { kind: "guestbook"; id: string; heading: string; entries: { name: string; message: string }[] }
  | { kind: "faq"; id: string; heading: string; items: { q: string; a: string }[] };

export type SectionKind = Section["kind"];

export interface SiteSpec {
  /** Stable id for drafts */
  id: string;
  /** Archetype id that produced this site, e.g. "pet-shrine" */
  archetype: string;
  title: string;
  /** Short tagline used in cards, OG text, etc. */
  tagline: string;
  emoji: string;
  theme: ThemeSpec;
  sections: Section[];
  footer: string;
}

/** Events streamed by POST /api/generate (newline-delimited JSON). */
export type GenerateEvent =
  | { type: "stage"; stage: number; label: string }
  | { type: "thought"; text: string }
  | { type: "html"; chunk: string }
  | {
      type: "done";
      /** Structured spec (mock engine only; LLM engines return null) */
      spec: SiteSpec | null;
      html: string;
      summary: string;
      /** Page title/description, for drafts and cards */
      title?: string | null;
      tagline?: string | null;
    }
  | {
      type: "error";
      message: string;
      /** "quota": daily builds or per-site edits used up; "plan": needs an upgrade */
      code?: "quota" | "plan";
    };

export interface GenerateRequest {
  prompt: string;
  /** Existing site id; present (with spec or html) for follow-up edits */
  siteId?: string;
  /** Mock engine: current structured spec */
  spec?: SiteSpec | null;
  /** LLM engines: current page HTML to edit */
  html?: string;
}
