"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, m } from "framer-motion";
import {
  ArrowUp,
  Code2,
  ExternalLink,
  Eye,
  Laptop,
  MessageCircle,
  Monitor,
  RotateCcw,
  Rocket,
  Smartphone,
  Square,
  Tablet,
  Wand2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod/mini";
import { Confetti } from "@/components/confetti";
import { PromptBox } from "@/components/prompt-box";
import { useToast } from "@/components/ui/toast";
import { track } from "@/lib/analytics";
import { EDIT_SUGGESTIONS } from "@/lib/content";
import { drafts, useDrafts, useHydrated, type ChatMessage, type Draft } from "@/lib/drafts";
import { promptSchema } from "@/lib/schemas";
import { cn, timeAgo } from "@/lib/utils";
import { streamGenerate } from "@/lib/aduma-client";
import { GeneratingOverlay } from "./generating-overlay";
import { PublishDialog } from "./publish-dialog";
import styles from "./studio.module.css";

type Status = "empty" | "generating" | "editing" | "ready" | "error";
type Device = "desktop" | "tablet" | "mobile";

const DEVICES: { id: Device; label: string; icon: typeof Monitor }[] = [
  { id: "desktop", label: "Desktop", icon: Monitor },
  { id: "tablet", label: "Tablet", icon: Tablet },
  { id: "mobile", label: "Mobile", icon: Smartphone },
];

const msg = (role: ChatMessage["role"], text: string): ChatMessage => ({
  id: Math.random().toString(36).slice(2),
  role,
  text,
  at: Date.now(),
});

export function Studio({ initialPrompt, initialDraftId }: { initialPrompt: string | null; initialDraftId: string | null }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const toast = useToast();

  const [status, setStatus] = useState<Status>("empty");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [stage, setStage] = useState(0);
  const [thought, setThought] = useState("");
  const [thoughts, setThoughts] = useState<string[]>([]);
  const [code, setCode] = useState("");
  const [activePrompt, setActivePrompt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [device, setDevice] = useState<Device>("desktop");
  const [view, setView] = useState<"preview" | "code">("preview");
  const [mobileTab, setMobileTab] = useState<"chat" | "preview">("chat");
  const [publishOpen, setPublishOpen] = useState(false);
  const [confetti, setConfetti] = useState(0);

  const abortRef = useRef<AbortController | null>(null);
  const bootedRef = useRef(false);
  const draftRef = useRef<Draft | null>(null);
  const messagesRef = useRef<ChatMessage[]>([]);
  draftRef.current = draft;
  messagesRef.current = messages;

  const busy = status === "generating" || status === "editing";

  /** Core loop: stream a generation (or edit) and fold events into state. */
  const run = useCallback(
    async (prompt: string) => {
      const current = draftRef.current;
      const isEdit = Boolean(current?.html);
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      const userMsg = msg("user", prompt);
      const history = [...messagesRef.current, userMsg];
      setMessages(history);
      setStatus(isEdit ? "editing" : "generating");
      setActivePrompt(prompt);
      setError(null);
      setStage(0);
      setThought("");
      setThoughts([]);
      setCode("");
      setView("preview");
      if (!isEdit) setMobileTab("preview");
      track(isEdit ? "edit_submitted" : "prompt_submitted", { length: prompt.length });

      try {
        for await (const ev of streamGenerate({ prompt, spec: isEdit ? current?.spec : null }, ctrl.signal)) {
          if (ev.type === "stage") setStage(ev.stage);
          else if (ev.type === "thought") {
            setThought(ev.text);
            setThoughts((t) => [...t, ev.text]);
          } else if (ev.type === "html") setCode((c) => c + ev.chunk);
          else if (ev.type === "error") throw new Error(ev.message);
          else if (ev.type === "done") {
            const spec = ev.spec;
            const finalMessages = [...history, msg("assistant", ev.summary)];
            const next: Draft = {
              id: current?.id ?? spec?.id ?? crypto.randomUUID(),
              title: spec?.title ?? current?.title ?? "My aduma.io site",
              emoji: spec?.emoji ?? current?.emoji ?? "✨",
              tagline: spec?.tagline ?? current?.tagline ?? "",
              prompt: current?.prompt ?? prompt,
              html: ev.html,
              spec,
              messages: finalMessages,
              createdAt: current?.createdAt ?? Date.now(),
              updatedAt: Date.now(),
              published: current?.published,
            };
            drafts.save(next);
            setDraft(next);
            setMessages(finalMessages);
            setStatus("ready");
            setMobileTab("preview");
            track("generation_completed", { edit: isEdit, archetype: spec?.archetype ?? "unknown" });
            if (!isEdit) {
              setConfetti((c) => c + 1);
              router.replace(`/create?draft=${next.id}`, { scroll: false });
            } else {
              toast(ev.summary.replace(/^Done! /, ""), "✨");
            }
          }
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        const message = (err as Error).message || "Something went sideways.";
        setError(message);
        setStatus(current?.html ? "ready" : "error");
        setMessages((prev) => [...prev, msg("assistant", `Oops — ${message}`)]);
        if (current?.html) toast(message, "😵");
        track("generation_failed");
      }
    },
    [router, toast],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setStatus(draftRef.current?.html ? "ready" : "empty");
    setMessages((prev) => [...prev, msg("assistant", "Stopped. No worries — tweak your idea and go again.")]);
  }, []);

  // Boot from the URL once storage is hydrated: ?draft=… resumes, ?prompt=… generates.
  useEffect(() => {
    if (!hydrated || bootedRef.current) return;
    bootedRef.current = true;
    const draftId = initialDraftId;
    const prompt = initialPrompt;
    if (draftId) {
      const existing = drafts.get(draftId);
      if (existing) {
        setDraft(existing);
        setMessages(existing.messages);
        setStatus("ready");
        setMobileTab("preview");
        return;
      }
    }
    if (prompt && promptSchema.safeParse(prompt).success) void run(prompt);
  }, [hydrated, initialDraftId, initialPrompt, run]);

  // Esc stops a running generation.
  useEffect(() => {
    if (!busy) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && stop();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, stop]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const startFresh = () => {
    abortRef.current?.abort();
    setDraft(null);
    setMessages([]);
    setStatus("empty");
    setError(null);
    setMobileTab("chat");
    router.replace("/create", { scroll: false });
  };

  const hasSite = Boolean(draft?.html);

  return (
    <div className={styles.studio}>
      <Confetti fire={confetti} />

      {/* Mobile tab switcher */}
      <div className={styles.mobileTabs} role="tablist" aria-label="Studio view">
        {(["chat", "preview"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            type="button"
            aria-selected={mobileTab === t}
            className={styles.mobileTab}
            onClick={() => setMobileTab(t)}
          >
            {mobileTab === t && <m.span layoutId="studio-tab" className={styles.mobileTabPill} />}
            <span className={styles.mobileTabText}>
              {t === "chat" ? <MessageCircle aria-hidden /> : <Eye aria-hidden />}
              {t === "chat" ? "Chat" : "Preview"}
            </span>
          </button>
        ))}
      </div>

      {/* ── Chat panel ─────────────────────────────────────────────────── */}
      <section className={cn(styles.chat, mobileTab !== "chat" && styles.hideMobile)} aria-label="Chat with aduma.io">
        <header className={styles.chatHead}>
          <div className={styles.chatTitle}>
            <span className={styles.chatEmoji} aria-hidden>
              {draft?.emoji ?? "✨"}
            </span>
            <div>
              <h1 className={styles.chatH1}>{draft?.title ?? "New site"}</h1>
              <p className="subtle" style={{ fontSize: "0.8rem" }}>
                {draft ? `Saved ${timeAgo(draft.updatedAt)} · on this device` : "Not saved yet"}
              </p>
            </div>
          </div>
          {(hasSite || messages.length > 0) && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={startFresh}>
              <RotateCcw aria-hidden /> New
            </button>
          )}
        </header>

        {status === "empty" && messages.length === 0 ? (
          <EmptyChat
            onPrompt={run}
            onOpen={(d) => {
              setDraft(d);
              setMessages(d.messages);
              setStatus("ready");
              setMobileTab("preview");
              router.replace(`/create?draft=${d.id}`, { scroll: false });
            }}
          />
        ) : (
          <ChatLog messages={messages} busy={busy} thoughts={thoughts} />
        )}

        {(hasSite || busy || status === "error") && (
          <ChatComposer
            busy={busy}
            hasSite={hasSite}
            onSend={run}
            onStop={stop}
            onRetry={status === "error" && activePrompt ? () => run(activePrompt) : undefined}
          />
        )}
      </section>

      {/* ── Preview panel ──────────────────────────────────────────────── */}
      <section className={cn(styles.preview, mobileTab !== "preview" && styles.hideMobile)} aria-label="Website preview">
        <div className={styles.toolbar}>
          <div className={styles.devices} role="radiogroup" aria-label="Preview size">
            {DEVICES.map((d) => (
              <button
                key={d.id}
                type="button"
                role="radio"
                aria-checked={device === d.id}
                className={styles.deviceBtn}
                onClick={() => setDevice(d.id)}
                title={d.label}
              >
                <d.icon aria-hidden />
                <span className="sr-only">{d.label}</span>
              </button>
            ))}
          </div>
          <div className={styles.toolbarRight}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setView((v) => (v === "code" ? "preview" : "code"))}
              disabled={!hasSite}
              aria-pressed={view === "code"}
            >
              {view === "code" ? <Eye aria-hidden /> : <Code2 aria-hidden />}
              <span className={styles.hideXs}>{view === "code" ? "Preview" : "Code"}</span>
            </button>
            {draft?.published && (
              <Link href={`/p/${draft.published.subdomain}`} target="_blank" className="btn btn-ghost btn-sm" aria-label="Open live site in a new tab">
                <ExternalLink aria-hidden />
              </Link>
            )}
            <button
              type="button"
              className="btn btn-electric btn-sm"
              disabled={!hasSite || busy}
              onClick={() => {
                setPublishOpen(true);
                track("publish_opened");
              }}
            >
              <Rocket aria-hidden /> {draft?.published ? "Share" : "Publish"}
            </button>
          </div>
        </div>

        <div className={cn(styles.stage, "dot-grid")}>
          <m.div
            className={styles.frame}
            data-device={device}
            layout
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
          >
            <div className={styles.frameBar} aria-hidden>
              <span />
              <span />
              <span />
              <p className="mono">{draft?.published ? `${draft.published.subdomain}.aduma.io` : "preview.aduma.io"}</p>
            </div>

            <div className={styles.frameBody}>
              {hasSite && view === "preview" && (
                <m.iframe
                  key={draft!.updatedAt}
                  title={`Preview of ${draft!.title}`}
                  className={styles.iframe}
                  srcDoc={draft!.html}
                  sandbox="allow-scripts allow-forms allow-popups"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                />
              )}
              {hasSite && view === "code" && (
                <pre className={styles.codeView} tabIndex={0} aria-label="Generated HTML">
                  <code>{draft!.html}</code>
                </pre>
              )}

              {!hasSite && status === "empty" && <EmptyPreview />}
              {!hasSite && status === "error" && (
                <ErrorPreview message={error} onRetry={activePrompt ? () => run(activePrompt) : undefined} />
              )}

              <AnimatePresence>
                {status === "generating" && <GeneratingOverlay stage={stage} thought={thought} code={code} prompt={activePrompt} />}
              </AnimatePresence>
              <AnimatePresence>
                {status === "editing" && (
                  <m.div className={styles.editing} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="status">
                    <div className={styles.editingChip}>
                      <Wand2 aria-hidden /> {thought || "Applying your changes…"}
                    </div>
                  </m.div>
                )}
              </AnimatePresence>
            </div>
          </m.div>
        </div>
      </section>

      {draft && (
        <PublishDialog
          open={publishOpen}
          onOpenChange={setPublishOpen}
          draft={draft}
          onPublished={(d) => {
            setDraft(d);
            setConfetti((c) => c + 1);
          }}
        />
      )}
    </div>
  );
}

/* ── Sub-components ────────────────────────────────────────────────────── */

function EmptyChat({ onPrompt, onOpen }: { onPrompt: (p: string) => void; onOpen: (d: Draft) => void }) {
  const list = useDrafts();
  return (
    <div className={styles.emptyChat}>
      <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="stack" style={{ "--gap": "0.5rem" } as React.CSSProperties}>
        <p className="eyebrow">Studio</p>
        <h2 className="h-2">What are we making today?</h2>
        <p className="muted">Describe it like you&apos;d tell a mate. The weirder the better.</p>
      </m.div>
      <PromptBox variant="compact" demo={false} autoFocus onSubmitPrompt={onPrompt} />
      {list.length > 0 && (
        <div className={styles.recent}>
          <h3 className={styles.recentTitle}>Pick up where you left off</h3>
          <ul>
            {list.slice(0, 4).map((d) => (
              <li key={d.id}>
                <button type="button" className={styles.recentItem} onClick={() => onOpen(d)}>
                  <span aria-hidden>{d.emoji}</span>
                  <span className={styles.recentName}>{d.title}</span>
                  <span className="subtle">{timeAgo(d.updatedAt)}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ChatLog({ messages, busy, thoughts }: { messages: ChatMessage[]; busy: boolean; thoughts: string[] }) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, thoughts.length, busy]);

  return (
    <div className={styles.log} aria-live="polite" aria-relevant="additions">
      <AnimatePresence initial={false}>
        {messages.map((message) => (
          <m.div
            key={message.id}
            className={cn(styles.msg, message.role === "user" ? styles.msgUser : styles.msgBot)}
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
          >
            {message.role === "assistant" && (
              <span className={styles.botAvatar} aria-hidden>
                ✦
              </span>
            )}
            <p>
              <span className="sr-only">{message.role === "user" ? "You: " : "aduma.io: "}</span>
              {message.text}
            </p>
          </m.div>
        ))}
        {busy && (
          <m.div key="thinking" className={cn(styles.msg, styles.msgBot)} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <span className={cn(styles.botAvatar, styles.botThinking)} aria-hidden>
              ✦
            </span>
            <div className={styles.thinkingBox}>
              <ul className={styles.thoughtList}>
                {thoughts.map((t, i) => (
                  <m.li key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}>
                    {t}
                  </m.li>
                ))}
              </ul>
              <div className={styles.dots} aria-label="Thinking">
                <span />
                <span />
                <span />
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>
      <div ref={endRef} />
    </div>
  );
}

const editSchema = z.object({ prompt: promptSchema });

function ChatComposer({
  busy,
  hasSite,
  onSend,
  onStop,
  onRetry,
}: {
  busy: boolean;
  hasSite: boolean;
  onSend: (p: string) => void;
  onStop: () => void;
  onRetry?: () => void;
}) {
  const { register, handleSubmit, reset, formState } = useForm<{ prompt: string }>({
    resolver: zodResolver(editSchema),
    defaultValues: { prompt: "" },
  });
  const submit = handleSubmit(({ prompt }) => {
    onSend(prompt);
    reset();
    const el = document.getElementById("edit-input");
    if (el) el.style.height = "auto";
  });

  return (
    <div className={styles.composer}>
      {hasSite && !busy && (
        <ul className={cn(styles.suggestions, "scrollbar-none")} aria-label="Edit suggestions">
          {EDIT_SUGGESTIONS.map((s) => (
            <li key={s}>
              <button type="button" className="chip" onClick={() => onSend(s)}>
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
      {onRetry && !busy && (
        <button type="button" className="btn btn-outline w-full" onClick={onRetry}>
          <RotateCcw aria-hidden /> Try again
        </button>
      )}
      <form onSubmit={submit} className={styles.composerForm} noValidate>
        <label htmlFor="edit-input" className="sr-only">
          Ask for a change
        </label>
        <textarea
          id="edit-input"
          rows={1}
          className={styles.composerInput}
          placeholder={hasSite ? "Ask for a change…" : "Describe your site…"}
          disabled={busy}
          aria-invalid={Boolean(formState.errors.prompt)}
          {...register("prompt")}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              void submit();
            }
          }}
          onInput={(e) => {
            const el = e.currentTarget;
            el.style.height = "auto";
            el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
          }}
        />
        {busy ? (
          <button type="button" className="btn btn-outline btn-icon btn-sm" onClick={onStop} aria-label="Stop generating (Esc)">
            <Square aria-hidden style={{ fill: "currentColor" }} />
          </button>
        ) : (
          <button type="submit" className="btn btn-primary btn-icon btn-sm" aria-label="Send">
            <ArrowUp aria-hidden />
          </button>
        )}
      </form>
      {formState.errors.prompt && (
        <p className="error-text" role="alert">
          {formState.errors.prompt.message}
        </p>
      )}
    </div>
  );
}

function EmptyPreview() {
  return (
    <div className={styles.emptyPreview}>
      <div className={styles.emptyEmojis} aria-hidden>
        {["🦖", "🐱", "💍", "🎮", "🗿", "🎂"].map((e, i) => (
          <m.span
            key={e}
            animate={{ y: [0, -14, 0], rotate: [0, i % 2 ? 8 : -8, 0] }}
            transition={{ duration: 3 + i * 0.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }}
          >
            {e}
          </m.span>
        ))}
      </div>
      <p className="h-3">Your masterpiece will appear here</p>
      <p className="muted">
        <Laptop aria-hidden className={styles.inlineIcon} /> Live preview · edits in seconds · publish in one tap
      </p>
    </div>
  );
}

function ErrorPreview({ message, onRetry }: { message: string | null; onRetry?: () => void }) {
  return (
    <div className={styles.emptyPreview} role="alert">
      <m.div className={styles.errorEmoji} animate={{ rotate: [0, -10, 10, -6, 0] }} transition={{ duration: 0.8 }} aria-hidden>
        🙃
      </m.div>
      <p className="h-3">Well, that didn&apos;t go to plan</p>
      <p className="muted">{message ?? "The magic fizzled. It happens to the best of us."}</p>
      {onRetry && (
        <button type="button" className="btn btn-primary" onClick={onRetry}>
          <RotateCcw aria-hidden /> Give it another crack
        </button>
      )}
    </div>
  );
}
