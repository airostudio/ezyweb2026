"use client";

import { CreditCard, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useToast } from "@/components/ui/toast";
import { openBillingPortal } from "@/lib/checkout-client";
import { usePlan } from "@/lib/use-plan";
import styles from "./dashboard.module.css";

/** Settings → Plan & billing: shows the plan and links to upgrade or manage. */
export function BillingPanel() {
  const plan = usePlan();
  const toast = useToast();
  const [opening, setOpening] = useState(false);

  return (
    <section className={`card ${styles.panel}`} style={{ maxWidth: "40rem" }} aria-labelledby="billing-title">
      <h2 id="billing-title" className={styles.panelTitle}>
        Plan &amp; billing
      </h2>
      <p>
        You&apos;re on <strong>{plan.name}</strong>: up to {plan.sites} sites
        {plan.visualEditor ? ", the simple editor" : ""}
        {plan.customDomain ? " and your own domain" : ""}.
      </p>
      {plan.id === "free" ? (
        <Link href="/pricing" className="btn btn-electric" style={{ justifySelf: "start" }}>
          <Sparkles aria-hidden /> Upgrade
        </Link>
      ) : (
        <div className="row">
          <button
            type="button"
            className="btn btn-primary"
            disabled={opening}
            onClick={async () => {
              setOpening(true);
              const error = await openBillingPortal();
              if (error) {
                toast(error, "😬");
                setOpening(false);
              }
            }}
          >
            {opening ? <span className="spinner" aria-hidden /> : <CreditCard aria-hidden />} Manage subscription
          </button>
          <p className="hint">Change plan, update your card, get invoices or cancel. Handled securely by Stripe.</p>
        </div>
      )}
    </section>
  );
}
