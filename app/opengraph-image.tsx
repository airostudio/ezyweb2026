import { ImageResponse } from "next/og";
import { googleFont, svgDataUri } from "@/lib/brand-assets";

export const alt = "Webese by ezyweb — Type a vibe. Get a website.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const HEADLINE = ["Type a vibe.", "Get a website."];
const SUB = "Free, fun websites in seconds.";
const CARDS = [
  { e: "🐱", t: "MOCHI.EXE", bg: "#06070d", fg: "#effaff", a: "#00e5ff", r: -8, x: 770, y: 40 },
  { e: "🦖", t: "Max turns 8!", bg: "#f3fbe8", fg: "#13300f", a: "#ff8a1f", r: 7, x: 925, y: 205 },
  { e: "🗿", t: "Cursed Memes", bg: "#fffbe6", fg: "#111111", a: "#ff3d00", r: -5, x: 765, y: 395 },
];

/** Shareable OG card: logo, big type, neon glow and a stack of example sites. */
export default async function OgImage() {
  const [logo, display, body] = await Promise.all([
    svgDataUri("public/logo.svg"),
    googleFont("Bricolage Grotesque", 800, HEADLINE.join("") + CARDS.map((c) => c.t).join("")),
    googleFont("Bricolage Grotesque", 500, SUB),
  ]);
  const fonts = [
    ...(display ? [{ name: "Display", data: display, weight: 800 as const }] : []),
    ...(body ? [{ name: "Display", data: body, weight: 500 as const }] : []),
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          fontFamily: "Display, sans-serif",
          // Satori has no filter:blur, so glows are radial gradients.
          backgroundColor: "#07080b",
          backgroundImage:
            "radial-gradient(circle at 8% 0%, rgba(0,229,255,.38), transparent 45%), radial-gradient(circle at 100% 100%, rgba(255,43,214,.4), transparent 50%)",
        }}
      >
        {CARDS.map((c) => (
          <div
            key={c.t}
            style={{
              position: "absolute",
              left: c.x,
              top: c.y,
              width: 270,
              height: 185,
              borderRadius: 22,
              background: c.bg,
              color: c.fg,
              transform: `rotate(${c.r}deg)`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              boxShadow: "0 30px 60px rgba(0,0,0,.55)",
              border: "1px solid rgba(255,255,255,.15)",
            }}
          >
            <div style={{ fontSize: 56 }}>{c.e}</div>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1 }}>{c.t}</div>
            <div style={{ width: 84, height: 16, borderRadius: 99, background: c.a }} />
          </div>
        ))}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 64px", gap: 14, width: 760 }}>
          <img src={logo} width={300} height={120} alt="" style={{ marginLeft: -12 }} />
          <div style={{ display: "flex", flexDirection: "column", color: "#f4f2ec", fontSize: 84, fontWeight: 800, lineHeight: 1, letterSpacing: -3 }}>
            <span>{HEADLINE[0]}</span>
            <span style={{ backgroundImage: "linear-gradient(90deg,#06d6ff,#f7a9d6 55%,#d21fd8)", backgroundClip: "text", color: "transparent" }}>
              {HEADLINE[1]}
            </span>
          </div>
          <div style={{ color: "#b3b5bd", fontSize: 32, fontWeight: 500 }}>{SUB}</div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
