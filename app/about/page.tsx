import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import styles from "./about.module.css";

export const metadata: Metadata = {
  title: "About",
  description: "How Ezyweb Solutions — the folks who've built websites for Aussie small businesses for years — made aduma.io, the website builder for fun.",
  alternates: { canonical: "/about" },
};

const TIMELINE = [
  { year: "The early days", text: "Ezyweb Solutions starts building websites for tradies, cafes and corner shops. Sensible sites for sensible businesses." },
  { year: "The realisation", text: "Our favourite projects were never the serious ones. It was the side quests — a mate's wedding page, a footy club fixture list, a site for someone's very famous cat." },
  { year: "The 'what if'", text: "What if anyone could make one of those, in seconds, just by describing it? No templates. No wizards. No 'contact sales'." },
  { year: "Today", text: "aduma.io is born: the website builder for the fun stuff, built on our own generation engine and powered by a frankly unreasonable amount of confetti." },
];

const VALUES = [
  { emoji: "🎉", title: "Joy first", text: "If it doesn't make you smile, we're not done." },
  { emoji: "🪶", title: "Feather-light", text: "No accounts to start. No jargon. Nothing to install." },
  { emoji: "🔓", title: "Your stuff is yours", text: "Export anytime. We never sell your data. Ever." },
  { emoji: "♿", title: "For everyone", text: "Accessible by default — in our app and in every site you make." },
];

export default function AboutPage() {
  return (
    <>
      <section className={`section ${styles.hero}`}>
        <div className="container">
          <div className={styles.heroGrid}>
            <div className="stack" style={{ "--gap": "1.25rem" } as React.CSSProperties}>
              <p className="eyebrow">Our story</p>
              <h1 className="h-1">
                We built serious websites for years. <span className="text-gradient">Then we got bored.</span>
              </h1>
              <p className="lead">
                aduma.io is made by Ezyweb Solutions, a small Aussie team who&apos;ve spent a long time making websites for small businesses. We love
                that work. But the internet used to be fun — personal, weird, a bit chaotic — and we wanted to bring that back.
              </p>
            </div>
            <div className={styles.collage} aria-hidden>
              {["🦘", "🎂", "🐱", "💍", "🗿", "🎸"].map((e, i) => (
                <span key={e} className={styles.tile} style={{ "--i": i } as React.CSSProperties}>
                  {e}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="timeline-title" style={{ paddingTop: 0 }}>
        <div className="container">
          <h2 id="timeline-title" className="sr-only">
            From Ezyweb to aduma.io
          </h2>
          <ol className={styles.timeline}>
            {TIMELINE.map((t, i) => (
              <li key={t.year} className={styles.step}>
                <span className={styles.stepN} aria-hidden>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="h-3">{t.year}</h3>
                <p className="muted">{t.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className={`section ${styles.valuesSection}`} aria-labelledby="values-title">
        <div className="container">
          <div className="section-head is-center">
            <p className="eyebrow">What we care about</p>
            <h2 id="values-title" className="h-2">
              The rules we make websites by
            </h2>
          </div>
          <ul className={styles.values}>
            {VALUES.map((v) => (
              <li key={v.title} className="card">
                <span className={styles.valueEmoji} aria-hidden>
                  {v.emoji}
                </span>
                <h3 className="h-3">{v.title}</h3>
                <p className="muted">{v.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section">
        <div className="container center stack" style={{ "--gap": "1.25rem", justifyItems: "center" } as React.CSSProperties}>
          <h2 className="h-1">
            Enough about us. <span className="text-gradient">What are you making?</span>
          </h2>
          <Link href="/create" className="btn btn-electric btn-lg">
            <Sparkles aria-hidden /> Start creating
          </Link>
          <p className="subtle">
            Need a proper business website? <a href="https://ezyweb.com.au" style={{ textDecoration: "underline" }}>Ezyweb Solutions</a> has you covered.
          </p>
        </div>
      </section>
    </>
  );
}
