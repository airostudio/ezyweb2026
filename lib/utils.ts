import { clsx, type ClassValue } from "clsx";

/** Joins class names conditionally (no Tailwind, so no merge step needed). */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

export function slugify(input: string, max = 32): string {
  return (
    input
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, max)
      .replace(/-+$/g, "") || "my-site"
  );
}

const rtf = typeof Intl !== "undefined" ? new Intl.RelativeTimeFormat("en-AU", { numeric: "auto" }) : null;

export function timeAgo(ts: number): string {
  const diff = (ts - Date.now()) / 1000;
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31_536_000], ["month", 2_592_000], ["week", 604_800], ["day", 86_400], ["hour", 3_600], ["minute", 60],
  ];
  for (const [unit, secs] of units) {
    if (Math.abs(diff) >= secs) return rtf?.format(Math.round(diff / secs), unit) ?? "";
  }
  return "just now";
}

export function compactNumber(n: number): string {
  return new Intl.NumberFormat("en-AU", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}
