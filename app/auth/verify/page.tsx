import type { Metadata } from "next";
import { Suspense } from "react";
import { VerifyMagicLink } from "./verify";
import styles from "@/components/auth/auth.module.css";

export const metadata: Metadata = { title: "Signing you in", robots: { index: false } };

export default function VerifyPage() {
  return (
    <section className={styles.page}>
      <div className={styles.glow} aria-hidden />
      <div className={`card ${styles.card}`}>
        <Suspense>
          <VerifyMagicLink />
        </Suspense>
      </div>
    </section>
  );
}
