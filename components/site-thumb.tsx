import type { GalleryItem } from "@/lib/content";
import { slugify } from "@/lib/utils";
import styles from "./site-thumb.module.css";

/**
 * A CSS-only miniature of a generated site, drawn from its palette + style.
 * Far lighter than iframes or screenshots, so galleries stay 60fps.
 */
export function SiteThumb({
  item,
  className,
  compact = false,
}: {
  item: Pick<GalleryItem, "title" | "emoji" | "colors" | "style" | "id">;
  className?: string;
  compact?: boolean;
}) {
  const [bg, text, accent, accent2] = item.colors;
  const vars = { "--t-bg": bg, "--t-text": text, "--t-a": accent, "--t-a2": accent2 } as React.CSSProperties;

  return (
    <div className={[styles.frame, styles[item.style], compact && styles.compact, className].filter(Boolean).join(" ")} style={vars} aria-hidden>
      <div className={styles.bar}>
        <span />
        <span />
        <span />
        <p className={styles.url}>{slugify(item.id, 18)}.aduma.io</p>
      </div>
      <div className={styles.page}>
        <div className={styles.blob} />
        <div className={styles.emoji}>{item.emoji}</div>
        <p className={styles.title}>{item.title}</p>
        <div className={styles.lines}>
          <i />
          <i />
        </div>
        <div className={styles.cta} />
        {!compact && (
          <div className={styles.cards}>
            <i />
            <i />
            <i />
          </div>
        )}
      </div>
    </div>
  );
}
