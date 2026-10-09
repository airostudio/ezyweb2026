"use client";

import { track } from "@/lib/analytics";
import type { PlanId } from "@/lib/plans";

export type PaidPlanId = Exclude<PlanId, "free">;
export type BillingInterval = "month" | "year";

/**
 * Sends the visitor to Stripe Checkout for a plan. Signed-out visitors go to
 * sign-in first, which returns them to /pricing with the choice preserved so
 * checkout resumes automatically. Resolves with an error message to show,
 * or never resolves meaningfully because the page navigates away.
 */
export async function startCheckout(plan: PaidPlanId, interval: BillingInterval): Promise<string | null> {
  track("upgrade_clicked", { plan, yearly: interval === "year" });
  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan, interval }),
  }).catch(() => null);
  if (!res) return "Couldn't reach checkout. Check your connection and try again.";

  const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string; code?: string };
  if (res.status === 401 && data.code === "signin") {
    const resume = `/pricing?checkout=${plan}&interval=${interval}`;
    window.location.assign(`/signin?callbackUrl=${encodeURIComponent(resume)}`);
    return null;
  }
  if (res.ok && data.url) {
    window.location.assign(data.url);
    return null;
  }
  return data.error ?? "Something went wrong opening checkout. Please try again.";
}

/** Opens Stripe's billing portal (manage plan, card, invoices, cancel). */
export async function openBillingPortal(): Promise<string | null> {
  const res = await fetch("/api/billing/portal", { method: "POST" }).catch(() => null);
  if (!res) return "Couldn't reach billing. Check your connection and try again.";
  const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
  if (res.ok && data.url) {
    window.location.assign(data.url);
    return null;
  }
  return data.error ?? "We couldn't open billing right now.";
}
