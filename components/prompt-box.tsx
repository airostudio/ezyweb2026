"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, m } from "framer-motion";
import { ArrowUp, Dices, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod/mini";
import { track } from "@/lib/analytics";
import { DEMO_PROMPTS, EXAMPLE_PROMPTS, STARTERS } from "@/lib/content";
import { promptSchema } from "@/lib/schemas";
import { cn } from "@/lib/utils";
import styles from "./prompt-box.module.css";

const formSchema = z.object({ prompt: promptSchema });
type FormValues = z.infer<typeof formSchema>;

interface PromptBoxProps {
  variant?: "hero" | "compact";
  /** Show the starter chips underneath */
  starters?: boolean;
  /** Show the "watch a live demo" button */
  demo?: boolean;
  autoFocus?: boolean;
  /** Override navigation (default: go to /create?prompt=…) */
  onSubmitPrompt?: (prompt: string) => void;
}

/**
 * The Webese prompt. Keyboard:
 *   Enter → create · Shift+Enter → newline · ⌘/Ctrl+K or "/" → focus
 */
export function PromptBox({ variant = "hero", starters = true, demo = true, autoFocus, onSubmitPrompt }: PromptBoxProps) {
  const router = useRouter();
  const id = useId();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const typingRef = useRef<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [focused, setFocused] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    clearErrors,
  } = useForm<FormValues>({ resolver: zodResolver(formSchema), defaultValues: { prompt: "" } });

  const value = watch("prompt");
  const { ref: rhfRef, ...field } = register("prompt");

  // Auto-grow the textarea; CSS transitions the height for a smooth expand.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 240)}px`;
  }, [value]);

  // Global ⌘K / "/" to focus the prompt (hero instance only).
  useEffect(() => {
    if (variant !== "hero") return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = target?.closest("input, textarea, [contenteditable=true]");
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        textareaRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [variant]);

  useEffect(() => () => {
    if (typingRef.current) window.clearInterval(typingRef.current);
  }, []);

  const go = useCallback(
    (prompt: string) => {
      setSubmitting(true);
      track("prompt_submitted", { length: prompt.length, variant });
      if (onSubmitPrompt) {
        onSubmitPrompt(prompt);
        setSubmitting(false);
      } else {
        router.push(`/create?prompt=${encodeURIComponent(prompt)}`);
      }
    },
    [onSubmitPrompt, router, variant],
  );

  const onSubmit = handleSubmit(({ prompt }) => go(prompt));

  /** Types a prompt into the box like a person would, then optionally submits. */
  const typeIn = useCallback(
    (text: string, submit: boolean) => {
      if (typingRef.current) window.clearInterval(typingRef.current);
      clearErrors();
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      textareaRef.current?.focus();
      if (reduce) {
        setValue("prompt", text, { shouldValidate: false });
        if (submit) go(text);
        return;
      }
      let i = 0;
      setValue("prompt", "");
      typingRef.current = window.setInterval(() => {
        i += 1 + Math.floor(Math.random() * 2);
        setValue("prompt", text.slice(0, i));
        if (i >= text.length) {
          if (typingRef.current) window.clearInterval(typingRef.current);
          typingRef.current = null;
          if (submit) window.setTimeout(() => go(text), 350);
        }
      }, 28);
    },
    [clearErrors, go, setValue],
  );

  const surprise = () => {
    const pool = EXAMPLE_PROMPTS.filter((p) => p !== value);
    typeIn(pool[Math.floor(Math.random() * pool.length)] ?? EXAMPLE_PROMPTS[0], false);
  };

  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const isHero = variant === "hero";

  return (
    <div className={cn(styles.wrap, isHero ? styles.hero : styles.compact)}>
      <form onSubmit={onSubmit} noValidate>
        <m.div
          className={cn(styles.box, "ring-electric", (focused || submitting) && "is-spinning", submitting && styles.submitting)}
          animate={submitting ? { scale: [1, 0.98, 1.01, 1] } : { scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <label htmlFor={`${id}-prompt`} className="sr-only">
            Describe the website you want
          </label>
          <div className={styles.inputArea}>
            <textarea
              id={`${id}-prompt`}
              rows={isHero ? 2 : 1}
              ref={(el) => {
                rhfRef(el);
                textareaRef.current = el;
              }}
              {...field}
              className={styles.textarea}
              autoFocus={autoFocus}
              maxLength={600}
              spellCheck
              enterKeyHint="go"
              aria-invalid={errors.prompt ? "true" : "false"}
              aria-describedby={errors.prompt ? errorId : hintId}
              onFocus={() => setFocused(true)}
              onBlur={(e) => {
                setFocused(false);
                void field.onBlur(e);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  void onSubmit();
                }
              }}
              disabled={submitting}
            />
            {!value && <CyclingPlaceholder paused={submitting} />}
          </div>

          <div className={styles.toolbar}>
            <div className={styles.tools}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={surprise} disabled={submitting} aria-label="Surprise me with an idea">
                <Dices aria-hidden /> <span className={styles.toolLabel}>Surprise me</span>
              </button>
              {isHero && (
                <span className={styles.shortcut} id={hintId}>
                  <span className="kbd">↵</span> to create · <span className="kbd">⇧↵</span> new line
                </span>
              )}
              {!isHero && (
                <span id={hintId} className="sr-only">
                  Press Enter to create
                </span>
              )}
            </div>
            <button type="submit" className={cn("btn btn-electric", isHero ? "" : "btn-sm", styles.submit)} disabled={submitting} aria-label="Create my website">
              <AnimatePresence mode="wait" initial={false}>
                {submitting ? (
                  <m.span key="s" className={styles.submitInner} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                    <span className="spinner" aria-hidden /> Summoning…
                  </m.span>
                ) : (
                  <m.span key="i" className={styles.submitInner} initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                    <span className={styles.submitText}>Make it</span> <ArrowUp aria-hidden />
                  </m.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </m.div>

        <AnimatePresence>
          {errors.prompt && (
            <m.p
              id={errorId}
              role="alert"
              className={cn("error-text", styles.error)}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {errors.prompt.message}
            </m.p>
          )}
        </AnimatePresence>
      </form>

      {(starters || demo) && (
        <div className={styles.below}>
          {demo && (
            <button
              type="button"
              className={styles.demo}
              onClick={() => {
                track("demo_clicked");
                typeIn(DEMO_PROMPTS[Math.floor(Math.random() * DEMO_PROMPTS.length)] ?? DEMO_PROMPTS[0], true);
              }}
              disabled={submitting}
            >
              <span className={styles.demoIcon}>
                <Play aria-hidden />
              </span>
              Watch a live demo
            </button>
          )}
          {starters && (
            <ul className={styles.starters} aria-label="Starter ideas">
              {STARTERS.map((s, i) => (
                <m.li key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.05 }}>
                  <button type="button" className="chip" onClick={() => typeIn(s.prompt, false)} disabled={submitting}>
                    <span aria-hidden>{s.emoji}</span> {s.label}
                  </button>
                </m.li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/** Typewriter that cycles through example prompts (decorative). */
function CyclingPlaceholder({ paused }: { paused: boolean }) {
  // Start fully typed so the server-rendered HTML shows a real example at first
  // paint (this box is the hero's LCP element); the loop then deletes and retypes.
  const [index, setIndex] = useState(0);
  const [text, setText] = useState<string>(EXAMPLE_PROMPTS[0]);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    setReduce(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (paused) return;
    const full = EXAMPLE_PROMPTS[index % EXAMPLE_PROMPTS.length] ?? "";
    if (reduce) {
      setText(full);
      const t = window.setTimeout(() => setIndex((i) => i + 1), 3500);
      return () => window.clearTimeout(t);
    }
    let i = index === 0 ? full.length : 0;
    let deleting = index === 0;
    let timer: number;
    const step = () => {
      if (!deleting) {
        i++;
        setText(full.slice(0, i));
        if (i >= full.length) {
          deleting = true;
          timer = window.setTimeout(step, 2200);
          return;
        }
        timer = window.setTimeout(step, 38 + Math.random() * 40);
      } else {
        i -= 2;
        setText(full.slice(0, Math.max(0, i)));
        if (i <= 0) {
          setIndex((x) => x + 1);
          return;
        }
        timer = window.setTimeout(step, 16);
      }
    };
    timer = window.setTimeout(step, index === 0 ? 2600 : 300);
    return () => window.clearTimeout(timer);
  }, [index, paused, reduce]);

  return (
    <div className={styles.placeholder} aria-hidden>
      {text}
      <span className={styles.caret} />
    </div>
  );
}
