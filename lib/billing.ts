import Stripe from "stripe";
import { isPlanId, planOverride, type PlanId } from "@/lib/plans";

/**
 * Stripe billing (server only).
 *
 * Stripe is the source of truth for who has paid. No database is needed:
 *  - Checkout creates a subscription tagged with metadata.plan.
 *  - A user's plan is read from their active Stripe subscriptions, cached in
 *    their session token and refreshed every few minutes (and right after
 *    checkout), so cancellations and upgrades flow through automatically.
 *  - Plan changes and cancellations happen in Stripe's hosted billing portal.
 *
 * Prices: by default each checkout uses inline price_data built from
 * PAID_PRICES (AUD, GST inclusive). To use Prices managed in the Stripe
 * dashboard instead, set STRIPE_PRICE_PRO_MONTHLY / _YEARLY and
 * STRIPE_PRICE_BOTTOMLESS_MONTHLY / _YEARLY.
 */

export type PaidPlan = Exclude<PlanId, "free">;
export type Interval = "month" | "year";

/** Cents AUD charged per billing period (yearly = 12 × the discounted monthly). */
export const PAID_PRICES: Record<PaidPlan, { month: number; year: number; name: string }> = {
  pro: { month: 800, year: 7200, name: "aduma.io Pro" },
  bottomless: { month: 1200, year: 10800, name: "aduma.io Bottomless" },
};

const PLAN_RANK: Record<PlanId, number> = { free: 0, pro: 1, bottomless: 2 };

export function billingEnabled(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

let client: Stripe | null = null;
export function stripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  // Fetch-based client works in both the Node and Edge runtimes.
  // STRIPE_API_BASE (e.g. http://localhost:12111 for stripe-mock) is for local testing only.
  const base = process.env.STRIPE_API_BASE ? new URL(process.env.STRIPE_API_BASE) : null;
  client ??= new Stripe(key, {
    httpClient: Stripe.createFetchHttpClient(),
    ...(base && { host: base.hostname, port: Number(base.port) || undefined, protocol: base.protocol.replace(":", "") as "http" | "https" }),
  });
  return client;
}

function configuredPriceId(plan: PaidPlan, interval: Interval): string | undefined {
  const key = `STRIPE_PRICE_${plan.toUpperCase()}_${interval === "month" ? "MONTHLY" : "YEARLY"}`;
  return process.env[key] || undefined;
}

/** Maps a configured dashboard Price id back to its plan (fallback to metadata). */
function planForPriceId(priceId: string): PaidPlan | null {
  for (const plan of ["pro", "bottomless"] as const) {
    for (const interval of ["month", "year"] as const) {
      if (configuredPriceId(plan, interval) === priceId) return plan;
    }
  }
  return null;
}

async function findCustomer(email: string): Promise<Stripe.Customer | null> {
  const { data } = await stripe().customers.list({ email, limit: 1 });
  return data[0] ?? null;
}

/**
 * The highest active paid plan for an email, read live from Stripe.
 * Returns "free" when the customer or subscription doesn't exist.
 */
export async function planFromStripe(email: string): Promise<PlanId> {
  const { data: customers } = await stripe().customers.list({ email, limit: 3 });
  let best: PlanId = "free";
  for (const customer of customers) {
    const subs = await stripe().subscriptions.list({ customer: customer.id, status: "all", limit: 10 });
    for (const sub of subs.data) {
      if (!["active", "trialing", "past_due"].includes(sub.status)) continue;
      const fromMeta = sub.metadata?.plan;
      const fromPrice = sub.items.data.map((i) => planForPriceId(i.price.id)).find(Boolean);
      const plan = isPlanId(fromMeta) ? fromMeta : (fromPrice ?? null);
      if (plan && PLAN_RANK[plan] > PLAN_RANK[best]) best = plan;
    }
  }
  return best;
}

/**
 * A user's effective plan: manual override first, then Stripe, else Free.
 * Errors propagate so callers can keep a previously known plan.
 */
export async function resolvePlan(email: string | null | undefined): Promise<PlanId> {
  if (!email) return "free";
  const override = planOverride(email);
  if (override) return override;
  if (!billingEnabled()) return "free";
  return planFromStripe(email);
}

/** Creates a Stripe Checkout session for a subscription and returns its URL. */
export async function createCheckoutUrl(opts: { email: string; plan: PaidPlan; interval: Interval; origin: string }): Promise<string> {
  const { email, plan, interval, origin } = opts;
  const customer = await findCustomer(email);
  const priceId = configuredPriceId(plan, interval);
  const price = PAID_PRICES[plan];

  const session = await stripe().checkout.sessions.create({
    mode: "subscription",
    ...(customer ? { customer: customer.id } : { customer_email: email }),
    client_reference_id: email,
    line_items: [
      priceId
        ? { price: priceId, quantity: 1 }
        : {
            quantity: 1,
            price_data: {
              currency: "aud",
              unit_amount: price[interval],
              recurring: { interval },
              product_data: { name: price.name },
            },
          },
    ],
    // Tag the subscription so we can read the plan back without a database.
    subscription_data: { metadata: { plan, email } },
    metadata: { plan, email },
    allow_promotion_codes: true,
    billing_address_collection: "auto",
    success_url: `${origin}/dashboard?upgraded=${plan}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/pricing?canceled=1`,
  });
  if (!session.url) throw new Error("Stripe returned no checkout URL");
  return session.url;
}

/** Stripe-hosted portal for switching plans, payment details and cancelling. */
export async function createPortalUrl(email: string, returnUrl: string): Promise<string | null> {
  const customer = await findCustomer(email);
  if (!customer) return null;
  const portal = await stripe().billingPortal.sessions.create({ customer: customer.id, return_url: returnUrl });
  return portal.url;
}
