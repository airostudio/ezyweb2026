"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, m } from "framer-motion";
import { Check, Copy, ExternalLink, Globe, Lock, PartyPopper, Rocket, Share2 } from "lucide-react";
import { XLogo } from "@/components/icons";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod/mini";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { track } from "@/lib/analytics";
import { drafts, type Draft } from "@/lib/drafts";
import { customDomainSchema, subdomainSchema } from "@/lib/schemas";
import { siteConfig } from "@/lib/site";
import { usePlan } from "@/lib/use-plan";
import { cn, slugify } from "@/lib/utils";
import styles from "./studio.module.css";

type Availability = { state: "idle" | "checking" | "ok" | "bad"; reason?: string; suggestion?: string };

export function PublishDialog({
  open,
  onOpenChange,
  draft,
  onPublished,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft: Draft;
  onPublished: (draft: Draft) => void;
}) {
  const [step, setStep] = useState<"claim" | "live" | "domain">(draft.published ? "live" : "claim");

  useEffect(() => {
    if (open) setStep(draft.published ? "live" : "claim");
  }, [open, draft.published]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={styles.publishDialog}>
        <AnimatePresence mode="wait" initial={false}>
          <m.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            {step === "claim" && (
              <ClaimStep
                draft={draft}
                onDone={(d) => {
                  onPublished(d);
                  setStep("live");
                }}
              />
            )}
            {step === "live" && draft.published && <LiveStep draft={draft} onDomain={() => setStep("domain")} />}
            {step === "domain" && <DomainStep draft={draft} onBack={() => setStep("live")} onSaved={onPublished} />}
          </m.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

/* ── Step 1: claim a free subdomain ───────────────────────────────────── */

function ClaimStep({ draft, onDone }: { draft: Draft; onDone: (d: Draft) => void }) {
  const plan = usePlan();
  const [avail, setAvail] = useState<Availability>({ state: "idle" });
  const [publishing, setPublishing] = useState(false);
  const form = useForm<{ subdomain: string }>({
    resolver: zodResolver(z.object({ subdomain: subdomainSchema })),
    defaultValues: { subdomain: slugify(draft.title, 24) },
    mode: "onChange",
  });
  const sub = form.watch("subdomain");

  // Debounced availability check.
  useEffect(() => {
    const parsed = subdomainSchema.safeParse(sub);
    if (!parsed.success) {
      setAvail({ state: "idle" });
      return;
    }
    if (drafts.isSubdomainTaken(parsed.data, draft.id)) {
      setAvail({ state: "bad", reason: "You're already using that one on another site." });
      return;
    }
    setAvail({ state: "checking" });
    const ctrl = new AbortController();
    const t = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/subdomain?name=${encodeURIComponent(parsed.data)}`, { signal: ctrl.signal });
        const data = (await res.json()) as { available: boolean; reason?: string; suggestion?: string };
        setAvail(data.available ? { state: "ok" } : { state: "bad", reason: data.reason, suggestion: data.suggestion });
      } catch {
        /* aborted */
      }
    }, 350);
    return () => {
      ctrl.abort();
      window.clearTimeout(t);
    };
  }, [sub, draft.id]);

  const onSubmit = form.handleSubmit(async ({ subdomain }) => {
    if (avail.state !== "ok") return;
    setPublishing(true);
    await new Promise((r) => setTimeout(r, 900)); // pretend to deploy to the edge
    const next: Draft = { ...draft, published: { subdomain, at: Date.now(), badge: !plan.removeBadge } };
    drafts.save(next);
    track("site_published", { subdomain });
    setPublishing(false);
    onDone(next);
  });

  const err = form.formState.errors.subdomain?.message;

  return (
    <form onSubmit={onSubmit} noValidate className="stack" style={{ "--gap": "1.1rem" } as React.CSSProperties}>
      <div>
        <DialogTitle>
          Put it on the internet <span aria-hidden>🚀</span>
        </DialogTitle>
        <DialogDescription>Pick your free address. You can change it or add your own domain later.</DialogDescription>
      </div>

      <div className="field">
        <label className="label" htmlFor="subdomain">
          Your free address
        </label>
        <div className="input-group">
          <span className="addon">https://</span>
          <input
            id="subdomain"
            className="input mono"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            aria-invalid={Boolean(err) || avail.state === "bad"}
            aria-describedby="subdomain-status"
            {...form.register("subdomain", { setValueAs: (v: string) => v.toLowerCase().replace(/\s+/g, "-") })}
          />
          <span className="addon">.{siteConfig.publishDomain}</span>
        </div>
        <p id="subdomain-status" className={styles.availability} data-state={err ? "bad" : avail.state} aria-live="polite">
          {err ??
            (avail.state === "checking"
              ? "Checking…"
              : avail.state === "ok"
                ? "✓ It's yours if you want it!"
                : avail.state === "bad"
                  ? avail.reason
                  : " ")}
          {avail.state === "bad" && avail.suggestion && (
            <>
              {" "}
              <button type="button" className={styles.linkBtn} onClick={() => form.setValue("subdomain", avail.suggestion!, { shouldValidate: true })}>
                Try {avail.suggestion}?
              </button>
            </>
          )}
        </p>
      </div>

      <button type="submit" className="btn btn-electric btn-lg w-full" disabled={publishing || avail.state !== "ok"}>
        {publishing ? (
          <>
            <span className="spinner" aria-hidden /> Launching…
          </>
        ) : (
          <>
            <Rocket aria-hidden /> Publish for free
          </>
        )}
      </button>
      <p className="hint center">Published sites are public. Anyone with the link can see them.</p>
    </form>
  );
}

/* ── Step 2: it's live! ───────────────────────────────────────────────── */

function LiveStep({ draft, onDomain }: { draft: Draft; onDomain: () => void }) {
  const { data: session } = useSession();
  const plan = usePlan();
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const pub = draft.published!;
  const publicUrl = pub.customDomain ? `https://${pub.customDomain}` : `https://${pub.subdomain}.${siteConfig.publishDomain}`;
  const localUrl = `/p/${pub.subdomain}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast("Link copied. Go spam the group chat.", "📋");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast("Couldn't copy — select the link manually.", "🙈");
    }
  };

  const share = async () => {
    if (navigator.share) {
      await navigator.share({ title: draft.title, text: `Check out ${draft.title} ${draft.emoji}`, url: publicUrl }).catch(() => {});
    } else void copy();
  };

  return (
    <div className="stack" style={{ "--gap": "1.1rem" } as React.CSSProperties}>
      <m.div
        className={styles.liveBadge}
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 14 }}
        aria-hidden
      >
        <PartyPopper />
      </m.div>
      <div className="center">
        <DialogTitle className={styles.centerTitle}>It&apos;s alive!</DialogTitle>
        <DialogDescription>
          {draft.emoji} <strong>{draft.title}</strong> is live on the internet. Go show someone.
        </DialogDescription>
      </div>

      <div className={styles.urlBox}>
        <Globe aria-hidden />
        <span className="mono">{publicUrl.replace("https://", "")}</span>
        <button type="button" className="btn btn-primary btn-sm" onClick={copy} aria-label="Copy link">
          {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <div className={styles.shareRow}>
        <Link href={localUrl} target="_blank" className="btn btn-outline">
          <ExternalLink aria-hidden /> View live
        </Link>
        <button type="button" className="btn btn-outline" onClick={share}>
          <Share2 aria-hidden /> Share
        </button>
        <a
          className="btn btn-outline btn-icon"
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`I made ${draft.title} ${draft.emoji} with @aduma_io`)}&url=${encodeURIComponent(publicUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on X"
        >
          <XLogo aria-hidden />
        </a>
      </div>

      {plan.customDomain ? (
        <button type="button" className={styles.domainCta} onClick={onDomain}>
          <span className={styles.domainCtaIcon} aria-hidden>
            🌏
          </span>
          <span>
            <strong>Use your own domain</strong>
            <span className="subtle"> — like {slugify(draft.title, 14)}.com.au</span>
          </span>
        </button>
      ) : (
        <Link href="/pricing" className={styles.domainCta} onClick={() => track("upgrade_clicked", { from: "custom-domain" })}>
          <span className={styles.domainCtaIcon} aria-hidden>
            🌏
          </span>
          <span>
            <strong>Want your own domain?</strong>
            <span className="subtle"> Free sites share on a {siteConfig.publishDomain} link. Go Pro for {slugify(draft.title, 14)}.com.au</span>
          </span>
          <span className="badge">Pro</span>
        </Link>
      )}

      {!session?.user && (
        <div className={styles.saveNudge}>
          <Lock aria-hidden />
          <p>
            You&apos;re publishing as a guest. <Link href={`/signin?callbackUrl=${encodeURIComponent(`/create?draft=${draft.id}`)}`}>Sign in</Link> to
            keep it forever and edit from any device.
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Step 3: custom domain ────────────────────────────────────────────── */

function DomainStep({ draft, onBack, onSaved }: { draft: Draft; onBack: () => void; onSaved: (d: Draft) => void }) {
  const [verifying, setVerifying] = useState(false);
  const [domain, setDomain] = useState<string | null>(draft.published?.customDomain ?? null);
  const toast = useToast();
  const form = useForm<{ domain: string }>({
    resolver: zodResolver(z.object({ domain: customDomainSchema })),
    defaultValues: { domain: draft.published?.customDomain ?? "" },
  });

  const onSubmit = form.handleSubmit(({ domain: d }) => {
    setDomain(d);
    track("custom_domain_added");
  });

  const verify = async () => {
    if (!domain || !draft.published) return;
    setVerifying(true);
    await new Promise((r) => setTimeout(r, 1400));
    const next: Draft = { ...draft, published: { ...draft.published, customDomain: domain } };
    drafts.save(next);
    onSaved(next);
    setVerifying(false);
    toast(`${domain} is connected. SSL is on us.`, "🔒");
    onBack();
  };

  const err = form.formState.errors.domain?.message;
  const isApex = domain ? domain.split(".").length === 2 || (/\.(com|net|org)\.au$/.test(domain) && domain.split(".").length === 3) : false;

  return (
    <div className="stack" style={{ "--gap": "1.1rem" } as React.CSSProperties}>
      <div>
        <DialogTitle>Bring your own domain</DialogTitle>
        <DialogDescription>Already own a domain? Point it at aduma.io and we&apos;ll handle the rest, including SSL.</DialogDescription>
      </div>

      <form onSubmit={onSubmit} noValidate className="field">
        <label className="label" htmlFor="custom-domain">
          Domain
        </label>
        <div className={styles.inlineForm}>
          <input
            id="custom-domain"
            className="input mono"
            placeholder="mochi.com.au"
            autoCapitalize="none"
            spellCheck={false}
            aria-invalid={Boolean(err)}
            aria-describedby={err ? "domain-error" : undefined}
            {...form.register("domain")}
          />
          <button type="submit" className="btn btn-primary">
            Next
          </button>
        </div>
        {err && (
          <p id="domain-error" className="error-text" role="alert">
            {err}
          </p>
        )}
      </form>

      {domain && (
        <m.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="stack" style={{ "--gap": "0.75rem" } as React.CSSProperties}>
          <p className="hint">Add these records at your domain registrar (GoDaddy, Crazy Domains, Namecheap…):</p>
          <div className={styles.dnsTable} role="table" aria-label="DNS records">
            <div role="row" className={styles.dnsHead}>
              <span role="columnheader">Type</span>
              <span role="columnheader">Name</span>
              <span role="columnheader">Value</span>
            </div>
            <div role="row">
              <span role="cell">{isApex ? "A" : "CNAME"}</span>
              <span role="cell">{isApex ? "@" : domain.split(".")[0]}</span>
              <span role="cell" className="mono">
                {isApex ? "76.76.21.21" : `cname.${siteConfig.publishDomain}`}
              </span>
            </div>
            <div role="row">
              <span role="cell">TXT</span>
              <span role="cell">_aduma</span>
              <span role="cell" className="mono">
                aduma-verify={draft.id.slice(0, 12)}
              </span>
            </div>
          </div>
          <button type="button" className="btn btn-electric w-full" onClick={verify} disabled={verifying}>
            {verifying ? (
              <>
                <span className="spinner" aria-hidden /> Checking DNS…
              </>
            ) : (
              "I've added them — verify"
            )}
          </button>
          <p className="hint center">
            Custom domains are a <Link href="/pricing">Pro feature</Link>. DNS can take a few minutes to kick in.
          </p>
        </m.div>
      )}

      <button type="button" className={cn("btn btn-ghost btn-sm", styles.back)} onClick={onBack}>
        ← Back
      </button>
    </div>
  );
}
