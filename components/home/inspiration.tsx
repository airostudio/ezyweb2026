"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { GalleryCard } from "@/components/gallery-card";
import { GALLERY } from "@/lib/content";
import styles from "./home.module.css";

/** Horizontal, scroll-snapping strip of community sites with Remix buttons. */
export function Inspiration() {
  const scroller = useRef<HTMLUListElement>(null);
  const scrollBy = (dir: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <section className={`section cv-auto ${styles.inspo}`} aria-labelledby="inspo-title">
      <div className={`container ${styles.inspoHead}`}>
        <div className="section-head" style={{ marginBottom: 0 }}>
          <p className="eyebrow">Made with Webese</p>
          <h2 id="inspo-title" className="h-1">
            Steal this idea. <br />
            <span className="text-gradient">We insist.</span>
          </h2>
          <p className="lead">Every site here was made from one sentence. Hit Remix and make it yours in seconds.</p>
        </div>
        <div className={styles.inspoNav}>
          <button type="button" className="btn btn-outline btn-icon" onClick={() => scrollBy(-1)} aria-label="Scroll examples left">
            <ArrowLeft aria-hidden />
          </button>
          <button type="button" className="btn btn-outline btn-icon" onClick={() => scrollBy(1)} aria-label="Scroll examples right">
            <ArrowRight aria-hidden />
          </button>
        </div>
      </div>
      <ul ref={scroller} className={`scrollbar-none ${styles.strip}`} aria-label="Example sites">
        {GALLERY.slice(0, 10).map((item) => (
          <li key={item.id} className={styles.stripItem}>
            <GalleryCard item={item} />
          </li>
        ))}
        <li className={`${styles.stripItem} ${styles.stripMore}`}>
          <Link href="/gallery" className={styles.moreCard}>
            <span className={styles.moreEmoji} aria-hidden>
              🖼️
            </span>
            <span className="h-3">See the whole gallery</span>
            <ArrowRight aria-hidden />
          </Link>
        </li>
      </ul>
    </section>
  );
}
