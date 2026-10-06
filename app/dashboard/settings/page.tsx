import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { SettingsForm } from "@/components/dashboard/settings-form";
import { slugify } from "@/lib/utils";

export const metadata: Metadata = { title: "Settings", robots: { index: false } };

export default async function SettingsPage() {
  const session = await auth();

  return (
    <div className="section" style={{ paddingTop: "clamp(2rem, 5vw, 3.5rem)" }}>
      <div className="container stack" style={{ "--gap": "2rem" } as React.CSSProperties}>
        <header className="stack" style={{ "--gap": "0.5rem" } as React.CSSProperties}>
          <Link href="/dashboard" className="subtle" style={{ fontSize: "0.9rem" }}>
            ← My sites
          </Link>
          <h1 className="h-1">Settings</h1>
        </header>

        {session?.user ? (
          <SettingsForm
            email={session.user.email ?? ""}
            defaults={{
              name: session.user.name ?? "",
              username: slugify(session.user.email?.split("@")[0] ?? session.user.name ?? "legend", 24),
              marketing: false,
            }}
          />
        ) : (
          <div className="card stack" style={{ "--gap": "1rem", padding: "2rem", maxWidth: "36rem" } as React.CSSProperties}>
            <p style={{ fontSize: "2.5rem" }} aria-hidden>
              🔐
            </p>
            <h2 className="h-3">Sign in to see your settings</h2>
            <p className="muted">Settings are tied to your account. Signing in takes one tap — no passwords.</p>
            <Link href="/signin?callbackUrl=/dashboard/settings" className="btn btn-primary" style={{ justifySelf: "start" }}>
              Sign in
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
