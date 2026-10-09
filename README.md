# aduma.io — type a vibe, get a website ✨

The direct-to-consumer, just-for-fun website builder from **Ezyweb Solutions**.
Describe any site in one sentence — a dinosaur birthday invite, a neon shrine
for your cat, a museum of cursed memes — and watch it build itself live, then
tweak it by chatting and publish it to `yourname.aduma.io` in one tap.

This repo is the white-label front end for the **aduma.io** generation
engine. Out of the box it ships with a realistic **mock generator** so the
whole product works end-to-end with zero configuration.

---

## Quick start

```bash
npm install
npm run dev          # http://localhost:3000
```

No env vars are needed for local development: auth uses a dev-only secret,
magic links are shown on screen, generation uses the mock, and drafts live in
`localStorage`.

| Script              | What it does                         |
| ------------------- | ------------------------------------ |
| `npm run dev`       | Dev server                           |
| `npm run build`     | Production build (also type-checks)  |
| `npm start`         | Serve the production build           |
| `npm run lint`      | ESLint (flat config, `next/core-web-vitals`) |
| `npm run typecheck` | `tsc --noEmit` (strict + `noUncheckedIndexedAccess`) |

Requires Node 20+.

---

## What's inside

| Route                 | What it is |
| --------------------- | ---------- |
| `/`                   | Landing: animated mesh hero, prompt box with typewriter examples, live demo, social proof, how-it-works, remixable inspiration strip, pricing teaser, final CTA |
| `/create`             | The studio: chat + live preview, streaming generation with a "magic in progress" takeover, follow-up edits, device previews, code view, publish flow |
| `/gallery`            | Community examples with category filters, search, sort and "Remix" |
| `/pricing`            | Free / Pro / Bottomless (AUD, monthly ↔ yearly) + FAQ (with FAQ JSON-LD) |
| `/about`              | The Ezyweb → aduma.io story |
| `/signin`             | Magic link + Google + Apple |
| `/auth/verify`        | Magic-link landing (exchanges token for a session) |
| `/dashboard`          | My Sites: live thumbnails, edit / view / delete |
| `/dashboard/settings` | Profile (RHF + Zod), danger zone, sign out |
| `/p/[slug]`           | Local stand-in for a published `slug.aduma.io` site |
| `/api/generate`       | **Edge** · streams NDJSON generation events (mock or proxied to aduma.io) |
| `/api/subdomain`      | **Edge** · subdomain availability check (mock) |
| `/api/magic-link`     | **Edge** · issues signed sign-in links |
| `/api/auth/*`         | NextAuth v5 |

Plus `opengraph-image` / `twitter-image` (generated share cards), `icon.png`,
`apple-icon`, `robots.txt`, `sitemap.xml`, `manifest.webmanifest`, route and
global error boundaries, and a custom 404.

### Project layout

```
app/                    routes, metadata files, error boundaries, globals.css
components/
  brand.tsx             aduma.io logo (theme-aware) + robot mark
  prompt-box.tsx        the hero prompt (RHF + Zod, typewriter, ⌘K, live demo)
  create/               studio, generating overlay, publish dialog
  home/ gallery/ pricing/ dashboard/ auth/ layout/
  ui/                   shadcn-style primitives (Button, Dialog, Toast) on Radix
lib/
  generator/            the mock aduma.io engine (see below)
  aduma-client.ts      browser NDJSON stream reader
  drafts.ts             localStorage draft store (+ optional Supabase mirror)
  schemas.ts            shared Zod (zod/mini) schemas — client + server
  analytics.ts          Plausible / PostHog shim: track("event")
  content.ts            all marketing copy, examples, gallery, plans
auth.ts                 NextAuth config
public/logo26.png       original logo artwork
public/brand/           optimised logo variants (light, dark, square mark)
```

---

## Design system

**Hand-rolled CSS, no framework.** `app/globals.css` uses cascade layers
(`reset → tokens → base → components → utilities`); feature styles are CSS
Modules next to their components.

- **Tokens** — raw palette (`--cyan`, `--magenta`, `--wattle` gold, `--zap`
  lime) plus semantic tokens (`--bg`, `--fg`, `--fg-muted`, `--line`, …)
  redefined under `[data-theme="dark"]`. Text-safe accent variants
  (`--cyan-ink`, `--magenta-ink`) keep AA contrast in both themes.
- **Theme** — system preference by default, manual System → Light → Dark
  toggle in the header, persisted to `localStorage`, applied by an inline
  script before first paint (no flash).
- **Type** — Geist (UI), Bricolage Grotesque (display), Geist Mono (labels),
  all self-hosted via `next/font`.
- **Primitives** — `.btn` (+ `-primary`, `-electric`, `-outline`, `-ghost`,
  sizes), `.input`, `.input-group`, `.card`, `.glass`, `.chip`, `.badge`,
  `.kbd`, `.ring-electric` (animated gradient border), `.glow`, `.grain`,
  `.text-gradient`, `.squiggle`, dialog + toast styles.
- **shadcn/ui** — the component *API* (cva variants, `asChild` via Radix Slot,
  Radix Dialog) is kept, but styled by the CSS above rather than Tailwind.
- **Motion** — Framer Motion via `LazyMotion` + `m.*` (the animation engine
  loads after hydration). `MotionConfig reducedMotion="user"` and a global
  `prefers-reduced-motion` rule respect OS settings everywhere, including
  inside generated sites.

### Brand

The **aduma.io** logo lives in `components/brand.tsx`: `<BrandLogo />` renders
the full logo and `<BrandMark />` the square robot. The source artwork is
`public/logo26.png`; `public/brand/` holds the derived files: `aduma-logo.png`
(light backgrounds), `aduma-logo-dark.png` (wordmark recoloured off-white for
dark mode), and `aduma-mark.png` (square robot for app icons and badges).
`app/icon.png` is the robot's head, cropped for the favicon. `<BrandLogo />`
renders both theme variants and CSS shows the right one; the hidden image is
never downloaded. To swap the logo, replace those files and keep the names.

---

## The AI site builder

### Engines

`POST /api/generate` picks an engine automatically (override with `AI_PROVIDER`):

| Priority | When | Engine |
| -------- | ---- | ------ |
| 1 | `ADUMA_API_URL` set | Proxy to a hosted aduma.io engine (same NDJSON protocol) |
| 2 | `ANTHROPIC_API_KEY` set | **Claude Haiku 5.5** (`claude-haiku-5-5`), the cheapest Claude model |
| 3 | `OPENAI_API_KEY` set | **GPT-5.6 Luna** (`gpt-5.6-luna`), OpenAI's budget tier |
| 4 | nothing set | Built-in mock generator (free, offline, great for dev) |

**Every plan uses the same cheap model.** Plans differ only in limits and
features (below), never in model quality.

Each build is one streamed call (`lib/ai/anthropic.ts`, `lib/ai/openai.ts`):

- **System prompt** (`lib/ai/prompt.ts`): one single-page site, hand-rolled CSS
  in one `<style>`, no frameworks, CDNs, external scripts or images, mobile-first,
  accessible, under ~22 KB. It's frozen text, marked cacheable so repeat builds
  read it from the prompt cache.
- **Cost controls:** `max_tokens` is capped at 12,000 (`lib/ai/shared.ts`),
  with low reasoning effort. On Haiku 5.5 a typical build costs a fraction of
  a cent: about 2k input tokens plus 6–8k output tokens. Edits resend the
  current page, capped at 120k characters.
- **Clean-up** (`cleanHtml`): fences and chatter are stripped. External
  scripts, iframes and non-font stylesheets are removed, so pages stay
  self-contained. The title and description are extracted for cards.
- Refusals, rate limits and auth errors become friendly messages. A failed
  build doesn't count against the user's quota.

### Plans and budget guards

Defined once in `lib/plans.ts`. The pricing page, studio and API all read from it.

| | Free ($0) | Pro ($8/mo, $6 yearly) | Bottomless ($12/mo, $9 yearly) |
|---|---|---|---|
| Sites kept | 3 | 10 | 50 (fair use, shown as "bottomless") |
| New builds / day | 6 | 25 | 40 |
| Edits per site | 15 | 40 | 60 |
| Share on `name.aduma.io` | ✓ | ✓ | ✓ |
| Custom domain | – | ✓ | ✓ |
| Remove badge | – | ✓ | ✓ |
| View / copy code | – | ✓ | ✓ |
| Simple visual editor | – (upgrade prompt) | ✓ | ✓ |

- **Site count** is enforced in the studio: the user sees a "your sites are
  full" dialog with options to delete a site or upgrade.
- **Builds and edits** are enforced server-side in `/api/generate` before any
  tokens are spent (`lib/quota.ts`). Usage is keyed by the signed-in email, or
  by IP for guests. Configure **Upstash Redis** for production; the in-memory
  fallback only counts per server instance.
- **"Bottomless"** is deliberately not called "unlimited". Under Australian
  Consumer Law an "unlimited" claim has to be literally true, so the fair-use
  cap is disclosed on the pricing card and in the FAQ.
- **Plan lookup:** from Stripe subscriptions, cached in the session (see
  Payments), with `PLAN_OVERRIDES` for manual grants.

### Simple visual editor (Pro and Bottomless)

The studio's **Edit** button (`components/create/visual-editor.tsx`) lets owners
click any text on their site and type, and change the site's colours (its CSS
custom properties), then **Save** or **Discard**. It runs entirely in the
browser, so there are no AI calls and it doesn't use the edit quota.

The page is parsed into a clean copy in the app. Plain-text elements are
tagged, and the sandboxed frame shows an edit-mode version with the page's own
scripts paused. Each change is posted back and applied as text only, never
as HTML, to the clean copy. So scripts, confetti and timers never leak into
the saved page, and the editor's helpers are never saved. Free users see a
locked Edit button that opens an upgrade prompt.

### Source protection

Published pages (`/p/[slug]`) inject a deterrent script (`lib/protect.ts`). It
blocks right-click, dragging and the view-source, save and devtools shortcuts,
both inside the site and on the host page. The site HTML is loaded
client-side into a sandboxed frame, so the browser's "view source" shows only
the app shell. On Free, the studio's Code view is locked too.

This stops casual copying. It can't stop a determined person, because
anything a browser renders can be extracted, so treat it as a deterrent, not DRM.

### Event protocol

`POST /api/generate` with `{ prompt, siteId?, spec?, html? }` (`siteId` plus
`html`/`spec` means an edit) responds with `application/x-ndjson`:

```ts
type GenerateEvent =
  | { type: "stage"; stage: number; label: string }      // progress (0–4)
  | { type: "thought"; text: string }                    // narration
  | { type: "html"; chunk: string }                      // streamed markup
  | { type: "done"; spec: SiteSpec | null; html: string; summary: string; title?: string | null; tagline?: string | null }
  | { type: "error"; message: string; code?: "quota" | "plan" };
```

Quota rejections return HTTP 429 `{ error, code: "quota" }` before streaming starts.

### The mock engine

`lib/generator/` parses the prompt (names, ages, topics, vibes) and picks one of
12 archetypes and 9 themes. It renders an interactive page and supports
follow-up edits such as "make it darker", "add a photo gallery" or "make it
pink". It's what runs when no AI key is configured.

## Auth

NextAuth v5 (Auth.js) with JWT sessions, so no database is required and it
runs on the edge.

- **Magic link:** `/api/magic-link` signs a 15-minute JWT with `AUTH_SECRET`
  (via `jose`) and emails it with [Resend](https://resend.com). The sender
  (`AUTH_EMAIL_FROM`, default `hello@aduma.io`) must use a domain **verified in
  Resend**. Otherwise Resend rejects the email, the user sees "We couldn't send
  your sign-in email" and the reason shows up in the Vercel logs. In
  development, links are shown on screen instead. Sign-in links are never
  logged in production. To make links single-use, store the token's `jti`
  (Supabase/Upstash) and reject repeats in `verifyMagicToken`.
- **Google / Apple** — enabled automatically when their env vars are present.
- Try-before-you-sign-up: nothing requires an account except syncing across
  devices. Guests can create *and* publish, and get a gentle nudge to sign in.

## Drafts

`lib/drafts.ts` is a tiny `useSyncExternalStore` store over `localStorage`
(synced across tabs). Set the Supabase env vars and every save/delete is
mirrored to a `drafts` table (the SDK is lazy-loaded, so no cost when unused):

```sql
create table public.drafts (
  id uuid primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
-- Add RLS policies keyed to your auth user before going live.
```

## Analytics

`track("event", props)` (in `lib/analytics.ts`) no-ops unless a provider is
configured. Set `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` and/or `NEXT_PUBLIC_POSTHOG_KEY`;
scripts load after the page is interactive. The events already instrumented
are prompt submits, generation success/failure, edits, remixes, demo clicks,
publish, custom domains, sign-in starts and upgrade clicks.

## Payments (Stripe)

Upgrades use **Stripe Checkout**, and plan management uses Stripe's hosted
**billing portal**. Stripe is the source of truth, so there's no database to run.

**Flow**
1. Pricing → **Go Pro** / **Go Bottomless** calls `POST /api/checkout`
   (`lib/billing.ts`). Signed-out visitors go to sign-in first, and come back to
   `/pricing?checkout=pro&interval=year`, where checkout resumes automatically.
2. Checkout creates a monthly or yearly AUD subscription, tagged with
   `metadata.plan`. The existing Stripe customer is reused when the email
   matches, and promotion codes are allowed.
3. Stripe returns the buyer to `/dashboard?upgraded=pro`. The dashboard calls
   `useSession().update({...})`, which re-reads the plan from Stripe, then shows
   confetti and a welcome dialog.
4. Paid users see **Manage subscription** in Settings and **Your plan · manage**
   on the pricing page. Both open the billing portal: switch plan, update card,
   get invoices, cancel. Existing subscribers who pick another plan go to the
   portal too, so nobody ends up with two subscriptions.

**How plans are resolved:** `resolvePlan(email)` checks `PLAN_OVERRIDES`
first, then the customer's active, trialing or past-due Stripe subscriptions.
The highest plan wins. The result is cached in the signed session token for 5
minutes, so upgrades, downgrades and cancellations take effect within 5
minutes, or instantly after checkout. The API's quotas read the same session
plan.

**Setup**
1. Set `STRIPE_SECRET_KEY` (start with a `sk_test_…` key and test cards).
2. In the Stripe dashboard, open **Settings → Billing → Customer portal** and
   save a configuration. Enable plan switching and add your products if you
   want users to change plans there. The portal API errors until this is saved.
3. Optional: create Prices in Stripe and set `STRIPE_PRICE_*`. Otherwise each
   checkout uses inline AUD prices from `PAID_PRICES`.
4. Sign-in has to work in production for anyone to pay. Configure
   `RESEND_API_KEY` for magic links, and/or Google or Apple.

Prices are GST-inclusive amounts. If you're GST-registered, configure tax
settings in Stripe so invoices show GST correctly. `STRIPE_API_BASE` exists only
for local testing against `stripe-mock` or a fake server.

## Environment variables

See `.env.example`. Everything is optional locally.

| Variable | Required in prod | Purpose |
| -------- | ---------------- | ------- |
| `AUTH_SECRET` | **Yes** | Signs sessions + magic links (`npx auth secret`) |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Canonical URL for metadata/OG/sitemap |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | – | Google sign-in |
| `AUTH_APPLE_ID` / `AUTH_APPLE_SECRET` | – | Apple sign-in |
| `RESEND_API_KEY`, `AUTH_EMAIL_FROM` | For magic links | Email delivery |
| `ANTHROPIC_API_KEY` (+ `ANTHROPIC_MODEL`) | One AI key for real builds | Claude Haiku 5.5 builder |
| `OPENAI_API_KEY` (+ `OPENAI_MODEL`, `OPENAI_REASONING_EFFORT`) | One AI key for real builds | GPT-5.6 Luna builder |
| `AI_PROVIDER` | – | Force `anthropic`, `openai` or `mock` |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | **Yes, with a paid model** | Cross-instance quota counters |
| `PLAN_OVERRIDES` | – | Grant Pro/Bottomless by email (comps, testing) |
| `STRIPE_SECRET_KEY` | **Yes, to take payments** | Stripe Checkout + billing portal |
| `STRIPE_PRICE_PRO_MONTHLY` … `STRIPE_PRICE_BOTTOMLESS_YEARLY` | – | Use dashboard Prices instead of built-in amounts |
| `ADUMA_API_URL`, `ADUMA_API_KEY` | – | Proxy to a hosted aduma.io engine |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | – | Draft sync |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`, `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` | – | Analytics |

## Deploying to Vercel

1. Import the repo in Vercel (framework preset: Next.js, defaults are fine).
2. Add `AUTH_SECRET` and `NEXT_PUBLIC_SITE_URL` (plus any optional vars).
3. Deploy. `/api/generate`, `/api/subdomain` and `/api/magic-link` run on the
   Edge runtime; marketing pages are statically prerendered.
4. For Google/Apple, add `https://<your-domain>/api/auth/callback/google`
   (and `/apple`) as redirect URIs in each provider console.

## Accessibility & performance notes

- Skip link, landmarks, one consistent focus ring, labelled controls, live
  regions for generation progress, toasts and chat; dialogs via Radix (focus
  trap, Esc, aria); a11y-friendly radio groups and switches; colour tokens
  tuned for AA in both themes.
- Keyboard: `/` or `⌘/Ctrl+K` focuses the prompt, `Enter` creates,
  `Shift+Enter` adds a new line, `Esc` stops a generation.
- Generated sites are sandboxed (`allow-scripts allow-forms allow-popups`, no
  same-origin), so they can never touch the app.
- Perf choices: CSS-only animated backgrounds (gradients, not blur filters),
  `LazyMotion`, `zod/mini`, `content-visibility` for below-the-fold sections,
  CSS-drawn gallery thumbnails instead of images/iframes, self-hosted
  subsetted fonts, and lazy-loaded analytics and Supabase.
