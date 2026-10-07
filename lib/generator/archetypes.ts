import type { Section, ThemeSpec } from "./types";
import { makeTheme } from "./themes";

/** Details pulled out of the user's prompt to personalise copy. */
export interface PromptContext {
  prompt: string;
  lower: string;
  /** Proper name if we spotted one ("my cat Mochi" → "Mochi") */
  name: string | null;
  /** Age if mentioned ("8-year-old" → 8) */
  age: number | null;
  /** Main topic emoji + noun ("cat" → 🐱) */
  topic: { word: string; emoji: string } | null;
  /** True when the prompt asks for neon/cyber aesthetics */
  neon: boolean;
}

export interface Archetype {
  id: string;
  label: string;
  match: RegExp;
  build(ctx: PromptContext): {
    title: string;
    tagline: string;
    emoji: string;
    theme: ThemeSpec;
    sections: Omit<Section, "id">[];
    footer: string;
  };
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** A date ~3 weeks out, formatted YYYY-MM-DD, so countdowns always count down. */
export function futureDate(days = 21): string {
  const d = new Date(Date.now() + days * 86_400_000);
  return d.toISOString().slice(0, 10);
}

/**
 * Archetypes are checked in order; the first match wins. The final entry is
 * a catch-all so every prompt produces something delightful.
 */
export const ARCHETYPES: Archetype[] = [
  {
    id: "kids-birthday",
    label: "Birthday party",
    match: /birthday|b-?day|turning \d|party for my (son|daughter|kid)|year.?old/,
    build(ctx) {
      const emoji = ctx.topic?.emoji ?? "🎂";
      const who = ctx.name ?? "the birthday legend";
      const thing = ctx.topic?.word ?? "cake";
      const isDino = /dino|t-?rex|jurassic/.test(ctx.lower);
      const title = ctx.age ? `${ctx.name ?? "Our kid"} turns ${ctx.age}!` : `${cap(who)}'s Birthday Bash`;
      return {
        title,
        tagline: `A ${isDino ? "roar-some" : "ridiculously fun"} birthday party`,
        emoji,
        theme: makeTheme(isDino ? "dinoJungle" : "bubblegum", { confetti: true }),
        sections: [
          {
            kind: "hero",
            eyebrow: "You're invited",
            title,
            subtitle: isDino
              ? "Stomp on over for fossils, cake and an absolutely prehistoric amount of fun."
              : `Party hats on. There will be ${thing}s, games, and at least one sugar crash.`,
            cta: "RSVP now",
            emoji,
          },
          { kind: "countdown", heading: "Party starts in", date: futureDate(18), note: "Saturday · 2pm till the parents beg for mercy" },
          {
            kind: "cards",
            heading: "The plan",
            items: isDino
              ? [
                  { emoji: "🦴", title: "Fossil dig", body: "Sandpit excavation. Real palaeontologists welcome." },
                  { emoji: "🦕", title: "Dino stomp-off", body: "Loudest roar wins a giant egg (it's chocolate)." },
                  { emoji: "🌋", title: "Volcano cake", body: "It erupts. Stand back. Bring a napkin." },
                ]
              : [
                  { emoji: "🎈", title: "Games galore", body: "Pass-the-parcel, musical chairs, total chaos." },
                  { emoji: "🍰", title: "Cake o'clock", body: `A ${thing}-themed masterpiece. Probably.` },
                  { emoji: "🎁", title: "Lolly bags", body: "Every guest goes home with a sugar rush." },
                ],
          },
          { kind: "rsvp", heading: "Coming?", note: "Let us know by next Friday so we order enough sausage rolls." },
          { kind: "faq", heading: "Parent FAQ", items: [
            { q: "Should I stay?", a: "Totally optional — there's coffee for those who do." },
            { q: "Allergies?", a: "Pop them in the RSVP and we'll sort it." },
          ] },
        ],
        footer: `Made with ${emoji} and way too much glitter`,
      };
    },
  },
  {
    id: "wedding",
    label: "Wedding",
    match: /wedding|engag|getting married|bride|groom|elope|save the date/,
    build(ctx) {
      const names = ctx.prompt.match(/([A-Z][a-z]+)\s*(?:&|and)\s*([A-Z][a-z]+)/);
      const couple = names ? `${names[1]} & ${names[2]}` : "Sam & Alex";
      return {
        title: couple,
        tagline: "We're getting married",
        emoji: "💍",
        theme: makeTheme("botanical"),
        sections: [
          { kind: "hero", eyebrow: "Save the date", title: couple, subtitle: "Are tying the knot — and we'd love you there to see it (and dance badly with us).", cta: "RSVP", emoji: "💐" },
          { kind: "countdown", heading: "Until we say I do", date: futureDate(120), note: "Ceremony at 3pm · Garden reception to follow" },
          { kind: "timeline", heading: "Our story", items: [
            { when: "2019", what: "Met reaching for the last sausage at a Bunnings sizzle" },
            { when: "2021", what: "Adopted a very opinionated cat" },
            { when: "2024", what: "Survived assembling flat-pack furniture together" },
            { when: "Now", what: "Making it official" },
          ] },
          { kind: "gallery", heading: "Moments", items: [
            { emoji: "🌅", caption: "First trip" },
            { emoji: "🐈", caption: "Meet Biscuit" },
            { emoji: "🏔️", caption: "The proposal" },
            { emoji: "🥂", caption: "Engagement drinks" },
          ] },
          { kind: "rsvp", heading: "Will you join us?", note: "Kindly reply by the end of the month." },
        ],
        footer: "With love, and a very long guest list",
      };
    },
  },
  {
    id: "gaming-clan",
    label: "Gaming clan",
    match: /clan|guild|squad|gaming|gamer|esports|minecraft|fortnite|valorant|league of|discord server|twitch/,
    build(ctx) {
      const clan = ctx.name ?? "Midnight Wombats";
      return {
        title: clan,
        tagline: "Gaming clan HQ",
        emoji: "🎮",
        theme: makeTheme("neonNoir"),
        sections: [
          { kind: "hero", eyebrow: "Clan HQ · Recruiting", title: clan, subtitle: "We play late, we rage-quit rarely, and we always revive our teammates. Mostly.", cta: "Join the squad", emoji: "🎮" },
          { kind: "stats", items: [
            { value: "1,337", label: "Wins" },
            { value: "42", label: "Members" },
            { value: "3am", label: "Avg. bedtime" },
          ] },
          { kind: "cards", heading: "The roster", items: [
            { emoji: "🦘", title: "xX_Roo_Xx", body: "Clan leader. Has never once checked the minimap." },
            { emoji: "🐨", title: "KoalaKarnage", body: "Sniper. Sleeps 20 hours, frags the other 4." },
            { emoji: "🦎", title: "GeckoGlitch", body: "Finds every exploit. Reports none of them." },
          ] },
          { kind: "timeline", heading: "Raid schedule", items: [
            { when: "Tue 8pm", what: "Ranked grind" },
            { when: "Fri 9pm", what: "Chaos night (no rules)" },
            { when: "Sun 4pm", what: "Training arc" },
          ] },
          { kind: "guestbook", heading: "Shoutbox", entries: [
            { name: "NoobSlayer", message: "gg last night, absolute scenes" },
            { name: "Mum", message: "dinner is ready" },
          ] },
        ],
        footer: "GG · No campers were harmed in the making of this site",
      };
    },
  },
  {
    id: "meme-museum",
    label: "Meme museum",
    match: /meme|museum|shitpost|cursed|brainrot|internet history/,
    build() {
      return {
        title: "The Museum of Cursed Memes",
        tagline: "Fine art from the dankest corners of the internet",
        emoji: "🖼️",
        theme: makeTheme("brutalPaper"),
        sections: [
          { kind: "hero", eyebrow: "Now showing · Free entry", title: "The Museum of Cursed Memes", subtitle: "A world-class collection of internet artefacts, lovingly curated and deeply unhinged.", cta: "Enter the galleries", emoji: "🗿" },
          { kind: "gallery", heading: "Permanent collection", items: [
            { emoji: "🐸", caption: "Frog, Contemplative (2008)" },
            { emoji: "🐕", caption: "Much Wow, Very Art" },
            { emoji: "🔥", caption: "This Is Fine (oil on canvas)" },
            { emoji: "🗿", caption: "Moai, Unbothered" },
            { emoji: "🍞", caption: "Bread Cat, Unknown Artist" },
            { emoji: "📉", caption: "Stonks, Late Period" },
          ] },
          { kind: "quote", text: "I didn't understand any of it and I've never felt more seen.", by: "A visitor, probably" },
          { kind: "guestbook", heading: "Visitor book", entries: [
            { name: "art_critic_99", message: "the frog spoke to me" },
            { name: "anon", message: "10/10 would get cursed again" },
          ] },
        ],
        footer: "No refunds. Gift shop closed indefinitely.",
      };
    },
  },
  {
    id: "pet-shrine",
    label: "Pet shrine",
    match: /\b(cat|kitten|kitty|dog|puppy|pup|doggo|pet|hamster|bunny|rabbit|guinea pig|parrot|budgie|axolotl|gecko|goldfish|ferret|shrine)\b/,
    build(ctx) {
      const animal = ctx.topic?.word ?? "pet";
      const emoji = ctx.topic?.emoji ?? "🐾";
      const name = ctx.name ?? (animal === "cat" ? "Princess Mochi" : animal === "dog" ? "Sir Barksalot" : "Our Little Legend");
      const neon = ctx.neon;
      return {
        title: neon ? `${name.toUpperCase()}.EXE` : `The ${name} Appreciation Society`,
        tagline: neon ? `A neon shrine to ${name}` : `A shrine to the greatest ${animal} alive`,
        emoji,
        theme: makeTheme(neon ? "neonNoir" : "cosy"),
        sections: [
          {
            kind: "hero",
            eyebrow: neon ? "// SYSTEM ONLINE // DEITY DETECTED" : `Est. whenever ${name} decided`,
            title: neon ? `${name.toUpperCase()}.EXE` : `All hail ${name}`,
            subtitle: neon
              ? `Welcome to the digital shrine of ${name}, supreme ruler of the household network. Offerings accepted in treats.`
              : `The ${animal} of legend. Professional napper, part-time menace, full-time love of our lives.`,
            cta: "Leave an offering",
            emoji,
          },
          { kind: "stats", items: [
            { value: "18h", label: "Daily naps" },
            { value: "∞", label: "Treats demanded" },
            { value: "0", label: "Regrets" },
          ] },
          { kind: "gallery", heading: neon ? "SACRED_ARCHIVES/" : "The portrait gallery", items: [
            { emoji, caption: "Majestic, at dawn" },
            { emoji: "📦", caption: "Box: claimed" },
            { emoji: "☀️", caption: "Sunbeam acquisition" },
            { emoji: "🧶", caption: "The Great Yarn Incident" },
          ] },
          { kind: "cards", heading: "Commandments", items: [
            { emoji: "🍗", title: "Thou shalt feed", body: "Dinner is at 5. It was at 5 yesterday. It is now 4:12. Feed." },
            { emoji: "🛋️", title: "The couch is mine", body: "All soft surfaces belong to the shrine." },
            { emoji: "💤", title: "Do not disturb", body: "Unless you have treats. Then disturb." },
          ] },
          { kind: "guestbook", heading: "Worshipper guestbook", entries: [
            { name: "Neighbour", message: `${name} stared at me through the window for 40 min. I feel blessed.` },
          ] },
        ],
        footer: `Approved by ${name} (paw print on file)`,
      };
    },
  },
  {
    id: "portfolio",
    label: "Portfolio",
    match: /portfolio|photograph|artist|illustrat|designer|my work|resume|cv\b|about me|personal site|personal website/,
    build(ctx) {
      const name = ctx.name ?? "Jordan Lee";
      const isPhoto = /photo/.test(ctx.lower);
      return {
        title: name,
        tagline: isPhoto ? "Photographer chasing good light" : "Maker of nice things on the internet",
        emoji: isPhoto ? "📷" : "✏️",
        theme: makeTheme(/bold|loud|brutal/.test(ctx.lower) ? "brutalPaper" : "surf"),
        sections: [
          { kind: "hero", eyebrow: "Hi, I'm", title: name, subtitle: isPhoto ? "I take photos of oceans, dogs and people who forgot I was there." : "I make things — sometimes useful, always with heart. Have a look around.", cta: "See my work", emoji: isPhoto ? "📷" : "👋" },
          { kind: "gallery", heading: "Selected work", items: [
            { emoji: "🌊", caption: "Salt (2025)" },
            { emoji: "🏙️", caption: "Night Shift" },
            { emoji: "🌿", caption: "Small Green Things" },
            { emoji: "🐕", caption: "Good Dogs of Bondi" },
            { emoji: "🌄", caption: "Outback Hours" },
            { emoji: "🎞️", caption: "35mm Diaries" },
          ] },
          { kind: "about", heading: "About", body: "Based somewhere sunny. Fuelled by flat whites. Currently obsessed with making the internet feel personal again." },
          { kind: "rsvp", heading: "Say g'day", note: "Collabs, commissions or just a chat — drop a line." },
        ],
        footer: `© ${name}`,
      };
    },
  },
  {
    id: "band",
    label: "Band / music",
    match: /band|music|mixtape|\bdj\b|album|gig|playlist|karaoke|garage/,
    build(ctx) {
      const band = ctx.name ?? "The Feral Galahs";
      return {
        title: band,
        tagline: "Loud. Local. Slightly out of tune.",
        emoji: "🎸",
        theme: makeTheme("arcade"),
        sections: [
          { kind: "hero", eyebrow: "New single out now", title: band, subtitle: "Three chords, two amps and one very patient neighbour.", cta: "Get gig tickets", emoji: "🎸" },
          { kind: "timeline", heading: "Tour dates", items: [
            { when: "Fri 12", what: "The Corner Pub, Newtown" },
            { when: "Sat 20", what: "Mum's garage (BYO earplugs)" },
            { when: "Sun 28", what: "Surf club sesh" },
          ] },
          { kind: "cards", heading: "Discography", items: [
            { emoji: "💿", title: "Sausage Sizzle Summer", body: "Debut EP. Cult classic among our mates." },
            { emoji: "📼", title: "Live at the Servo", body: "Recorded in one take. You can hear the slushie machine." },
            { emoji: "🎤", title: "Galah Galah", body: "The single. It slaps. It squawks." },
          ] },
          { kind: "guestbook", heading: "Fan mail", entries: [{ name: "Biggest fan", message: "play wonderwall" }] },
        ],
        footer: "Rock on 🤘",
      };
    },
  },
  {
    id: "travel",
    label: "Trip / travel",
    match: /trip|travel|road ?trip|holiday|vacation|backpack|honeymoon|itinerary|lap of oz/,
    build(ctx) {
      const place = ctx.prompt.match(/\b(?:to|in|around)\s+([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)?)/)?.[1] ?? "the Big Lap";
      return {
        title: `Our ${place} Adventure`,
        tagline: "Sunscreen, snacks and questionable navigation",
        emoji: "🚐",
        theme: makeTheme("surf"),
        sections: [
          { kind: "hero", eyebrow: "Travel diary", title: `Our ${place} Adventure`, subtitle: "Follow along as we get lost, find great coffee and take far too many sunset photos.", cta: "See the route", emoji: "🗺️" },
          { kind: "countdown", heading: "Wheels up in", date: futureDate(40), note: "Bags: not yet packed" },
          { kind: "timeline", heading: "The plan (subject to change)", items: [
            { when: "Day 1", what: "Leave late, stop for a pie immediately" },
            { when: "Day 3", what: "Beach, beach, more beach" },
            { when: "Day 7", what: "Big Thing photo op (Banana? Prawn? Both.)" },
          ] },
          { kind: "gallery", heading: "Postcards", items: [
            { emoji: "🏖️", caption: "Day 3 beach" },
            { emoji: "🦘", caption: "Local welcoming committee" },
            { emoji: "🌅", caption: "Sunset #47" },
            { emoji: "🥧", caption: "The pie that started it all" },
          ] },
        ],
        footer: "Not sponsored by any servo (yet)",
      };
    },
  },
  {
    id: "recipes",
    label: "Recipes / food",
    match: /recipe|cook|bak(e|ing)|food|nan'?s|grandma|kitchen|sourdough|bbq|barbie|pavlova|lamington|dinner club/,
    build(ctx) {
      const owner = ctx.name ? `${ctx.name}'s` : /nan|grandma|nonna/.test(ctx.lower) ? "Nan's" : "Our Family";
      return {
        title: `${owner} Kitchen`,
        tagline: "Recipes passed down, spilled on, and loved",
        emoji: "🥧",
        theme: makeTheme("cosy"),
        sections: [
          { kind: "hero", eyebrow: "Family recipe book", title: `${owner} Kitchen`, subtitle: "Every recipe here has survived at least one Christmas and several 'improvements'.", cta: "Get cooking", emoji: "👩‍🍳" },
          { kind: "cards", heading: "The classics", items: [
            { emoji: "🍰", title: "Pavlova", body: "Crunchy outside, marshmallowy in. NZ can fight us." },
            { emoji: "🧁", title: "Lamingtons", body: "Coconut everywhere. Including the dog." },
            { emoji: "🥧", title: "Sunday Pie", body: "The secret ingredient is patience (and butter)." },
          ] },
          { kind: "quote", text: "Measure with your heart, then add a bit more butter.", by: "Nan, every time" },
          { kind: "guestbook", heading: "Kitchen notes", entries: [{ name: "Cousin Tim", message: "Made the pav. Collapsed. Still ate it." }] },
        ],
        footer: "Lick the spoon responsibly",
      };
    },
  },
  {
    id: "event",
    label: "Event",
    match: /party|bbq|festival|meetup|trivia|launch|reunion|hens|bucks|picnic|fundraiser|quiz night|event|invite|halloween|christmas|new year/,
    build(ctx) {
      const kind = ctx.lower.match(/trivia|reunion|picnic|halloween|christmas|hens|bucks|fundraiser|bbq|festival/)?.[0];
      const title = kind ? `The Great ${cap(kind)}` : "The Big Night";
      const emoji = kind === "halloween" ? "🎃" : kind === "christmas" ? "🎄" : kind === "bbq" ? "🌭" : kind === "trivia" ? "🧠" : "🎉";
      return {
        title,
        tagline: "You're on the list",
        emoji,
        theme: makeTheme(kind === "halloween" ? "limeZine" : "bubblegum", { confetti: true }),
        sections: [
          { kind: "hero", eyebrow: "You're invited", title, subtitle: "Good people, good snacks, dubious playlist. Be there or be a lesser version of yourself.", cta: "I'm in", emoji },
          { kind: "countdown", heading: "Kicking off in", date: futureDate(14), note: "7pm · Address in your RSVP confirmation" },
          { kind: "cards", heading: "What's happening", items: [
            { emoji: "🍕", title: "Food", body: "There will be snacks. There will be too many snacks." },
            { emoji: "🎶", title: "Tunes", body: "Requests accepted. Nickelback declined." },
            { emoji: "📸", title: "Photo booth", body: "Props provided. Dignity optional." },
          ] },
          { kind: "rsvp", heading: "Lock it in", note: "Bring a plate, bring a mate." },
        ],
        footer: "See you there, legend",
      };
    },
  },
  {
    id: "space",
    label: "Space / sci-fi",
    match: /space|galaxy|planet|alien|rocket|astronaut|cosmic|star ?wars|ufo|cyberpunk|neon|synthwave|vaporwave/,
    build(ctx) {
      const name = ctx.name ?? "Mission Control";
      return {
        title: name,
        tagline: "Transmitting from somewhere past the Milky Way",
        emoji: "🚀",
        theme: makeTheme("neonNoir", { accent: "#c6ff3d", accent2: "#00e5ff" }),
        sections: [
          { kind: "hero", eyebrow: "Incoming transmission", title: name, subtitle: "All systems nominal. Snacks: loaded. Destination: somewhere with better wifi.", cta: "Launch", emoji: "🛸" },
          { kind: "stats", items: [
            { value: "9", label: "Planets (Pluto counts)" },
            { value: "0.7c", label: "Top speed" },
            { value: "∞", label: "Space snacks" },
          ] },
          { kind: "cards", heading: "Crew log", items: [
            { emoji: "👽", title: "First contact", body: "They wanted to know about Vegemite. We panicked." },
            { emoji: "🪐", title: "Ring tour", body: "Saturn: 10/10. Uranus: no comment." },
            { emoji: "☄️", title: "Near miss", body: "Comet. Big one. Mild screaming." },
          ] },
        ],
        footer: "Over and out 📡",
      };
    },
  },
];

/** Catch-all when nothing above matches: still personal, still fun. */
export const FALLBACK: Archetype = {
  id: "vibe",
  label: "Anything goes",
  match: /.*/,
  build(ctx) {
    const emoji = ctx.topic?.emoji ?? "✨";
    const subject = ctx.topic?.word ? `${cap(ctx.topic.word)} Zone` : "Good Vibes Only";
    const title = ctx.name ? `${ctx.name}'s ${subject}` : subject;
    return {
      title,
      tagline: "A tiny corner of the internet, made just for this",
      emoji,
      theme: makeTheme(ctx.neon ? "neonNoir" : "limeZine"),
      sections: [
        { kind: "hero", eyebrow: "Welcome, traveller", title, subtitle: `You asked for "${ctx.prompt.slice(0, 90)}${ctx.prompt.length > 90 ? "…" : ""}" — so here it is, in all its glory.`, cta: "Explore", emoji },
        { kind: "cards", heading: "Highlights", items: [
          { emoji: "🌟", title: "The best bit", body: "Honestly, all of it. But especially this part." },
          { emoji: "🎯", title: "Why it rules", body: "Because it was made with intent and a little chaos." },
          { emoji: "💌", title: "Share it", body: "Send it to someone who needs to see it today." },
        ] },
        { kind: "guestbook", heading: "Sign the guestbook", entries: [{ name: "First visitor", message: "this is the best site on the internet" }] },
      ],
      footer: "Made for fun on aduma.io",
    };
  },
};
