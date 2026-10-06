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

  const sent = await sendMagicLinkEmail(parsed.data.email, url).catch(() => false);
  if (!sent) console.info(`[magic-link] ${parsed.data.email} → ${url}`);

  return NextResponse.json({
    ok: true,
    // Only ever expose the link to the browser in local development.
    devLink: !sent && process.env.NODE_ENV !== "production" ? url : undefined,
  });
}
