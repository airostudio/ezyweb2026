"use client";

import { m } from "framer-motion";
import { Check, Copy, Link2 } from "lucide-react";
import styles from "./home.module.css";

const STEPS = [
  {
    n: "01",
    title: "Say it like you'd text a mate",
    body: "No templates, no drag-and-drop, no 47-step wizard. Just tell Webese what you want, in your own words.",
    art: <ChatArt />,
  },
  {
    n: "02",
    title: "Watch it build itself",
    body: "Colours, words, layout, little touches of magic — generated live while you watch. Then tweak it by chatting.",
    art: <BuildArt />,
  },
  {
    n: "03",
    title: "Share it with the world",
    body: "One tap gets you a free yourname.webese.ai link. Got your own domain? Plug it in. Done. Go tell the group chat.",
    art: <ShareArt />,
  },
];

export function HowItWorks() {
  return (
    <section className="section cv-auto" aria-labelledby="how-title">
      <div className="container">
        <div className="section-head is-center">
          <p className="eyebrow">How it works</p>
          <h2 id="how-title" className="h-1">
            Three steps. <span className="text-gradient">Zero faff.</span>
          </h2>
        </div>
        <ol className={styles.steps}>
          {STEPS.map((s, i) => (
            <m.li
              key={s.n}
              className={`card ${styles.step}`}
              initial={{ opacity: 0, y: 40, rotate: i === 1 ? 0 : i === 0 ? -2 : 2 }}
              whileInView={{ opacity: 1, y: 0, rotate: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ type: "spring", stiffness: 120, damping: 18, delay: i * 0.12 }}
              whileHover={{ y: -8 }}
            >
              <div className={styles.stepArt}>{s.art}</div>
              <p className={styles.stepN}>{s.n}</p>
              <h3 className="h-3">{s.title}</h3>
              <p className="muted">{s.body}</p>
            </m.li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function ChatArt() {
  return (
    <div className={styles.chatArt} aria-hidden>
      <m.div
        className={styles.bubble}
        initial={{ scale: 0.6, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ type: "spring", delay: 0.3 }}
      >
        a shrine for my cat but make it ✨cyberpunk✨
      </m.div>
      <div className={styles.typing}>
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

function BuildArt() {
  return (
    <div className={styles.buildArt} aria-hidden>
      <m.div
        className={styles.morph}
        animate={{
          borderRadius: ["42% 58% 70% 30% / 45% 45% 55% 55%", "70% 30% 46% 54% / 30% 39% 61% 70%", "42% 58% 70% 30% / 45% 45% 55% 55%"],
          rotate: [0, 120, 360],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      {[0, 1, 2, 3].map((i) => (
        <m.span
          key={i}
          className={styles.buildBar}
          style={{ top: `${22 + i * 16}%` }}
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 + i * 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        />
      ))}
    </div>
  );
}

function ShareArt() {
  return (
    <div className={styles.shareArt} aria-hidden>
      <m.div
        className={styles.urlPill}
        initial={{ y: 20, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ type: "spring", delay: 0.3 }}
      >
        <Link2 />
        <span>mochi.webese.ai</span>
        <span className={styles.copied}>
          <Copy className={styles.copyIcon} />
          <Check className={styles.checkIcon} />
        </span>
      </m.div>
      {["#00e5ff", "#ff2bd6", "#ffc23d", "#c6ff3d", "#00e5ff", "#ff2bd6"].map((c, i) => (
        <m.i
          key={i}
          className={styles.confettiBit}
          style={{ background: c, left: `${15 + i * 14}%` }}
          initial={{ y: 0, opacity: 0, rotate: 0 }}
          whileInView={{ y: [-4, -40 - (i % 3) * 14, 10], opacity: [0, 1, 0], rotate: 200 }}
          viewport={{ once: false }}
          transition={{ duration: 1.6, delay: 0.8 + i * 0.05, repeat: Infinity, repeatDelay: 2 }}
        />
      ))}
    </div>
  );
}
