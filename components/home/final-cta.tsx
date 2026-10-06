import { PromptBox } from "@/components/prompt-box";
import { MeshBackground } from "./mesh-background";
import styles from "./home.module.css";

export function FinalCta() {
  return (
    <section className="section" aria-labelledby="final-cta-title">
      <div className="container">
        <div className={`${styles.cta} grain`}>
          <MeshBackground variant="cta" />
          <div className={styles.ctaInner}>
            <p className="eyebrow">Go on, you know you want to</p>
            <h2 id="final-cta-title" className="h-display">
              Your next website is <span className="text-gradient">one sentence</span> away.
            </h2>
            <div className={styles.ctaPrompt}>
              <PromptBox variant="compact" starters={false} demo={false} />
            </div>
            <p className="subtle">Free forever plan · No credit card · No account to start</p>
          </div>
        </div>
      </div>
    </section>
  );
}
