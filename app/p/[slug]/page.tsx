import type { Metadata } from "next";
import { PublishedSite } from "./published-site";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `${slug}.aduma.io`,
    description: `A website made with aduma.io — make your own in seconds.`,
    robots: { index: false },
  };
}

/**
 * Local stand-in for https://<slug>.aduma.io. In this mock the published
 * HTML lives in the visitor's browser storage; with the real API this page
 * (or wildcard-subdomain middleware) would fetch it from aduma.io.
 */
export default async function PublishedPage({ params }: Props) {
  const { slug } = await params;
  return <PublishedSite slug={slug} />;
}
