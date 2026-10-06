"use client";

import { AnimatePresence, m } from "framer-motion";
import { Laptop, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type Pref = "system" | "light" | "dark";
const KEY = "webese:theme";
const ORDER: Pref[] = ["system", "light", "dark"];
const META: Record<Pref, { icon: typeof Sun; label: string }> = {
  system: { icon: Laptop, label: "System theme" },
  light: { icon: Sun, label: "Light theme" },
  dark: { icon: Moon, label: "Dark theme" },
};

function apply(pref: Pref) {
  const dark = pref === "dark" || (pref === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
}

/** Cycles System → Light → Dark. System mode follows OS changes live. */
export function ThemeToggle() {
  const [pref, setPref] = useState<Pref | null>(null);

  useEffect(() => {
    const saved = (localStorage.getItem(KEY) as Pref | null) ?? "system";
    setPref(ORDER.includes(saved) ? saved : "system");
  }, []);

  useEffect(() => {
    if (!pref) return;
    apply(pref);
    if (pref !== "system") return;
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [pref]);

  const current = pref ?? "system";
  const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length]!;
  const Icon = META[current].icon;

  return (
    <button
      type="button"
      className="btn btn-ghost btn-icon btn-sm"
      aria-label={`${META[current].label}. Switch to ${META[next].label.toLowerCase()}`}
      title={META[current].label}
      onClick={() => {
        setPref(next);
        try {
          localStorage.setItem(KEY, next);
        } catch {}
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <m.span
          key={current}
          style={{ display: "inline-flex" }}
          initial={{ rotate: -90, scale: 0.5, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          exit={{ rotate: 90, scale: 0.5, opacity: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 28 }}
        >
          <Icon aria-hidden />
        </m.span>
      </AnimatePresence>
    </button>
  );
}
