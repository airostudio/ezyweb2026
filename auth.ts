import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Apple from "next-auth/providers/apple";
import { DEV_SECRET, verifyMagicToken } from "@/lib/magic-link";
import { resolvePlan } from "@/lib/billing";

/**
 * NextAuth v5 config.
 *  - Google / Apple: enabled automatically when their env vars are present.
 *  - Magic link: a Credentials provider that accepts a signed token from
 *    /api/magic-link (see lib/magic-link.ts). Works with zero infrastructure.
 * Sessions are JWT-based so this runs on the edge with no database.
 */
const providers: NextAuthConfig["providers"] = [
  Credentials({
    id: "magic-link",
    name: "Magic link",
    credentials: { token: { type: "text" } },
    async authorize(creds) {
      const token = typeof creds?.token === "string" ? creds.token : "";
      const email = await verifyMagicToken(token);
      if (!email) return null;
      const name = email.split("@")[0] ?? "Legend";
      return { id: email, email, name };
    },
  }),
];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) providers.push(Google);
if (process.env.AUTH_APPLE_ID && process.env.AUTH_APPLE_SECRET) providers.push(Apple);

/** Which social buttons to render (read on the server, passed to the client). */
export const enabledSocialProviders = {
  google: Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET),
  apple: Boolean(process.env.AUTH_APPLE_ID && process.env.AUTH_APPLE_SECRET),
};

/** How long a cached plan is trusted before re-checking Stripe. */
const PLAN_TTL = 5 * 60 * 1000;

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  // In production NextAuth reads AUTH_SECRET itself and errors at request time if missing.
  secret: process.env.AUTH_SECRET ?? (process.env.NODE_ENV !== "production" ? DEV_SECRET : undefined),
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/signin", verifyRequest: "/signin?sent=1", error: "/signin" },
  callbacks: {
    /**
     * Cache the user's plan in their (signed) session token. It's refreshed
     * from Stripe every PLAN_TTL, at sign-in, and on demand via
     * `useSession().update({...})` with any data (called right after checkout).
     */
    async jwt({ token, user, trigger }) {
      const stale = !token.planCheckedAt || Date.now() - token.planCheckedAt > PLAN_TTL;
      if (user || trigger === "update" || stale) {
        try {
          token.plan = await resolvePlan(token.email);
          token.planCheckedAt = Date.now();
        } catch (err) {
          // Stripe unreachable: keep the last known plan, retry next request.
          console.error("[auth] plan lookup failed", err);
          token.plan ??= "free";
        }
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) session.user.plan = token.plan ?? "free";
      return session;
    },
  },
});
