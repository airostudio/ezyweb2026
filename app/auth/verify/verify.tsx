"use client";

import { m } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { Confetti } from "@/components/confetti";
import styles from "@/components/auth/auth.module.css";

/** Exchanges the magic-link token for a session, then sends you on your way. */
export function VerifyMagicLink() {
  const params = useSearchParams();
  const router = useRouter();
  const [state, setState] = useState<"verifying" | "ok" | "bad">("verifying");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const token = params.get("token");
    const nextParam = params.get("next") ?? "/dashboard";
    const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/dashboard";
    if (!token) {
      setState("bad");
      return;
    }
    void signIn("magic-link", { token, redirect: false }).then((res) => {
      if (res?.error || !res?.ok) {
        setState("bad");
        return;
      }
      setState("ok");
      window.setTimeout(() => {
        router.replace(next);
        router.refresh();
      }, 1400);
    });
  }, [params, router]);

  if (state === "bad") {
    return (
      <div className={styles.verify} role="alert">
        <p className={styles.verifyEmoji} aria-hidden>
          ⌛
        </p>
        <h1 className="h-2">That link&apos;s gone stale</h1>
        <p className="muted">Magic links expire after 15 minutes (or if they&apos;ve been tampered with). Let&apos;s get you a fresh one.</p>
        <Link href="/signin" className="btn btn-primary">
          Send a new link
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.verify} role="status" aria-live="polite">
      <Confetti fire={state === "ok" ? 1 : 0} />
      <m.p
        className={styles.verifyEmoji}
        animate={state === "ok" ? { scale: [1, 1.3, 1], rotate: [0, 15, 0] } : { rotate: 360 }}
        transition={state === "ok" ? { duration: 0.6 } : { duration: 1.6, repeat: Infinity, ease: "linear" }}
        aria-hidden
      >
        {state === "ok" ? "🎉" : "✨"}
      </m.p>
      <h1 className="h-2">{state === "ok" ? "You're in, legend!" : "Waving the magic wand…"}</h1>
      <p className="muted">{state === "ok" ? "Taking you to your sites…" : "Checking your link. This takes about a second."}</p>
    </div>
  );
}
