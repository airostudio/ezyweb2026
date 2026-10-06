/**
 * Marketing content: example prompts, community gallery and pricing.
 * Kept as plain data so copy tweaks never touch component code.
 */

/** Rotating placeholders in the hero prompt box. */
export const EXAMPLE_PROMPTS = [
  "Make me a neon cyberpunk shrine for my cat Mochi",
  "Birthday party site for my 8-year-old who loves dinosaurs",
  "A museum of cursed memes with a visitor guestbook",
  "Wedding page for Priya & Tom with a countdown and RSVP",
  "HQ for our gaming clan, the Midnight Wombats",
  "Nan's recipe book, pavlova first obviously",
  "Road trip diary for our lap around Tasmania",
  "A fan page for my garage band, The Feral Galahs",
] as const;

/** Big friendly starters below the prompt box (label → full prompt). */
export const STARTERS = [
  { emoji: "🐱", label: "Pet shrine", prompt: "Make me a neon cyberpunk shrine for my cat Mochi" },
  { emoji: "🦖", label: "Kid's party", prompt: "Birthday party site for my 8-year-old Max who loves dinosaurs" },
  { emoji: "💍", label: "Wedding", prompt: "Wedding website for Priya & Tom with a countdown, our story and RSVP" },
  { emoji: "🗿", label: "Meme museum", prompt: "A museum of cursed memes with a visitor guestbook" },
  { emoji: "🎮", label: "Gaming clan", prompt: "HQ for our gaming clan called Midnight Wombats" },
  { emoji: "🥧", label: "Family recipes", prompt: "Nan's recipe book with pavlova and lamingtons" },
] as const;

/** The "Try a live demo" button picks one of these at random. */
export const DEMO_PROMPTS = [
  "Make me a neon cyberpunk shrine for my cat Mochi",
  "Birthday party site for my 8-year-old Max who loves dinosaurs",
  "A museum of cursed memes with a visitor guestbook",
  "HQ for our gaming clan called Midnight Wombats",
] as const;

/** Follow-up suggestions in the studio chat. */
export const EDIT_SUGGESTIONS = [
  "Make the background darker",
  "Add a photo gallery",
  "Make it pink",
  "Add a countdown",
  "Fancier font please",
  "More confetti!",
  "Make the headline bigger",
  "Add a guestbook",
] as const;

export type GalleryCategory = "fun" | "personal" | "events" | "pets" | "gaming" | "love";

export const GALLERY_CATEGORIES: { id: GalleryCategory | "all"; label: string; emoji: string }[] = [
  { id: "all", label: "Everything", emoji: "✨" },
  { id: "fun", label: "Just for fun", emoji: "🤪" },
  { id: "personal", label: "Personal", emoji: "🙋" },
  { id: "events", label: "Events", emoji: "🎉" },
  { id: "pets", label: "Pets", emoji: "🐾" },
  { id: "gaming", label: "Gaming", emoji: "🎮" },
  { id: "love", label: "Love", emoji: "💘" },
];

export interface GalleryItem {
  id: string;
  title: string;
  prompt: string;
  emoji: string;
  category: GalleryCategory;
  author: string;
  remixes: number;
  /** Thumbnail palette: [bg, text, accent, accent2] */
  colors: [string, string, string, string];
  style: "neon" | "playful" | "elegant" | "brutal" | "retro" | "cosy";
}

export const GALLERY: GalleryItem[] = [
  { id: "mochi-exe", title: "MOCHI.EXE", prompt: "Make me a neon cyberpunk shrine for my cat Mochi", emoji: "🐱", category: "pets", author: "@jess.k", remixes: 2841, colors: ["#06070d", "#effaff", "#00e5ff", "#ff2bd6"], style: "neon" },
  { id: "max-turns-8", title: "Max turns 8!", prompt: "Birthday party site for my 8-year-old Max who loves dinosaurs", emoji: "🦖", category: "events", author: "@dadjokes", remixes: 1920, colors: ["#f3fbe8", "#13300f", "#ff8a1f", "#46c21b"], style: "playful" },
  { id: "cursed-memes", title: "Museum of Cursed Memes", prompt: "A museum of cursed memes with a visitor guestbook", emoji: "🗿", category: "fun", author: "@notacurator", remixes: 4410, colors: ["#fffbe6", "#111111", "#ff3d00", "#2f5bff"], style: "brutal" },
  { id: "priya-tom", title: "Priya & Tom", prompt: "Wedding website for Priya & Tom with a countdown, our story and RSVP", emoji: "💍", category: "love", author: "@priyaplans", remixes: 1203, colors: ["#f8f4ec", "#2b2a22", "#8a6d3b", "#6b8f71"], style: "elegant" },
  { id: "midnight-wombats", title: "Midnight Wombats", prompt: "HQ for our gaming clan called Midnight Wombats", emoji: "🎮", category: "gaming", author: "@roo_xx", remixes: 3302, colors: ["#06070d", "#effaff", "#00e5ff", "#ff2bd6"], style: "neon" },
  { id: "nans-kitchen", title: "Nan's Kitchen", prompt: "Nan's recipe book with pavlova and lamingtons", emoji: "🥧", category: "personal", author: "@bakedbybec", remixes: 987, colors: ["#fbf3e8", "#3a2618", "#d9622b", "#e6a83a"], style: "cosy" },
  { id: "feral-galahs", title: "The Feral Galahs", prompt: "A fan page for my garage band called The Feral Galahs", emoji: "🎸", category: "fun", author: "@galahgang", remixes: 756, colors: ["#120b2e", "#fdf6ff", "#ffe14d", "#22f0b5"], style: "retro" },
  { id: "tassie-lap", title: "Our Tasmania Adventure", prompt: "Road trip diary for our trip to Tasmania", emoji: "🚐", category: "personal", author: "@vanlife_vic", remixes: 1450, colors: ["#fff4ea", "#102a3a", "#ff6b4a", "#1aa7b8"], style: "cosy" },
  { id: "sir-barksalot", title: "Sir Barksalot", prompt: "Appreciation society for my dog named Sir Barksalot", emoji: "🐶", category: "pets", author: "@woofwoof", remixes: 2210, colors: ["#fbf3e8", "#3a2618", "#d9622b", "#e6a83a"], style: "cosy" },
  { id: "halloween", title: "The Great Halloween", prompt: "Spooky Halloween party invite with costume contest", emoji: "🎃", category: "events", author: "@ghoulfriend", remixes: 1688, colors: ["#0b0b0b", "#f3ffe0", "#c6ff3d", "#ff2bd6"], style: "brutal" },
  { id: "mission-control", title: "Mission Control", prompt: "Space themed site for my kid's rocket obsession", emoji: "🚀", category: "fun", author: "@astro.ash", remixes: 640, colors: ["#06070d", "#effaff", "#c6ff3d", "#00e5ff"], style: "neon" },
  { id: "jordan-photo", title: "Jordan Lee — Photos", prompt: "Portfolio for my photography of oceans and dogs", emoji: "📷", category: "personal", author: "@jlee", remixes: 1120, colors: ["#fff4ea", "#102a3a", "#ff6b4a", "#1aa7b8"], style: "cosy" },
  { id: "trivia", title: "The Great Trivia", prompt: "Trivia night at the pub for our netball team", emoji: "🧠", category: "events", author: "@quizmaster", remixes: 532, colors: ["#fff6e9", "#2a1338", "#ff4fa3", "#2ad1a0"], style: "playful" },
  { id: "pixel-proposal", title: "Will You?", prompt: "A pixel-art arcade page to propose to my gamer girlfriend", emoji: "💘", category: "love", author: "@p1ayer2", remixes: 3890, colors: ["#120b2e", "#fdf6ff", "#ffe14d", "#22f0b5"], style: "retro" },
  { id: "axolotl", title: "Axolotl Appreciation", prompt: "Shrine for my axolotl named Gerald", emoji: "🦎", category: "pets", author: "@gerald.fan", remixes: 802, colors: ["#fbf3e8", "#3a2618", "#ff4fa3", "#e6a83a"], style: "cosy" },
  { id: "guild-hall", title: "Guild Hall", prompt: "Minecraft guild hall with schedule and shoutbox", emoji: "⛏️", category: "gaming", author: "@blockhead", remixes: 1404, colors: ["#120b2e", "#fdf6ff", "#22f0b5", "#ffe14d"], style: "retro" },
];

/** Shown in the social-proof ticker. */
export const RECENT_CREATIONS = [
  "🦖 Max turns 8!", "🐱 MOCHI.EXE", "🗿 Museum of Cursed Memes", "💍 Priya & Tom", "🎮 Midnight Wombats",
  "🥧 Nan's Kitchen", "🎸 The Feral Galahs", "🚐 Tassie Lap '26", "🎃 Ghoul Gala", "🦎 Gerald the Axolotl",
  "🏉 Under 9s Footy Legends", "🌮 Taco Tuesday Society", "🪴 Plant Parenthood", "🦜 Galah Appreciation",
];

export interface Plan {
  id: "free" | "pro" | "unlimited";
  name: string;
  price: { monthly: number; yearly: number };
  blurb: string;
  features: string[];
  cta: string;
  highlight?: boolean;
}

/** Prices in AUD, GST inclusive. */
export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: { monthly: 0, yearly: 0 },
    blurb: "For dabbling, gifting and pure chaos.",
    features: ["3 live sites", "Free yourname.webese.ai address", "Unlimited generations & edits", "Remix anything in the gallery", "Small “Made with Webese” badge"],
    cta: "Start free",
  },
  {
    id: "pro",
    name: "Pro",
    price: { monthly: 8, yearly: 6 },
    blurb: "For people who make a site for everything.",
    features: ["25 live sites", "Connect your own domain", "Remove the Webese badge", "Password-protected sites", "Visitor stats & guestbook moderation", "Upload your own photos (10GB)"],
    cta: "Go Pro",
    highlight: true,
  },
  {
    id: "unlimited",
    name: "Unlimited",
    price: { monthly: 18, yearly: 14 },
    blurb: "For families, clubs and serial creators.",
    features: ["Unlimited live sites", "Up to 5 custom domains", "Invite up to 6 co-editors", "Priority generation (faster magic)", "100GB photo & video storage", "A real human on support"],
    cta: "Go Unlimited",
  },
];

export const PRICING_FAQ = [
  { q: "Is the free plan actually free?", a: "Yep. No card, no trial timer, no catch. You can make and publish sites forever. We make money when people want extras like custom domains." },
  { q: "Do I need an account to try it?", a: "Nope. Type a prompt and go. You only need an account to publish or save across devices — and that's one tap with Google, Apple or a magic link." },
  { q: "Can I cancel anytime?", a: "Anytime, from settings, in two clicks. Your sites drop back to the free plan limits — we never delete your stuff." },
  { q: "What about my custom domain?", a: "Pro and Unlimited plans connect any domain you own. We walk you through the DNS bit with copy-paste records, and SSL is automatic." },
  { q: "Can I use Webese for my business?", a: "You can, but Webese is built for fun stuff. If you need a proper business site, our friends at Ezyweb Solutions have you covered." },
];
