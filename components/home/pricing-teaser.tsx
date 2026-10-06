import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { PLANS } from "@/lib/content";
import styles from "./home.module.css";

export function PricingTeaser() {
  return (
    <section className="section" aria-labelledby="pricing-teaser-title">
      <div className="container">
        <div className="section-head is-center">
          <p className="eyebrow">Pricing</p>
          <h2 id="pricing-teaser-title" className="h-1">
            Free to play. <span className="text-gradient">Cheap to go pro.</span>
          </h2>
          <p className="lead">Make as many sites as you like for free. Upgrade when you want your own domain or more room to play.</p>
        </div>
        <div className={styles.teaserGrid}>
          {PLANS.map((p) => (
            <article key={p.id} className={`card ${styles.teaserCard} ${p.highlight ? `${styles.teaserHot} ring-electric` : ""}`}>
              {p.highlight && <span className={`badge badge-electric ${styles.teaserBadge}`}>Most loved</span>}
              <h3 className="h-3">{p.name}</h3>
              <p className={styles.teaserPrice}>
                {p.price.monthly === 0 ? "$0" : `$${p.price.yearly}`}
                <span className="subtle">{p.price.monthly === 0 ? " forever" : " /mo AUD"}</span>
              </p>
              <ul className={styles.teaserList}>
                {p.features.slice(0, 3).map((f) => (
                  <li key={f}>
                    <Check aria-hidden /> {f}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <p className="center" style={{ marginTop: "2rem" }}>
          <Link href="/pricing" className="btn btn-outline">
            Compare plans <ArrowRight aria-hidden />
          </Link>
        </p>
      </div>
    </section>
  );
}
