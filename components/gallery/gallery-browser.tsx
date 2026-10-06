"use client";

import { AnimatePresence, LayoutGroup, m } from "framer-motion";
import { Search, X } from "lucide-react";
import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { GalleryCard } from "@/components/gallery-card";
import { GALLERY, GALLERY_CATEGORIES, type GalleryCategory } from "@/lib/content";
import styles from "./gallery.module.css";

type Sort = "popular" | "fresh";

export function GalleryBrowser() {
  const [category, setCategory] = useState<GalleryCategory | "all">("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("popular");
  const deferredQuery = useDeferredValue(query);

  const items = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    const list = GALLERY.filter(
      (g) =>
        (category === "all" || g.category === category) &&
        (!q || `${g.title} ${g.prompt} ${g.author}`.toLowerCase().includes(q)),
    );
    // "Fresh" uses reverse insertion order as a stand-in for created-at.
    return sort === "popular" ? [...list].sort((a, b) => b.remixes - a.remixes) : [...list].reverse();
  }, [category, deferredQuery, sort]);

  return (
    <div className={styles.browser}>
      <div className={styles.controls}>
        <LayoutGroup id="gallery-filters">
          <ul className={`${styles.filters} scrollbar-none`} aria-label="Filter by category">
            {GALLERY_CATEGORIES.map((c) => (
              <li key={c.id}>
                <button type="button" className="chip" aria-pressed={category === c.id} onClick={() => setCategory(c.id)}>
                  <span aria-hidden>{c.emoji}</span> {c.label}
                </button>
              </li>
            ))}
          </ul>
        </LayoutGroup>

        <div className={styles.searchRow}>
          <div className={styles.search}>
            <Search aria-hidden />
            <label htmlFor="gallery-search" className="sr-only">
              Search the gallery
            </label>
            <input
              id="gallery-search"
              type="search"
              className="input"
              placeholder="Search “dinosaur”, “wedding”, “cat”…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button type="button" className={styles.clear} onClick={() => setQuery("")} aria-label="Clear search">
                <X aria-hidden />
              </button>
            )}
          </div>
          <div className={styles.sort} role="radiogroup" aria-label="Sort">
            {(["popular", "fresh"] as const).map((s) => (
              <button key={s} type="button" role="radio" aria-checked={sort === s} onClick={() => setSort(s)}>
                {s === "popular" ? "🔥 Most remixed" : "✨ Fresh"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {items.length} {items.length === 1 ? "site" : "sites"} shown
      </p>

      {items.length === 0 ? (
        <m.div className={styles.empty} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
          <p className={styles.emptyEmoji} aria-hidden>
            🦗
          </p>
          <h2 className="h-3">Crickets. Nothing matches “{query}”.</h2>
          <p className="muted">Which means you&apos;d be the first. Legendary.</p>
          <Link href={`/create?prompt=${encodeURIComponent(query)}`} className="btn btn-electric">
            Make “{query.slice(0, 30)}” now
          </Link>
        </m.div>
      ) : (
        <m.ul layout className={styles.grid}>
          {/* initial={false}: server-rendered cards are visible immediately;
              only filter/sort changes animate. */}
          <AnimatePresence mode="popLayout" initial={false}>
            {items.map((item, i) => (
              <m.li
                key={item.id}
                layout
                initial={{ opacity: 0, y: 24, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 300, damping: 30, delay: Math.min(i * 0.03, 0.3) }}
              >
                <GalleryCard item={item} headingLevel={2} />
              </m.li>
            ))}
          </AnimatePresence>
        </m.ul>
      )}
    </div>
  );
}
