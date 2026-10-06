import type { Metadata } from "next";
import { PublishedSite } from "./published-site";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `${slug}.webese.ai`,
    description: `A website made with Webese — make your own in seconds.`,
    robots: { index: false },
  };
}

/**
 * Local stand-in for https://<slug>.webese.ai. In this mock the published
 * HTML lives in the visitor's browser storage; with the real API this page
 * (or wildcard-subdomain middleware) would fetch it from webese.ai.
 */
export default async function PublishedPage({ params }: Props) {
  const { slug } = await params;
  return <PublishedSite slug={slug} />;
}
