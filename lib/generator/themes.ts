import type { ThemeSpec } from "./types";

type ThemePreset = Omit<ThemeSpec, "heroScale" | "confetti">;

/**
 * Hand-tuned theme presets for generated sites. Each defines both a light
 * and dark palette so "make it darker" edits always look intentional.
 */
export const THEMES = {
  neonNoir: {
    id: "neon-noir",
    name: "Neon Noir",
    style: "neon",
    mode: "dark",
    dark: { bg: "#06070d", surface: "#0f1220", text: "#effaff", muted: "#9aa6c4" },
    light: { bg: "#f2fbff", surface: "#ffffff", text: "#071018", muted: "#45556b" },
    accent: "#00e5ff",
    accent2: "#ff2bd6",
    headingFont: "Orbitron",
    bodyFont: "Space Grotesk",
  },
  bubblegum: {
    id: "bubblegum",
    name: "Bubblegum Pop",
    style: "playful",
    mode: "light",
    light: { bg: "#fff6e9", surface: "#ffffff", text: "#2a1338", muted: "#6b5675" },
    dark: { bg: "#1b0f24", surface: "#28173a", text: "#fff2fb", muted: "#c9b2d4" },
    accent: "#ff4fa3",
    accent2: "#2ad1a0",
    headingFont: "Fredoka",
    bodyFont: "Nunito",
  },
  dinoJungle: {
    id: "dino-jungle",
    name: "Dino Jungle",
    style: "playful",
    mode: "light",
    light: { bg: "#f3fbe8", surface: "#ffffff", text: "#13300f", muted: "#4d6b45" },
    dark: { bg: "#0d1a0b", surface: "#152a12", text: "#ecffe2", muted: "#a9c79d" },
    accent: "#ff8a1f",
    accent2: "#46c21b",
    headingFont: "Lilita One",
    bodyFont: "Nunito",
  },
  botanical: {
    id: "botanical",
    name: "Botanical Romance",
    style: "elegant",
    mode: "light",
    light: { bg: "#f8f4ec", surface: "#fffdf8", text: "#2b2a22", muted: "#6c6857" },
    dark: { bg: "#15160f", surface: "#1f2018", text: "#f6f1e3", muted: "#bdb7a2" },
    accent: "#8a6d3b",
    accent2: "#6b8f71",
    headingFont: "Cormorant Garamond",
    bodyFont: "Jost",
  },
  brutalPaper: {
    id: "brutal-paper",
    name: "Brutal Paper",
    style: "brutal",
    mode: "light",
    light: { bg: "#fffbe6", surface: "#ffffff", text: "#111111", muted: "#3d3d3d" },
    dark: { bg: "#111111", surface: "#1c1c1c", text: "#fffbe6", muted: "#cfcabb" },
    accent: "#ff3d00",
    accent2: "#2f5bff",
    headingFont: "Archivo Black",
    bodyFont: "Space Grotesk",
  },
  arcade: {
    id: "arcade",
    name: "Retro Arcade",
    style: "retro",
    mode: "dark",
    dark: { bg: "#120b2e", surface: "#1d1446", text: "#fdf6ff", muted: "#b9acdf" },
    light: { bg: "#fdf6ff", surface: "#ffffff", text: "#120b2e", muted: "#55497a" },
    accent: "#ffe14d",
    accent2: "#22f0b5",
    headingFont: "Press Start 2P",
    bodyFont: "VT323",
  },
  cosy: {
    id: "cosy",
    name: "Cosy Cafe",
    style: "cosy",
    mode: "light",
    light: { bg: "#fbf3e8", surface: "#fffaf3", text: "#3a2618", muted: "#7a5f4b" },
    dark: { bg: "#1d1410", surface: "#2a1d17", text: "#fbefe2", muted: "#cdb6a3" },
    accent: "#d9622b",
    accent2: "#e6a83a",
    headingFont: "Fraunces",
    bodyFont: "DM Sans",
  },
  surf: {
    id: "surf",
    name: "Salty Sunset",
    style: "cosy",
    mode: "light",
    light: { bg: "#fff4ea", surface: "#ffffff", text: "#102a3a", muted: "#4b6575" },
    dark: { bg: "#0b1a24", surface: "#122633", text: "#fff4ea", muted: "#a9c0cc" },
    accent: "#ff6b4a",
    accent2: "#1aa7b8",
    headingFont: "Bricolage Grotesque",
    bodyFont: "DM Sans",
  },
  limeZine: {
    id: "lime-zine",
    name: "Acid Zine",
    style: "brutal",
    mode: "dark",
    dark: { bg: "#0b0b0b", surface: "#171717", text: "#f3ffe0", muted: "#b7c49e" },
    light: { bg: "#f3ffe0", surface: "#ffffff", text: "#0b0b0b", muted: "#3f4a2c" },
    accent: "#c6ff3d",
    accent2: "#ff2bd6",
    headingFont: "Rubik Mono One",
    bodyFont: "Space Grotesk",
  },
} satisfies Record<string, ThemePreset>;

export type ThemeKey = keyof typeof THEMES;

export function makeTheme(key: ThemeKey, overrides: Partial<ThemeSpec> = {}): ThemeSpec {
  const preset = THEMES[key] as ThemePreset;
  return {
    ...preset,
    light: { ...preset.light },
    dark: { ...preset.dark },
    heroScale: 1,
    confetti: preset.style === "playful",
    ...overrides,
  };
}

/** Named colours a user can ask for in follow-up edits ("make it pink"). */
export const NAMED_COLOURS: Record<string, [string, string]> = {
  pink: ["#ff4fa3", "#ffb3d9"],
  magenta: ["#ff2bd6", "#00e5ff"],
  red: ["#ff3b3b", "#ffb703"],
  orange: ["#ff8a1f", "#ffd166"],
  yellow: ["#ffd60a", "#ff6b4a"],
  gold: ["#d4a017", "#8a6d3b"],
  green: ["#2bd96b", "#c6ff3d"],
  lime: ["#c6ff3d", "#2bd96b"],
  teal: ["#14b8a6", "#5eead4"],
  cyan: ["#00e5ff", "#ff2bd6"],
  blue: ["#2f6bff", "#00e5ff"],
  navy: ["#1d3b8f", "#5b8cff"],
  purple: ["#9b5cff", "#ff4fa3"],
  black: ["#111111", "#666666"],
  rainbow: ["#ff3b3b", "#2f6bff"],
};

/** Font swaps for edits like "make the font fancier". */
export const FONT_MOODS: { match: RegExp; heading: string; body: string; label: string }[] = [
  { match: /fanc|elegant|serif|classy|posh/, heading: "Playfair Display", body: "Jost", label: "a fancy serif" },
  { match: /pixel|retro|8.?bit|arcade/, heading: "Press Start 2P", body: "VT323", label: "chunky pixels" },
  { match: /hand.?writ|script|cursive|scribbl/, heading: "Caveat", body: "Nunito", label: "handwritten vibes" },
  { match: /bold|loud|chunky|heavy/, heading: "Archivo Black", body: "Space Grotesk", label: "something loud" },
  { match: /futur|sci.?fi|robot|space/, heading: "Orbitron", body: "Space Grotesk", label: "sci-fi lettering" },
  { match: /cute|round|bubbl|fun|playful/, heading: "Fredoka", body: "Nunito", label: "round & bouncy type" },
];
