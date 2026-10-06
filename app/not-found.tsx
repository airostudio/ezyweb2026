import Link from "next/link";
import { Sparkles } from "lucide-react";
import styles from "./status-page.module.css";

export default function NotFound() {
  return (
    <section className={styles.page}>
      <p className={styles.big} aria-hidden>
        <span className={styles.digit}>4</span>
        <span className={styles.spin}>🦘</span>
        <span className={styles.digit}>4</span>
      </p>
      <h1 className="h-1">This page hopped off.</h1>
      <p className="lead">We looked everywhere — under the couch, behind the servo, in the pouch. Nothing.</p>
      <div className="row" style={{ justifyContent: "center" }}>
        <Link href="/" className="btn btn-outline btn-lg">
          Back home
        </Link>
        <Link href="/create" className="btn btn-electric btn-lg">
          <Sparkles aria-hidden /> Make this page exist
        </Link>
      </div>
    </section>
  );
}
