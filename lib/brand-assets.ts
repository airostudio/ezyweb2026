import { readFile } from "node:fs/promises";
import { join } from "node:path";

/** Brand SVGs as data URIs for next/og ImageResponse (build-time only). */
export async function svgDataUri(relPath: string): Promise<string> {
  const svg = await readFile(join(process.cwd(), relPath), "utf8");
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

/**
 * Fetches a Google Font as TTF for next/og. Returns null on any failure so
 * image generation degrades to the default font instead of breaking a build.
 */
export async function googleFont(family: string, weight: number, text: string): Promise<ArrayBuffer | null> {
  try {
    const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&text=${encodeURIComponent(text)}`;
    const css = await (await fetch(url)).text();
    const src = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
    if (!src) return null;
    const res = await fetch(src);
    return res.ok ? await res.arrayBuffer() : null;
  } catch {
    return null;
  }
}
