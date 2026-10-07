import { FinalCta } from "@/components/home/final-cta";
import { Hero } from "@/components/home/hero";
import { HowItWorks } from "@/components/home/how-it-works";
import { Inspiration } from "@/components/home/inspiration";
import { PricingTeaser } from "@/components/home/pricing-teaser";
import { SocialProof } from "@/components/home/social-proof";
import { siteConfig } from "@/lib/site";

/** JSON-LD so search engines understand what aduma.io is. */
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: siteConfig.name,
  applicationCategory: "DesignApplication",
  operatingSystem: "Web",
  description: siteConfig.description,
  url: siteConfig.url,
  offers: { "@type": "Offer", price: "0", priceCurrency: "AUD" },
  publisher: { "@type": "Organization", name: siteConfig.company },
};

export default function HomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Hero />
      <SocialProof />
      <HowItWorks />
      <Inspiration />
      <PricingTeaser />
      <FinalCta />
    </>
  );
}
