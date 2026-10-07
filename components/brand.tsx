import Image from "next/image";
import { cn } from "@/lib/utils";
import styles from "./brand.module.css";

/*
 * Brand assets (aduma.io). Source artwork: /public/logo26.png.
 * Optimised derivatives live in /public/brand:
 *   aduma-logo.png       full logo for light backgrounds
 *   aduma-logo-dark.png  same, with the wordmark recoloured for dark backgrounds
 *   aduma-mark.png       square robot mark (badges, app icons)
 * next/image serves them as resized WebP/AVIF.
 */

const LOGO_RATIO = 900 / 323; // width / height of the logo artwork

/**
 * Full aduma.io logo. Size it with `height` (CSS length via className or the
 * prop). Both theme variants are rendered; CSS shows the one matching
 * [data-theme], and the hidden one is never downloaded (lazy + display:none).
 */
export function BrandLogo({
  className,
  title = "aduma.io",
  height = 48,
}: {
  className?: string;
  title?: string;
  /** Rendered height in px, used for responsive image sizing */
  height?: number;
}) {
  const width = Math.round(height * LOGO_RATIO);
  // No `priority`: it would force both theme variants to download.
  const common = { width, height, sizes: `${width}px` } as const;
  return (
    <span className={cn(styles.logo, className)} role="img" aria-label={title}>
      <Image src="/brand/aduma-logo.png" alt="" className={styles.light} {...common} />
      <Image src="/brand/aduma-logo-dark.png" alt="" className={styles.dark} {...common} />
    </span>
  );
}

/** Square robot mark. */
export function BrandMark({ size = 32, className }: { size?: number; className?: string }) {
  return <Image src="/brand/aduma-mark.png" alt="" aria-hidden width={size} height={size} sizes={`${size}px`} className={className} />;
}
