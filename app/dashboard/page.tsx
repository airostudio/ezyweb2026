import type { Metadata } from "next";
import { Suspense } from "react";
import { auth } from "@/auth";
import { MySites } from "@/components/dashboard/my-sites";

export const metadata: Metadata = { title: "My sites", robots: { index: false } };

export default async function DashboardPage() {
  const session = await auth();
  return (
    <div className="section" style={{ paddingTop: "clamp(2rem, 5vw, 3.5rem)" }}>
      <div className="container">
        <Suspense>
          <MySites userName={session?.user?.name ?? null} signedIn={Boolean(session?.user)} />
        </Suspense>
      </div>
    </div>
  );
}
