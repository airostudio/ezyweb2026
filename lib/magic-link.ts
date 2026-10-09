import { SignJWT, jwtVerify } from "jose";

/**
 * Stateless magic links: a short-lived JWT signed with AUTH_SECRET.
 * No database required. To make links single-use, record the `jti`
 * in a store (e.g. Supabase/Upstash) and reject repeats in `verifyMagicToken`.
 */
const TTL_MINUTES = 15;

/** Used only outside production so the app runs with zero config locally. */
export const DEV_SECRET = "aduma-dev-only-secret-change-me-please-0123456789";

export function authSecret(): string {
  const s = process.env.AUTH_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV !== "production") return DEV_SECRET;
  throw new Error("AUTH_SECRET must be set in production");
}

const key = () => new TextEncoder().encode(authSecret());

export async function createMagicToken(email: string): Promise<string> {
  return new SignJWT({ email, purpose: "magic-link" })
    .setProtectedHeader({ alg: "HS256" })
    .setJti(crypto.randomUUID())
    .setIssuedAt()
    .setExpirationTime(`${TTL_MINUTES}m`)
    .sign(key());
}

export async function verifyMagicToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    if (payload.purpose !== "magic-link" || typeof payload.email !== "string") return null;
    return payload.email;
  } catch {
    return null;
  }
}

export type SendResult = "sent" | "not-configured" | "failed";

/** Default sender. Resend only delivers from a domain verified in your account. */
const DEFAULT_FROM = "aduma.io <hello@aduma.io>";

/**
 * Sends the sign-in email via Resend. Failures are logged with Resend's
 * error (e.g. "domain is not verified") so they're visible in Vercel logs.
 */
export async function sendMagicLinkEmail(email: string, url: string): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return "not-configured";
  const from = process.env.AUTH_EMAIL_FROM || DEFAULT_FROM;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: email,
        subject: "Your aduma.io sign-in link ✨",
        text: `G'day! Sign in to aduma.io with this link (expires in ${TTL_MINUTES} minutes):\n\n${url}\n\nDidn't ask for this? Ignore it — nothing happens.`,
        html: `<div style="font-family:system-ui,sans-serif;max-width:460px;margin:auto;padding:32px">
        <h1 style="font-size:28px;margin:0 0 12px">G'day! 👋</h1>
        <p style="font-size:16px;color:#444">Tap the button to sign in to aduma.io. This link expires in ${TTL_MINUTES} minutes.</p>
        <p style="margin:28px 0"><a href="${url}" style="background:#0b0c10;color:#fff;padding:14px 22px;border-radius:999px;text-decoration:none;font-weight:600">Sign me in</a></p>
        <p style="font-size:13px;color:#888">Didn't ask for this? Ignore it — nothing happens.</p></div>`,
      }),
    });
    if (res.ok) return "sent";
    const detail = (await res.json().catch(() => null)) as { name?: string; message?: string } | null;
    console.error(`[magic-link] Resend rejected the email (${res.status}) from "${from}": ${detail?.name ?? ""} ${detail?.message ?? ""}`.trim());
    return "failed";
  } catch (err) {
    console.error("[magic-link] couldn't reach Resend", err);
    return "failed";
  }
}
