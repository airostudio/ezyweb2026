"use client";

import { AnimatePresence, m } from "framer-motion";
import { ExternalLink, Globe, MoreHorizontal, Pencil, Plus, Settings, ShieldAlert, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { drafts, useDrafts, useHydrated, type Draft } from "@/lib/drafts";
import { PLANS } from "@/lib/content";
import { timeAgo } from "@/lib/utils";
import styles from "./dashboard.module.css";

export function MySites({ userName, signedIn }: { userName: string | null; signedIn: boolean }) {
  const list = useDrafts();
  const hydrated = useHydrated();
  const toast = useToast();
  const router = useRouter();
  const params = useSearchParams();
  const [toDelete, setToDelete] = useState<Draft | null>(null);
  const upgrade = PLANS.find((p) => p.id === params.get("upgrade"));

  const published = list.filter((d) => d.published).length;

  return (
    <div className="stack" style={{ "--gap": "2rem" } as React.CSSProperties}>
      <header className={styles.head}>
        <div className="stack" style={{ "--gap": "0.5rem" } as React.CSSProperties}>
          <p className="eyebrow">Dashboard</p>
          <h1 className="h-1">{userName ? `G'day, ${userName}` : "My sites"}</h1>
          <p className="muted">
            {hydrated ? `${list.length} ${list.length === 1 ? "site" : "sites"} · ${published} live` : " "}
          </p>
        </div>
        <div className="row">
          <Link href="/dashboard/settings" className="btn btn-outline">
            <Settings aria-hidden /> Settings
          </Link>
          <Link href="/create" className="btn btn-primary">
            <Plus aria-hidden /> New site
          </Link>
        </div>
      </header>

      {!signedIn && hydrated && list.length > 0 && (
        <div className={styles.banner} role="note">
          <ShieldAlert aria-hidden />
          <p>
            These sites are saved on <strong>this device only</strong>. <Link href="/signin?callbackUrl=/dashboard">Sign in</Link> to keep them
            safe and edit from anywhere.
          </p>
        </div>
      )}

      {!hydrated ? (
        <ul className={styles.grid} aria-busy="true" aria-label="Loading sites">
          {[0, 1, 2].map((i) => (
            <li key={i} className={styles.skeleton} />
          ))}
        </ul>
      ) : list.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className={styles.grid}>
          <AnimatePresence initial={false}>
            {list.map((d, i) => (
              <m.li
                key={d.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
              >
                <SiteCard draft={d} onDelete={() => setToDelete(d)} />
              </m.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      <Dialog open={Boolean(toDelete)} onOpenChange={(o) => !o && setToDelete(null)}>
        <DialogContent>
          <DialogTitle>Delete “{toDelete?.title}”?</DialogTitle>
          <DialogDescription>
            {toDelete?.published ? "It'll go offline straight away and the address becomes available to others. " : ""}This can&apos;t be undone.
          </DialogDescription>
          <div className="row" style={{ justifyContent: "flex-end" }}>
            <button type="button" className="btn btn-ghost" onClick={() => setToDelete(null)}>
              Keep it
            </button>
            <button
              type="button"
              className="btn btn-primary"
              style={{ background: "var(--danger)", color: "#fff" }}
              onClick={() => {
                if (toDelete) drafts.remove(toDelete.id);
                toast("Site deleted. Gone, but not forgotten.", "🪦");
                setToDelete(null);
              }}
            >
              <Trash2 aria-hidden /> Delete forever
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(upgrade)} onOpenChange={(o) => !o && router.replace("/dashboard")}>
        <DialogContent>
          <DialogTitle>Upgrade to {upgrade?.name} ✨</DialogTitle>
          <DialogDescription>
            Checkout isn&apos;t wired up in this build yet. Plug in Stripe (see README → Payments) and this button will take you there.
          </DialogDescription>
          <ul className={styles.upgradeList}>
            {upgrade?.features.map((f) => (
              <li key={f}>✓ {f}</li>
            ))}
          </ul>
          <button type="button" className="btn btn-electric w-full" onClick={() => router.replace("/dashboard")}>
            Sounds good
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SiteCard({ draft, onDelete }: { draft: Draft; onDelete: () => void }) {
  const [menu, setMenu] = useState(false);
  return (
    <article className={`card ${styles.site}`}>
      <Link href={`/create?draft=${draft.id}`} className={styles.preview} aria-label={`Edit ${draft.title}`}>
        {/* A scaled-down live render of the site. Non-interactive and lazy. */}
        <iframe title="" aria-hidden tabIndex={-1} srcDoc={thumbnailHtml(draft.html)} sandbox="" loading="lazy" className={styles.previewFrame} />
      </Link>
      <div className={styles.siteMeta}>
        <div className={styles.siteText}>
          <h2 className={styles.siteTitle}>
            <span aria-hidden>{draft.emoji}</span> {draft.title}
          </h2>
          <p className={styles.siteSub}>
            {draft.published ? (
              <span className={styles.live}>
                <Globe aria-hidden /> {draft.published.customDomain ?? `${draft.published.subdomain}.webese.ai`}
              </span>
            ) : (
              <span className="subtle">Draft</span>
            )}
            <span className="subtle"> · {timeAgo(draft.updatedAt)}</span>
          </p>
        </div>
        <div className={styles.menuWrap}>
          <button type="button" className="btn btn-ghost btn-icon btn-sm" aria-label={`More actions for ${draft.title}`} aria-expanded={menu} onClick={() => setMenu((open) => !open)}>
            <MoreHorizontal aria-hidden />
          </button>
          <AnimatePresence>
            {menu && (
              <m.div
                className={styles.menu}
                initial={{ opacity: 0, scale: 0.9, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onKeyDown={(e) => e.key === "Escape" && setMenu(false)}
                onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setMenu(false)}
              >
                <Link href={`/create?draft=${draft.id}`} autoFocus>
                  <Pencil aria-hidden /> Edit
                </Link>
                {draft.published && (
                  <Link href={`/p/${draft.published.subdomain}`} target="_blank">
                    <ExternalLink aria-hidden /> View live
                  </Link>
                )}
                <button type="button" onClick={onDelete} className={styles.danger}>
                  <Trash2 aria-hidden /> Delete
                </button>
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </article>
  );
}

/**
 * Thumbnails run with scripts disabled, so strip them (avoids console noise)
 * and force scroll-reveal sections visible since their JS never runs.
 */
function thumbnailHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace("</head>", "<style>.reveal{opacity:1!important;transform:none!important}</style></head>");
}

function EmptyState() {
  return (
    <m.div className={styles.empty} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div className={styles.emptyArt} aria-hidden>
        <span>🏜️</span>
        <m.span animate={{ x: [-60, 60], rotate: [0, 360] }} transition={{ duration: 4, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}>
          🌵
        </m.span>
      </div>
      <h2 className="h-2">It&apos;s a bit empty in here</h2>
      <p className="muted">Your sites will live here. Let&apos;s fix that in about five seconds.</p>
      <Link href="/create" className="btn btn-electric btn-lg">
        <Plus aria-hidden /> Make my first site
      </Link>
    </m.div>
  );
}
