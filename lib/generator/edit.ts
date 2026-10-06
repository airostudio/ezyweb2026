import type { Section, SectionKind, SiteSpec } from "./types";
import { FONT_MOODS, NAMED_COLOURS } from "./themes";
import { futureDate } from "./archetypes";

/**
 * Applies a natural-language follow-up ("make the background darker", "add a
 * photo gallery") to an existing spec. Each matching rule mutates a copy and
 * records a human-friendly change note used in the streamed narration.
 */
export function applyEdit(input: SiteSpec, instruction: string): { spec: SiteSpec; changes: string[] } {
  const spec: SiteSpec = structuredClone(input);
  const text = instruction.toLowerCase();
  const changes: string[] = [];
  const has = (kind: SectionKind) => spec.sections.some((s) => s.kind === kind);
  const newId = () => `s${Math.random().toString(36).slice(2, 8)}`;

  /** Inserts before guestbook/rsvp so contact-y sections stay last. */
  const insert = (section: Section) => {
    const tailIdx = spec.sections.findIndex((s) => s.kind === "rsvp" || s.kind === "guestbook");
    if (tailIdx === -1) spec.sections.push(section);
    else spec.sections.splice(tailIdx, 0, section);
  };

  // ── Removal: "remove the countdown", "get rid of the faq" ─────────────
  const removeMatch = text.match(/(?:remove|delete|get rid of|ditch|lose|no more)\s+(?:the\s+)?(\w+)/);
  if (removeMatch?.[1]) {
    const target = sectionFromWord(removeMatch[1]);
    if (target && has(target)) {
      spec.sections = spec.sections.filter((s) => s.kind !== target);
      changes.push(`Removed the ${target} section`);
    }
  }
  const isRemoval = Boolean(removeMatch);

  // ── Colour mode ────────────────────────────────────────────────────────
  if (/dark|night|moody|black background|spooky/.test(text) && !/light/.test(text)) {
    spec.theme.mode = "dark";
    changes.push("Switched to a darker, moodier palette");
  } else if (/light|bright|white background|airy|sunny/.test(text)) {
    spec.theme.mode = "light";
    changes.push("Brightened everything up");
  }

  // ── Accent colours: "make it pink", "use green" ───────────────────────
  for (const [name, [a, b]] of Object.entries(NAMED_COLOURS)) {
    if (new RegExp(`\\b${name}\\b`).test(text)) {
      spec.theme.accent = a;
      spec.theme.accent2 = b;
      changes.push(`Repainted the accents ${name}`);
      break;
    }
  }

  // ── Fonts ──────────────────────────────────────────────────────────────
  if (/font|type|lettering|heading|title style/.test(text) || /fancier|handwrit|pixel/.test(text)) {
    const mood = FONT_MOODS.find((m) => m.match.test(text));
    if (mood) {
      spec.theme.headingFont = mood.heading;
      spec.theme.bodyFont = mood.body;
      changes.push(`Swapped the type for ${mood.label}`);
    }
  }

  // ── Headline scale ─────────────────────────────────────────────────────
  if (/bigger|huge|massive|larger|louder/.test(text) && /title|headline|heading|text/.test(text)) {
    spec.theme.heroScale = Math.min(1.5, spec.theme.heroScale + 0.2);
    changes.push("Made the headline bigger");
  } else if (/smaller|tone it down|subtle/.test(text)) {
    spec.theme.heroScale = Math.max(0.75, spec.theme.heroScale - 0.15);
    changes.push("Toned the headline down a notch");
  }

  // ── Fun toggles ────────────────────────────────────────────────────────
  if (/confetti|more fun|party|celebrat|sparkl|emoji/.test(text) && !isRemoval) {
    spec.theme.confetti = true;
    changes.push("Loaded the confetti cannon 🎉");
  }
  if (/no confetti|calm|chill|less busy/.test(text)) {
    spec.theme.confetti = false;
    changes.push("Calmed things down");
  }

  // ── Rename: "call it X", "change the title to X" ──────────────────────
  const rename = instruction.match(/(?:call it|rename (?:it )?to|title (?:to|should be)|change the (?:name|title) to)\s+["“']?([^"”'.!?]{2,60})/i);
  if (rename?.[1]) {
    const title = rename[1].trim();
    spec.title = title;
    const hero = spec.sections.find((s) => s.kind === "hero");
    if (hero && hero.kind === "hero") hero.title = title;
    changes.push(`Renamed the site to “${title}”`);
  }

  // ── Additions ──────────────────────────────────────────────────────────
  if (!isRemoval) {
    if (/gallery|photos|pictures|pics|images/.test(text) && !has("gallery")) {
      insert({ kind: "gallery", id: newId(), heading: "Gallery", items: [
        { emoji: spec.emoji, caption: "The main event" },
        { emoji: "📸", caption: "Candid #1" },
        { emoji: "🌈", caption: "Golden hour" },
        { emoji: "🤳", caption: "Obligatory selfie" },
      ] });
      changes.push("Added a photo gallery (drop your pics in later)");
    }
    if (/countdown|timer|days until|count down/.test(text) && !has("countdown")) {
      spec.sections.splice(1, 0, { kind: "countdown", id: newId(), heading: "Counting down", date: futureDate(21), note: "Mark your calendar" });
      changes.push("Added a live countdown");
    }
    if (/rsvp|sign.?up|contact|form|register/.test(text) && !has("rsvp")) {
      spec.sections.push({ kind: "rsvp", id: newId(), heading: "RSVP", note: "We'd love to know you're coming." });
      changes.push("Added an RSVP form");
    }
    if (/guestbook|comments|messages|shoutbox/.test(text) && !has("guestbook")) {
      spec.sections.push({ kind: "guestbook", id: newId(), heading: "Guestbook", entries: [{ name: "Webese", message: "Be the first to sign!" }] });
      changes.push("Added a guestbook");
    }
    if (/faq|questions/.test(text) && !has("faq")) {
      insert({ kind: "faq", id: newId(), heading: "Questions", items: [
        { q: "What should I bring?", a: "Yourself and good vibes." },
        { q: "Can I bring a friend?", a: "The more the merrier." },
      ] });
      changes.push("Added an FAQ");
    }
    if (/quote|testimonial|review/.test(text) && !has("quote")) {
      insert({ kind: "quote", id: newId(), text: "Genuinely the best website I have ever seen.", by: "Everyone who's visited" });
      changes.push("Added a glowing testimonial");
    }
    if (/stats|numbers|facts/.test(text) && !has("stats")) {
      spec.sections.splice(1, 0, { kind: "stats", id: newId(), items: [
        { value: "100%", label: "Fun" },
        { value: "0", label: "Boring bits" },
        { value: "∞", label: "Good vibes" },
      ] });
      changes.push("Added some very important stats");
    }
    if (/timeline|schedule|itinerary|history|story/.test(text) && !has("timeline")) {
      insert({ kind: "timeline", id: newId(), heading: "The story so far", items: [
        { when: "Then", what: "It all began" },
        { when: "Now", what: "This website exists" },
        { when: "Soon", what: "Legendary status" },
      ] });
      changes.push("Added a timeline");
    }
  }

  // Nothing matched? Give it a playful remix rather than doing nothing.
  if (changes.length === 0) {
    const palettes = Object.values(NAMED_COLOURS);
    const pick = palettes[Math.floor(Math.random() * palettes.length)] ?? ["#ff2bd6", "#00e5ff"];
    spec.theme.accent = pick[0];
    spec.theme.accent2 = pick[1];
    spec.theme.confetti = true;
    changes.push("Gave it a fresh coat of paint and a sprinkle of magic ✨");
  }

  return { spec, changes };
}

function sectionFromWord(word: string): SectionKind | null {
  const map: Record<string, SectionKind> = {
    gallery: "gallery", photos: "gallery", pictures: "gallery",
    countdown: "countdown", timer: "countdown",
    rsvp: "rsvp", form: "rsvp", contact: "rsvp",
    guestbook: "guestbook", comments: "guestbook", shoutbox: "guestbook",
    faq: "faq", questions: "faq",
    quote: "quote", testimonial: "quote",
    stats: "stats", numbers: "stats",
    timeline: "timeline", schedule: "timeline",
    about: "about", cards: "cards", highlights: "cards",
  };
  return map[word] ?? null;
}
