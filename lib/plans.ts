/**
 * Plan limits — the single source of truth for what each tier gets.
 *
 * Every plan uses the SAME (cheapest) model; plans differ only in how many
 * sites you can keep and what you can do with them. The per-day build and
 * per-site edit caps are budget guards enforced server-side in
 * /api/generate (see lib/quota.ts), so a single visitor can't run up the
 * LLM bill.
 *
 * Shared by client and server — keep it free of server-only imports.
 */

export type PlanId = "free" | "pro" | "bottomless";

export interface PlanLimits {
  id: PlanId;
  name: string;
  /** Sites a user can keep (drafts + live). */
  sites: number;
  /** New-site generations per rolling day (server-enforced). */
  dailyBuilds: number;
  /** Follow-up edits allowed per site (server-enforced). */
  editsPerSite: number;
  customDomain: boolean;
  /** Owner can view/copy the generated HTML in the studio. */
  codeAccess: boolean;
  /** Click-to-edit text + colour editor in the studio (no AI cost). */
  visualEditor: boolean;
  removeBadge: boolean;
}

export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  free: {
    id: "free",
    name: "Free",
    sites: 3,
    dailyBuilds: 6,
    editsPerSite: 15,
    customDomain: false,
    codeAccess: false,
    visualEditor: false,
    removeBadge: false,
  },
  pro: {
    id: "pro",
    name: "Pro",
    sites: 10,
    dailyBuilds: 25,
    editsPerSite: 40,
    customDomain: true,
    codeAccess: true,
    visualEditor: true,
    removeBadge: true,
  },
  // "Bottomless" — like a bottomless brunch: it feels endless, but there's a
  // (generous, clearly disclosed) fair-use cap. Never market it as
  // "unlimited": under Australian Consumer Law that claim must be literally true.
  bottomless: {
    id: "bottomless",
    name: "Bottomless",
    sites: 50,
    dailyBuilds: 40,
    editsPerSite: 60,
    customDomain: true,
    codeAccess: true,
    visualEditor: true,
    removeBadge: true,
  },
};

export function isPlanId(value: unknown): value is PlanId {
  return value === "free" || value === "pro" || value === "bottomless";
}

/**
 * Manual plan grants (comps, staff, testing), checked before Stripe:
 *   PLAN_OVERRIDES="me@example.com:bottomless,friend@example.com:pro"
 * Returns null when the email isn't listed. Server only — the env var is
 * not exposed to the browser. Paid plans come from Stripe (lib/billing.ts).
 */
export function planOverride(email: string | null | undefined): PlanId | null {
  if (!email) return null;
  const raw = process.env.PLAN_OVERRIDES ?? "";
  for (const entry of raw.split(",")) {
    const [who, plan] = entry.split(":").map((s) => s.trim().toLowerCase());
    if (who && who === email.toLowerCase() && isPlanId(plan)) return plan;
  }
  return null;
}
