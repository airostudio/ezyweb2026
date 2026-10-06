"use client";

import { m } from "framer-motion";
import { RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import styles from "./status-page.module.css";

/** Route-level error boundary: friendly, recoverable, never a white screen. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className={styles.page} role="alert">
      <m.p
        className={styles.emoji}
        animate={{ rotate: [0, -14, 14, -8, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 0.9 }}
        aria-hidden
      >
        🫠
      </m.p>
      <p className="eyebrow">Error {error.digest ? `· ${error.digest}` : ""}</p>
      <h1 className="h-1">Well, that&apos;s embarrassing.</h1>
      <p className="lead">Something broke on our end. It&apos;s not you, it&apos;s us. Give it another go?</p>
      <div className="row" style={{ justifyContent: "center" }}>
        <button type="button" className="btn btn-primary btn-lg" onClick={reset}>
          <RotateCcw aria-hidden /> Try again
        </button>
        <Link href="/" className="btn btn-outline btn-lg">
          Take me home
        </Link>
      </div>
    </section>
  );
}
