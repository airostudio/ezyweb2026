import { NextResponse } from "next/server";
import { createMagicToken, sendMagicLinkEmail } from "@/lib/magic-link";
import { emailSchema } from "@/lib/schemas";

export const runtime = "edge";

/**
 * POST /api/magic-link  { email, callbackUrl? }
 * Issues a signed, 15-minute sign-in link and emails it (Resend). Without an
 * email provider configured, the link is logged and — in development only —
 * returned to the client so the flow is testable locally.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { email?: unknown; callbackUrl?: unknown } | null;
  const parsed = emailSchema.safeParse({ email: body?.email });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid email" }, { status: 422 });
  }

  const callback = typeof body?.callbackUrl === "string" && body.callbackUrl.startsWith("/") ? body.callbackUrl : "/dashboard";
  const token = await createMagicToken(parsed.data.email);
  const origin = new URL(req.url).origin;
  const url = `${origin}/auth/verify?token=${encodeURIComponent(token)}&next=${encodeURIComponent(callback)}`;

  const result = await sendMagicLinkEmail(parsed.data.email, url);
  const dev = process.env.NODE_ENV !== "production";

  if (result === "sent") return NextResponse.json({ ok: true });

  // Development: no email needed — log the link and hand it to the page.
  // (Never log or expose sign-in links in production: they're credentials.)
  if (dev) {
    console.info(`[magic-link] ${parsed.data.email} → ${url}`);
    return NextResponse.json({ ok: true, devLink: url });
  }

  const message =
    result === "not-configured"
      ? "Email sign-in isn't set up yet. Try Google or Apple, or check back soon."
      : "We couldn't send your sign-in email just now. Please try again in a minute.";
  return NextResponse.json({ error: message }, { status: result === "not-configured" ? 503 : 502 });
}
