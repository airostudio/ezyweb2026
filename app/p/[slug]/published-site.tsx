"use client";

import { m } from "framer-motion";
import Link from "next/link";
import { BrandMark } from "@/components/brand";
import { drafts, useDrafts, useHydrated } from "@/lib/drafts";
import styles from "./published.module.css";

export function PublishedSite({ slug }: { slug: string }) {
  const hydrated = useHydrated();
  useDrafts(); // subscribe so edits in another tab show up live
  const draft = hydrated ? drafts.bySubdomain(slug) : undefined;

  if (!hydrated) return <div className={styles.full} aria-busy="true" />;

  if (!draft) {
    return (
      <div className={styles.missing}>
        <m.p className={styles.missingEmoji} animate={{ rotate: [0, -12, 12, 0] }} transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 1 }} aria-hidden>
          🔭
        </m.p>
        <h1 className="h-2">{slug}.webese.ai is still up for grabs</h1>
        <p className="lead">Nobody&apos;s built anything here yet. It could be yours in about five seconds.</p>
        <Link href="/create" className="btn btn-electric btn-lg">
          Claim it with a site
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.full}>
      <iframe title={draft.title} srcDoc={draft.html} sandbox="allow-scripts allow-forms allow-popups" className={styles.iframe} />
      <m.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1.2, type: "spring", stiffness: 200, damping: 20 }}>
        <Link href={`/create?prompt=${encodeURIComponent(draft.prompt)}`} className={styles.badge}>
          <BrandMark width={22} height={22} />
          <span>
            Made with <strong>Webese</strong> — make yours
          </span>
        </Link>
      </m.div>
    </div>
  );
}
