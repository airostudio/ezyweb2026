import styles from "./mesh-background.module.css";

/**
 * Animated gradient mesh + drifting particles. Pure CSS (transform/opacity
 * only), so it costs nothing on the main thread and stays at 60fps.
 */
const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  left: (i * 37) % 100,
  top: (i * 53) % 100,
  size: 2 + (i % 4),
  delay: -(i * 1.7),
  duration: 9 + (i % 6) * 2,
  hue: i % 3,
}));

export function MeshBackground({ variant = "hero" }: { variant?: "hero" | "cta" }) {
  return (
    <div className={`${styles.mesh} ${styles[variant]}`} aria-hidden>
      <div className={`${styles.blob} ${styles.b1}`} />
      <div className={`${styles.blob} ${styles.b2}`} />
      <div className={`${styles.blob} ${styles.b3}`} />
      <div className={styles.grid} />
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className={`${styles.particle} ${styles[`h${p.hue}`]}`}
          style={
            {
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: p.size,
              height: p.size,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
            } as React.CSSProperties
          }
        />
      ))}
      <div className={styles.fade} />
    </div>
  );
}
