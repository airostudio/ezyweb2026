"use client";

import { AnimatePresence, m } from "framer-motion";
import { useEffect, useState } from "react";

const COLOURS = ["#00e5ff", "#ff2bd6", "#ffc23d", "#c6ff3d", "#ffffff"];

interface Piece {
  id: number;
  x: number;
  dx: number;
  rot: number;
  colour: string;
  delay: number;
  w: number;
  round: boolean;
}

/**
 * Fire-and-forget confetti burst. Change `fire` (e.g. a counter) to trigger.
 * Skipped entirely when the user prefers reduced m.
 */
export function Confetti({ fire, count = 90 }: { fire: number; count?: number }) {
  const [pieces, setPieces] = useState<Piece[]>([]);

  useEffect(() => {
    if (!fire) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const batch = Array.from({ length: count }, (_, i) => ({
      id: fire * 1000 + i,
      x: 50 + (Math.random() - 0.5) * 30,
      dx: (Math.random() - 0.5) * 120,
      rot: Math.random() * 900 - 450,
      colour: COLOURS[i % COLOURS.length]!,
      delay: Math.random() * 0.25,
      w: 6 + Math.random() * 6,
      round: Math.random() > 0.7,
    }));
    setPieces(batch);
    const t = window.setTimeout(() => setPieces([]), 3200);
    return () => window.clearTimeout(t);
  }, [fire, count]);

  return (
    <div aria-hidden style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 95, overflow: "hidden" }}>
      <AnimatePresence>
        {pieces.map((p) => (
          <m.span
            key={p.id}
            style={{
              position: "absolute",
              left: `${p.x}vw`,
              top: "55vh",
              width: p.w,
              height: p.round ? p.w : p.w * 1.5,
              borderRadius: p.round ? "50%" : 2,
              background: p.colour,
            }}
            initial={{ y: 0, x: 0, opacity: 1, rotate: 0 }}
            animate={{
              y: [0, -260 - Math.random() * 260, 520],
              x: [0, p.dx * 1.4, p.dx * 2.2],
              rotate: p.rot,
              opacity: [1, 1, 0],
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.4 + Math.random() * 0.6, delay: p.delay, ease: [0.2, 0.6, 0.4, 1] }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
