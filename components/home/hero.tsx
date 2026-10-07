import Link from "next/link";
import { PromptBox } from "@/components/prompt-box";
import { ScribbleArrow, Spark } from "@/components/icons";
import { SiteThumb } from "@/components/site-thumb";
import { GALLERY } from "@/lib/content";
import { MeshBackground } from "./mesh-background";
import styles from "./home.module.css";

/** Floating "stickers" of real example sites around the prompt (desktop). */
const FLOATERS = [
  { item: GALLERY[0]!, className: styles.f1 },
  { item: GALLERY[1]!, className: styles.f2 },
  { item: GALLERY[2]!, className: styles.f3 },
  { item: GALLERY[3]!, className: styles.f4 },
];

export function Hero() {
  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <MeshBackground />
      <div className={styles.floaters} aria-hidden>
        {FLOATERS.map(({ item, className }) => (
          <div key={item.id} className={`${styles.floater} ${className}`}>
            <SiteThumb item={item} compact />
          </div>
        ))}
      </div>

      <div className={`container ${styles.heroInner}`}>
        <Link href="/about" className={`${styles.announce} ${styles.rise}`} style={{ "--d": "0ms" } as React.CSSProperties}>
          <span className="badge badge-electric">New</span>
          <span>Fresh from the legends at Ezyweb</span>
          <span aria-hidden>→</span>
        </Link>

        <h1 id="hero-title" className={`h-display ${styles.title}`}>
          <span className={styles.rise} style={{ "--d": "60ms" } as React.CSSProperties}>
            Type a <span className="squiggle">vibe</span>.
          </span>{" "}
          <span className={`${styles.rise} ${styles.titleLine2}`} style={{ "--d": "140ms" } as React.CSSProperties}>
            Get a <span className="text-gradient">website</span>
            <Spark className={styles.titleSpark} />
          </span>
        </h1>

        <p className={`lead ${styles.sub} ${styles.rise}`} style={{ "--d": "220ms" } as React.CSSProperties}>
          Birthday invites, pet shrines, meme museums, wedding pages. Describe it in one sentence and watch aduma.io build it
          live — in seconds. Free, no account, no worries.
        </p>

        <div className={`${styles.promptWrap} ${styles.rise}`} style={{ "--d": "300ms" } as React.CSSProperties}>
          <div className={styles.scribble} aria-hidden>
            <span>start here!</span>
            <ScribbleArrow />
          </div>
          <PromptBox variant="hero" />
        </div>
      </div>
    </section>
  );
}
