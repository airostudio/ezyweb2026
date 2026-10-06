/** Global site config: one place for names, URLs and navigation. */
export const siteConfig = {
  name: "Webese",
  company: "Ezyweb Solutions",
  tagline: "Type a vibe. Get a website.",
  description:
    "Webese turns one sentence into a gorgeous, shareable website in seconds. Birthday invites, pet shrines, meme museums, wedding pages — free to try, no account needed.",
  // Explicit env wins; on Vercel fall back to the project's production domain.
  url:
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "https://webese.ai"),
  publishDomain: "webese.ai",
  twitter: "@webese_ai",
  nav: [
    { href: "/create", label: "Create" },
    { href: "/gallery", label: "Gallery" },
    { href: "/pricing", label: "Pricing" },
    { href: "/about", label: "About" },
  ],
} as const;
