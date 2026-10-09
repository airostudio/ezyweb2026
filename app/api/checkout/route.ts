import { NextResponse } from "next/server";
import * as z from "zod/mini";
import { auth } from "@/auth";
import { billingEnabled, createCheckoutUrl, createPortalUrl } from "@/lib/billing";

export const runtime = "nodejs";

const bodySchema = z.object({
  plan: z.enum(["pro", "bottomless"]),
  interval: z.enum(["month", "year"]),
});

/**
 * POST /api/checkout  { plan, interval }  →  { url }
 * Starts a Stripe Checkout subscription for the signed-in user. Someone who
 * already pays is sent to the billing portal instead, to switch plans
 * without creating a second subscription.
 */
export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Pick a plan to continue." }, { status: 422 });

  const session = await auth();
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: "Sign in to upgrade.", code: "signin" }, { status: 401 });

  if (!billingEnabled()) {
    return NextResponse.json({ error: "Payments aren't switched on just yet. Check back soon!", code: "disabled" }, { status: 503 });
  }

  const origin = new URL(req.url).origin;
  try {
    const current = session.user?.plan ?? "free";
    if (current !== "free") {
      const portal = await createPortalUrl(email, `${origin}/dashboard`);
      if (portal) return NextResponse.json({ url: portal, portal: true });
    }
    const url = await createCheckoutUrl({ email, ...parsed.data, origin });
    return NextResponse.json({ url });
  } catch (err) {
    console.error("[checkout] stripe error", err);
    return NextResponse.json({ error: "We couldn't open checkout. Please try again in a moment." }, { status: 502 });
  }
}
