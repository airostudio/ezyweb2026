import type { Metadata } from "next";
import { Studio } from "@/components/create/studio";

export const metadata: Metadata = {
  title: "Create",
  description: "Describe any website in one sentence and watch Webese build it live. Free, no account needed.",
  alternates: { canonical: "/create" },
};

type Props = { searchParams: Promise<{ prompt?: string; draft?: string }> };

/**
 * Search params are read on the server and passed down, so the studio is
 * server-rendered (useSearchParams would force a client-only render).
 */
export default async function CreatePage({ searchParams }: Props) {
  const { prompt, draft } = await searchParams;
  return <Studio initialPrompt={typeof prompt === "string" ? prompt : null} initialDraftId={typeof draft === "string" ? draft : null} />;
}
