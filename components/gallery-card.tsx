"use client";

import { motion } from "framer-motion";
import { Repeat2, Wand2 } from "lucide-react";
import Link from "next/link";
import { SiteThumb } from "@/components/site-thumb";
import { track } from "@/lib/analytics";
import type { GalleryItem } from "@/lib/content";
import { compactNumber } from "@/lib/utils";
import styles from "./gallery-card.module.css";

/** Community example with a "Remix this" action that seeds the studio. */
export function GalleryCard({ item, priority = false }: { item: GalleryItem; priority?: boolean }) {
  const href = `/create?prompt=${encodeURIComponent(item.prompt)}&remix=${item.id}`;
  return (
    <motion.article
      className={styles.card}
      whileHover={{ y: -6, rotate: -0.6 }}
      transition={{ type: "spring", stiffness: 400, damping: 26 }}
      data-priority={priority || undefined}
    >
      <div className={styles.thumbWrap}>
        <SiteThumb item={item} />
        <div className={styles.overlay}>
          <p className={styles.prompt}>“{item.prompt}”</p>
        </div>
      </div>
      <div className={styles.meta}>
        <div className={styles.text}>
          <h3 className={styles.title}>
            <span aria-hidden>{item.emoji}</span> {item.title}
          </h3>
          <p className={styles.byline}>
            {item.author} · <Repeat2 aria-hidden className={styles.inline} /> {compactNumber(item.remixes)}
            <span className="sr-only"> remixes</span>
          </p>
        </div>
        <Link
          href={href}
          className={`btn btn-primary btn-sm ${styles.remix}`}
          onClick={() => track("remix_clicked", { id: item.id })}
          aria-label={`Remix ${item.title}`}
        >
          <Wand2 aria-hidden /> Remix
        </Link>
      </div>
    </motion.article>
  );
}
