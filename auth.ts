import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Apple from "next-auth/providers/apple";
import { DEV_SECRET, verifyMagicToken } from "@/lib/magic-link";
import { planForEmail } from "@/lib/plans";

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

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  // In production NextAuth reads AUTH_SECRET itself and errors at request time if missing.
  secret: process.env.AUTH_SECRET ?? (process.env.NODE_ENV !== "production" ? DEV_SECRET : undefined),
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/signin", verifyRequest: "/signin?sent=1", error: "/signin" },
  callbacks: {
    // Expose the user's plan to the client (resolved fresh on each session read).
    session({ session, token }) {
      if (session.user) session.user.plan = planForEmail(token.email);
      return session;
    },
  },
});
