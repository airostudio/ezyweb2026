"use client";

import { AnimatePresence, m } from "framer-motion";
import { Check } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/ui/toast";
import { openBillingPortal, startCheckout, type PaidPlanId } from "@/lib/checkout-client";
import { PLANS } from "@/lib/content";
import { usePlan } from "@/lib/use-plan";
import { cn } from "@/lib/utils";
import styles from "./pricing.module.css";

export function PricingPlans() {
  const [yearly, setYearly] = useState(true);
  const [pending, setPending] = useState<PaidPlanId | "portal" | null>(null);
  const current = usePlan();
  const toast = useToast();
  const resumed = useRef(false);

  const checkout = async (plan: PaidPlanId, interval: "month" | "year") => {
    setPending(plan);
    const error = await startCheckout(plan, interval);
    if (error) {
      toast(error, "😬");
      setPending(null);
    }
  };

  const manage = async () => {
    setPending("portal");
    const error = await openBillingPortal();
    if (error) {
      toast(error, "😬");
      setPending(null);
    }
  };

  // Returning from sign-in (?checkout=pro&interval=year) resumes checkout;
  // returning from a cancelled checkout (?canceled=1) gets a friendly note.
  useEffect(() => {
    if (resumed.current) return;
    resumed.current = true;
    const params = new URLSearchParams(window.location.search);
    const plan = params.get("checkout");
    const interval = params.get("interval") === "month" ? "month" : "year";
    if (params.get("canceled")) toast("No worries — checkout cancelled. Your sites are safe on Free.", "👌");
    if (plan === "pro" || plan === "bottomless") {
      setYearly(interval === "year");
      window.history.replaceState(null, "", "/pricing");
      void checkout(plan, interval);
    } else if (params.get("canceled")) {
      window.history.replaceState(null, "", "/pricing");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={styles.wrap}>
      <div className={styles.toggle} role="radiogroup" aria-label="Billing period">
        {[
          { v: false, label: "Monthly" },
          { v: true, label: "Yearly" },
        ].map((o) => (
          <button key={o.label} type="button" role="radio" aria-checked={yearly === o.v} onClick={() => setYearly(o.v)}>
            {yearly === o.v && <m.span layoutId="billing-pill" className={styles.togglePill} transition={{ type: "spring", stiffness: 500, damping: 35 }} />}
            <span className={styles.toggleText}>
              {o.label}
              {o.v && <span className={styles.save}>save 25%</span>}
            </span>
          </button>
        ))}
      </div>

      <div className={styles.grid}>
        {PLANS.map((p, i) => {
          const price = yearly ? p.price.yearly : p.price.monthly;
          return (
            <m.article
              key={p.id}
              className={cn("card", styles.plan, p.highlight && cn(styles.hot, "ring-electric is-spinning"))}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, type: "spring", stiffness: 160, damping: 20 }}
              aria-labelledby={`plan-${p.id}`}
            >
              {p.highlight && <span className={cn("badge badge-electric", styles.badge)}>Most loved 💖</span>}
              <h2 id={`plan-${p.id}`} className="h-3">
                {p.name}
              </h2>
              <p className="muted">{p.blurb}</p>
              <p className={styles.price}>
                <span className={styles.currency}>$</span>
                <AnimatePresence mode="popLayout" initial={false}>
                  <m.span
                    key={price}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className={styles.amount}
                  >
                    {price}
                  </m.span>
                </AnimatePresence>
                <span className={styles.per}>{price === 0 ? "forever" : "/month"}</span>
              </p>
              <p className={cn("subtle", styles.billed)}>
                {price === 0 ? "No card. No trial. No catch." : yearly ? `Billed $${price * 12} yearly` : "Billed monthly, cancel anytime"}
              </p>
              {p.id === current.id ? (
                p.id === "free" ? (
                  <Link href="/create" className="btn btn-lg btn-outline w-full">
                    Your plan · make a site
                  </Link>
                ) : (
                  <button type="button" className="btn btn-lg btn-outline w-full" onClick={manage} disabled={pending !== null}>
                    {pending === "portal" ? <span className="spinner" aria-hidden /> : null} Your plan · manage
                  </button>
                )
              ) : p.id === "free" ? (
                <Link href="/create" className="btn btn-lg btn-outline w-full">
                  {p.cta}
                </Link>
              ) : (
                <button
                  type="button"
                  className={cn("btn btn-lg w-full", p.highlight ? "btn-electric" : "btn-primary")}
                  onClick={() => checkout(p.id as PaidPlanId, yearly ? "year" : "month")}
                  disabled={pending !== null}
                  aria-busy={pending === p.id}
                >
                  {pending === p.id ? (
                    <>
                      <span className="spinner" aria-hidden /> Opening secure checkout…
                    </>
                  ) : current.id !== "free" ? (
                    `Switch to ${p.name}`
                  ) : (
                    p.cta
                  )}
                </button>
              )}
              <ul className={styles.features}>
                {p.features.map((f) => (
                  <li key={f}>
                    <Check aria-hidden /> {f}
                  </li>
                ))}
              </ul>
              {p.fineprint && <p className={styles.fineprint}>{p.fineprint}</p>}
            </m.article>
          );
        })}
      </div>

      <p className={styles.promise}>
        <span aria-hidden>🤝</span> The aduma.io promise: we never delete your sites, never sell your data, and never hide the cancel button.
        Payments are handled securely by Stripe.
      </p>
    </div>
  );
}
