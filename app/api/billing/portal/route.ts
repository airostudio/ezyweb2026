import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { billingEnabled, createPortalUrl } from "@/lib/billing";

export const runtime = "nodejs";

/**
 * POST /api/billing/portal  →  { url }
 * Stripe's hosted portal: change plan, update card, download invoices, cancel.
 */
export async function POST(req: Request) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  if (!billingEnabled()) return NextResponse.json({ error: "Payments aren't switched on yet." }, { status: 503 });
  try {
    const url = await createPortalUrl(email, `${new URL(req.url).origin}/dashboard/settings`);
    if (!url) return NextResponse.json({ error: "No subscription found for this account." }, { status: 404 });
    return NextResponse.json({ url });
  } catch (err) {
    console.error("[billing-portal] stripe error", err);
    return NextResponse.json({ error: "We couldn't open billing right now. Please try again." }, { status: 502 });
  }
}
