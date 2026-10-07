import type { Metadata } from "next";
import { enabledSocialProviders } from "@/auth";
import { SignInForm } from "@/components/auth/sign-in-form";
import styles from "@/components/auth/auth.module.css";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to aduma.io with a magic link, Google or Apple. No passwords, ever.",
  robots: { index: false },
};

type Props = { searchParams: Promise<{ callbackUrl?: string; error?: string }> };

export default async function SignInPage({ searchParams }: Props) {
  const { callbackUrl, error } = await searchParams;
  // Only allow same-site relative redirects.
  const safeCallback = callbackUrl?.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : "/dashboard";

  return (
    <section className={styles.page}>
      <div className={styles.glow} aria-hidden />
      <div className={`card ${styles.card}`}>
        <SignInForm
          callbackUrl={safeCallback}
          providers={enabledSocialProviders}
          showDevHints={process.env.NODE_ENV !== "production"}
          error={error}
        />
      </div>
    </section>
  );
}
