# Webese — type a vibe, get a website ✨

The direct-to-consumer, just-for-fun website builder from **Ezyweb Solutions**.
Describe any site in one sentence — a dinosaur birthday invite, a neon shrine
for your cat, a museum of cursed memes — and watch it build itself live, then
tweak it by chatting and publish it to `yourname.webese.ai` in one tap.

This repo is the white-label front end for the **webese.ai** generation
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
| `/pricing`            | Free / Pro / Unlimited (AUD, monthly ↔ yearly) + FAQ (with FAQ JSON-LD) |
| `/about`              | The Ezyweb → Webese story |
| `/signin`             | Magic link + Google + Apple |
| `/auth/verify`        | Magic-link landing (exchanges token for a session) |
| `/dashboard`          | My Sites: live thumbnails, edit / view / delete |
| `/dashboard/settings` | Profile (RHF + Zod), danger zone, sign out |
| `/p/[slug]`           | Local stand-in for a published `slug.webese.ai` site |
| `/api/generate`       | **Edge** · streams NDJSON generation events (mock or proxied to webese.ai) |
| `/api/subdomain`      | **Edge** · subdomain availability check (mock) |
| `/api/magic-link`     | **Edge** · issues signed sign-in links |
| `/api/auth/*`         | NextAuth v5 |

Plus `opengraph-image` / `twitter-image` (generated share cards), `icon.svg`,
`apple-icon`, `robots.txt`, `sitemap.xml`, `manifest.webmanifest`, route and
global error boundaries, and a custom 404.

### Project layout

```
app/                    routes, metadata files, error boundaries, globals.css
components/
  brand.tsx             ezyweb wordmark + "e" mark (pre-outlined SVG)
  prompt-box.tsx        the hero prompt (RHF + Zod, typewriter, ⌘K, live demo)
  create/               studio, generating overlay, publish dialog
  home/ gallery/ pricing/ dashboard/ auth/ layout/
  ui/                   shadcn-style primitives (Button, Dialog, Toast) on Radix
lib/
  generator/            the mock webese.ai engine (see below)
  webese-client.ts      browser NDJSON stream reader
  drafts.ts             localStorage draft store (+ optional Supabase mirror)
  schemas.ts            shared Zod (zod/mini) schemas — client + server
  analytics.ts          Plausible / PostHog shim: track("event")
  content.ts            all marketing copy, examples, gallery, plans
auth.ts                 NextAuth config
public/logo.svg         static brand wordmark
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

The **ezyweb** wordmark lives in `components/brand.tsx` (`<BrandLogo />`, plus
`<BrandMark />` for the square "e"). Glyphs are pre-converted outlines, so no
font download is needed for the logo. `public/logo.svg` and `app/icon.svg` are
static copies of the same geometry for emails, OG images and favicons.

---

## The mock generator (and swapping in webese.ai)

### Protocol

`POST /api/generate` with `{ prompt: string, spec?: SiteSpec }`
(`spec` present ⇒ follow-up edit) responds with `application/x-ndjson`, one
JSON event per line:

```ts
type GenerateEvent =
  | { type: "stage"; stage: number; label: string }      // progress (0–4)
  | { type: "thought"; text: string }                    // narration
  | { type: "html"; chunk: string }                      // streamed markup
  | { type: "done"; spec: SiteSpec | null; html: string; summary: string }
  | { type: "error"; message: string };
```

The UI only requires `done.html` (a standalone HTML document rendered in a
sandboxed iframe). `stage`, `thought` and `html` events are optional sugar
for the generating animation. `spec` is only needed for local edits, so
return `null` if webese.ai manages state server-side.

### How the mock works

`lib/generator/` parses the prompt (names, ages, topics, vibes), picks an
**archetype** (birthday, wedding, pet shrine, gaming clan, meme museum,
portfolio, band, travel, recipes, event, space, or a catch-all), builds a
structured `SiteSpec` with one of nine hand-tuned themes, and renders it to a
self-contained, interactive HTML page: countdowns, RSVP, guestbook, FAQ,
scroll reveals and confetti. Follow-ups like *"make it darker"*, *"add a photo
gallery"*, *"make it pink"*, *"fancier font"*, *"call it Max's Dino Party"* or
*"remove the countdown"* transform the spec.

### Swapping to the real API

**Option A — zero code (recommended).** If webese.ai speaks the protocol
above, set:

```bash
WEBESE_API_URL=https://api.webese.ai/v1/generate
WEBESE_API_KEY=sk_live_…
```

`/api/generate` then proxies the request body verbatim (with
`Authorization: Bearer $WEBESE_API_KEY`) and streams the response straight
back. The browser never sees the key.

**Option B — adapter.** If the upstream format differs (say SSE, or plain
JSON), edit `proxyToWebese()` in `app/api/generate/route.ts` to translate it
into `GenerateEvent`s. That function is the only place that needs to change.

Also wire up:

- `app/api/subdomain/route.ts` → the real availability lookup.
- The publish step (`ClaimStep.onSubmit` in `components/create/publish-dialog.tsx`)
  → a webese.ai publish endpoint (it currently saves locally).
- `app/p/[slug]` → fetch published HTML from webese.ai, or serve
  `*.webese.ai` via wildcard-domain middleware.

---

## Auth

NextAuth v5 (Auth.js) with JWT sessions, so no database is required and it
runs on the edge.

- **Magic link** — `/api/magic-link` signs a 15-minute JWT with `AUTH_SECRET`
  (via `jose`) and emails it with [Resend](https://resend.com) if
  `RESEND_API_KEY` is set. Otherwise the link is logged to the server console,
  and in development it's also shown on screen. `/auth/verify` exchanges it
  through a Credentials provider. To make links single-use, store the token's
  `jti` (Supabase/Upstash) and reject repeats in `verifyMagicToken`.
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

## Payments

Upgrade buttons route to `/dashboard?upgrade=pro|unlimited`, which shows a
placeholder dialog. Drop a Stripe Checkout session creation into that flow
when you're ready.

---

## Environment variables

See `.env.example`. Everything is optional locally.

| Variable | Required in prod | Purpose |
| -------- | ---------------- | ------- |
| `AUTH_SECRET` | **Yes** | Signs sessions + magic links (`npx auth secret`) |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Canonical URL for metadata/OG/sitemap |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | – | Google sign-in |
| `AUTH_APPLE_ID` / `AUTH_APPLE_SECRET` | – | Apple sign-in |
| `RESEND_API_KEY`, `AUTH_EMAIL_FROM` | For magic links | Email delivery |
| `WEBESE_API_URL`, `WEBESE_API_KEY` | – | Real generation backend |
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
