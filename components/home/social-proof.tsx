"use client";

import { animate, useInView } from "framer-motion";
import { Star } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { RECENT_CREATIONS } from "@/lib/content";
import styles from "./home.module.css";

/** Baseline + a steady trickle so the counter feels alive (mock data). */
const BASE = 1_284_317;
const LAUNCH = Date.UTC(2026, 0, 1);
const liveCount = () => BASE + Math.floor((Date.now() - LAUNCH) / 9_000);

export function SocialProof() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [count, setCount] = useState(BASE);

  useEffect(() => {
    if (!inView) return;
    const target = liveCount();
    const controls = animate(target - 4_000, target, {
      duration: 1.8,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setCount(Math.round(v)),
    });
    const tick = window.setInterval(() => setCount((c) => c + 1), 2_600);
    return () => {
      controls.stop();
      window.clearInterval(tick);
    };
  }, [inView]);

  const items = [...RECENT_CREATIONS, ...RECENT_CREATIONS];

  return (
    <section className={styles.proof} aria-label="Webese by the numbers">
      <div className={`container ${styles.proofTop}`} ref={ref}>
        <div className={styles.stat}>
          <p className={styles.statNum}>
            <span className="text-gradient">{count.toLocaleString("en-AU")}</span>
          </p>
          <p className="muted">sites made so far (and counting, live)</p>
        </div>
        <div className={styles.stat}>
          <div className={styles.faces} aria-hidden>
            {["🦘", "🐨", "🦜", "🐊", "🦩"].map((f) => (
              <span key={f}>{f}</span>
            ))}
          </div>
          <p className="muted">
            <span className={styles.stars} aria-hidden>
              {Array.from({ length: 5 }, (_, i) => (
                <Star key={i} />
              ))}
            </span>
            <span className="sr-only">Rated </span>4.9/5 from 12,000+ happy humans
          </p>
        </div>
        <div className={styles.stat}>
          <p className={styles.statNum}>~5s</p>
          <p className="muted">from idea to live website</p>
        </div>
      </div>

      <div className={styles.marquee} aria-label="Recently created sites">
        <ul className={styles.marqueeTrack}>
          {items.map((t, i) => (
            <li key={i} aria-hidden={i >= RECENT_CREATIONS.length || undefined}>
              {t}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
