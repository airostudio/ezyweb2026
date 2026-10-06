import type { PromptContext } from "./archetypes";

/** Topic words we recognise, mapped to an emoji. Order matters: first match wins. */
const TOPICS: [RegExp, string, string][] = [
  [/\b(dinosaur|dino|t-?rex|jurassic)s?\b/, "dinosaur", "🦖"],
  [/\b(unicorn)s?\b/, "unicorn", "🦄"],
  [/\b(cat|kitten|kitty)s?\b/, "cat", "🐱"],
  [/\b(dog|puppy|pup|doggo)s?\b/, "dog", "🐶"],
  [/\b(axolotl)s?\b/, "axolotl", "🦎"],
  [/\b(gecko|lizard)s?\b/, "gecko", "🦎"],
  [/\b(hamster)s?\b/, "hamster", "🐹"],
  [/\b(bunny|rabbit)s?\b/, "bunny", "🐰"],
  [/\b(parrot|budgie|cockatoo|galah)s?\b/, "bird", "🦜"],
  [/\b(frog)s?\b/, "frog", "🐸"],
  [/\b(goldfish|fish)\b/, "fish", "🐠"],
  [/\b(kangaroo|roo)s?\b/, "kangaroo", "🦘"],
  [/\b(koala)s?\b/, "koala", "🐨"],
  [/\b(space|rocket|astronaut|planet)s?\b/, "space", "🚀"],
  [/\b(mermaid|ocean|sea|beach|surf)s?\b/, "ocean", "🌊"],
  [/\b(pizza)s?\b/, "pizza", "🍕"],
  [/\b(taco)s?\b/, "taco", "🌮"],
  [/\b(robot)s?\b/, "robot", "🤖"],
  [/\b(pirate)s?\b/, "pirate", "🏴‍☠️"],
  [/\b(princess|fairy|fairies)\b/, "fairy", "🧚"],
  [/\b(football|footy|soccer)\b/, "footy", "🏉"],
  [/\b(cricket)\b/, "cricket", "🏏"],
  [/\b(plant|garden|succulent)s?\b/, "plant", "🪴"],
  [/\b(coffee)\b/, "coffee", "☕"],
  [/\b(book|reading)s?\b/, "book", "📚"],
  [/\b(game|gaming)s?\b/, "game", "🎮"],
  [/\b(music|band|guitar)\b/, "music", "🎸"],
];

/** Words that look like names but aren't. */
const NOT_NAMES = new Set([
  "Make", "Me", "My", "A", "An", "The", "For", "Birthday", "Site", "Website", "Page", "I", "We", "Our",
  "Neon", "Cyberpunk", "Please", "Create", "Build", "With", "And", "Who", "That", "Loves", "Shrine",
]);

export function parsePrompt(prompt: string): PromptContext {
  const clean = prompt.trim().replace(/\s+/g, " ");
  const lower = clean.toLowerCase();

  const topicHit = TOPICS.find(([re]) => re.test(lower));
  const topic = topicHit ? { word: topicHit[1], emoji: topicHit[2] } : null;

  const ageMatch =
    lower.match(/(\d{1,3})[- ]?(?:year|yr)s?[- ]?old/) ??
    lower.match(/turn(?:s|ing)?\s+(\d{1,3})\b/) ??
    lower.match(/(\d{1,3})(?:st|nd|rd|th)\s+birthday/);
  const age = ageMatch?.[1] ? Number(ageMatch[1]) : null;

  return {
    prompt: clean,
    lower,
    name: findName(clean),
    age,
    topic,
    neon: /neon|cyber|synth|vapor|glow|futur|hacker|matrix/.test(lower),
  };
}

function findName(text: string): string | null {
  const patterns = [
    /\b(?:named|called|name is)\s+([A-Z][\w'-]+(?:\s[A-Z][\w'-]+)?)/,
    /\bmy\s+(?:cat|dog|kitten|puppy|pet|son|daughter|kid|bird|bunny|hamster|gecko|axolotl|band|clan|squad)\s+([A-Z][\w'-]+)/,
    /\bfor\s+([A-Z][a-z]+)(?:'s)?\b/,
    /\b([A-Z][a-z]+)'s\b/,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    const candidate = m?.[1]?.trim();
    if (candidate && !NOT_NAMES.has(candidate.split(" ")[0] ?? "")) return candidate;
  }
  return null;
}
