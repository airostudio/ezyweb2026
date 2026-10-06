import type { Metadata } from "next";
import { PricingPlans } from "@/components/pricing/pricing-plans";
import { PRICING_FAQ } from "@/lib/content";
import styles from "@/components/pricing/pricing.module.css";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Free forever for fun. Pro from $6/month for custom domains and more. Honest, simple, Aussie-dollar pricing.",
  alternates: { canonical: "/pricing" },
};

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: PRICING_FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
};

export default function PricingPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <section className="section" style={{ paddingTop: "clamp(2.5rem, 6vw, 4.5rem)" }}>
        <div className="container">
          <header className="section-head is-center">
            <p className="eyebrow">Pricing</p>
            <h1 className="h-1">
              Honest prices. <span className="text-gradient">No funny business.</span>
            </h1>
            <p className="lead">
              Making sites is free, forever. Pay only if you want the fancy extras. Prices in AUD, GST included, cancel in two clicks.
            </p>
          </header>
          <PricingPlans />
        </div>
      </section>

      <section className="section" aria-labelledby="faq-title" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className={styles.faqWrap}>
            <h2 id="faq-title" className="h-2">
              Questions, answered
            </h2>
            <div>
              {PRICING_FAQ.map((f) => (
                <details key={f.q} className={styles.faq}>
                  <summary>{f.q}</summary>
                  <p className="muted">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
