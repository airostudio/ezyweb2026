"use client";

import { AnimatePresence, m } from "framer-motion";
import { Check } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { track } from "@/lib/analytics";
import { PLANS } from "@/lib/content";
import { cn } from "@/lib/utils";
import styles from "./pricing.module.css";

export function PricingPlans() {
  const [yearly, setYearly] = useState(true);

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
              <Link
                href={p.id === "free" ? "/create" : `/signin?callbackUrl=${encodeURIComponent(`/dashboard?upgrade=${p.id}`)}`}
                className={cn("btn btn-lg w-full", p.highlight ? "btn-electric" : p.id === "free" ? "btn-outline" : "btn-primary")}
                onClick={() => p.id !== "free" && track("upgrade_clicked", { plan: p.id, yearly })}
              >
                {p.cta}
              </Link>
              <ul className={styles.features}>
                {p.features.map((f) => (
                  <li key={f}>
                    <Check aria-hidden /> {f}
                  </li>
                ))}
              </ul>
            </m.article>
          );
        })}
      </div>

      <p className={styles.promise}>
        <span aria-hidden>🤝</span> The Webese promise: we never delete your sites, never sell your data, and never hide the cancel button.
      </p>
    </div>
  );
}
