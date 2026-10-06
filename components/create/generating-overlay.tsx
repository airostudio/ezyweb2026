"use client";

import { AnimatePresence, m } from "framer-motion";
import { Check } from "lucide-react";
import { useEffect, useRef } from "react";
import { STAGES } from "@/lib/generator/stages";
import styles from "./studio.module.css";

const ORB_SHAPES = [
  "42% 58% 70% 30% / 45% 45% 55% 55%",
  "70% 30% 46% 54% / 30% 39% 61% 70%",
  "36% 64% 33% 67% / 63% 38% 62% 37%",
  "42% 58% 70% 30% / 45% 45% 55% 55%",
];

/**
 * Full-preview "magic in progress" takeover: a morphing orb, floating
 * sparks, a stage checklist and the HTML streaming in like a hacker movie.
 */
export function GeneratingOverlay({
  stage,
  thought,
  code,
  prompt,
}: {
  stage: number;
  thought: string;
  code: string;
  prompt: string;
}) {
  const codeRef = useRef<HTMLPreElement>(null);
  useEffect(() => {
    const el = codeRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [code]);

  const progress = Math.min(100, ((stage + 1) / STAGES.length) * 100);

  return (
    <m.div
      className={styles.overlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04, filter: "blur(8px)" }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      role="status"
      aria-live="polite"
      aria-label="Generating your website"
    >
      <div className={styles.sparks} aria-hidden>
        {Array.from({ length: 14 }, (_, i) => (
          <m.span
            key={i}
            className={styles.spark}
            style={{ left: `${8 + ((i * 61) % 84)}%`, background: ["var(--cyan)", "var(--magenta)", "var(--wattle)"][i % 3] }}
            animate={{ y: [40, -160], opacity: [0, 1, 0], scale: [0.6, 1.1, 0.4] }}
            transition={{ duration: 2.6 + (i % 4) * 0.5, repeat: Infinity, delay: i * 0.22, ease: "easeOut" }}
          />
        ))}
      </div>

      <div className={styles.overlayInner}>
        <div className={styles.orbWrap} aria-hidden>
          <m.div
            className={styles.orb}
            animate={{ borderRadius: ORB_SHAPES, rotate: [0, 90, 200, 360], scale: [1, 1.08, 0.96, 1] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          <m.div
            className={styles.orbRing}
            animate={{ rotate: -360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          />
          <span className={styles.orbEmoji}>✨</span>
        </div>

        <p className={styles.overlayPrompt}>“{prompt}”</p>

        <div className={styles.thought}>
          <AnimatePresence mode="wait">
            <m.p
              key={thought}
              initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
              transition={{ duration: 0.3 }}
            >
              {thought || "Warming up the magic…"}
            </m.p>
          </AnimatePresence>
        </div>

        <div className={styles.progress} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)} aria-label="Progress">
          <m.div className={styles.progressBar} animate={{ width: `${progress}%` }} transition={{ type: "spring", stiffness: 80, damping: 20 }} />
        </div>

        <ol className={styles.stageList}>
          {STAGES.map((label, i) => {
            const state = i < stage ? "done" : i === stage ? "active" : "todo";
            return (
              <li key={label} className={styles.stageItem} data-state={state}>
                <span className={styles.stageDot} aria-hidden>
                  {state === "done" ? <Check /> : state === "active" ? <span className="spinner" /> : null}
                </span>
                {label}
                <span className="sr-only">{state === "done" ? " (done)" : state === "active" ? " (in progress)" : ""}</span>
              </li>
            );
          })}
        </ol>

        {code && (
          <pre ref={codeRef} className={styles.codeStream} aria-hidden>
            {code.slice(-1400)}
          </pre>
        )}
      </div>
    </m.div>
  );
}
