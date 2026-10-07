"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, m } from "framer-motion";
import { ArrowRight, Mail, MailCheck } from "lucide-react";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { BrandLogo } from "@/components/brand";
import { AppleIcon, GoogleIcon } from "@/components/icons";
import { track } from "@/lib/analytics";
import { emailSchema } from "@/lib/schemas";
import styles from "./auth.module.css";

type FormValues = { email: string };

export function SignInForm({
  callbackUrl,
  providers,
  showDevHints,
  error,
}: {
  callbackUrl: string;
  providers: { google: boolean; apple: boolean };
  showDevHints: boolean;
  error?: string;
}) {
  const [sent, setSent] = useState<{ email: string; devLink?: string } | null>(null);
  const [serverError, setServerError] = useState<string | null>(error ? "That sign-in link didn't work. Grab a fresh one below." : null);
  const form = useForm<FormValues>({ resolver: zodResolver(emailSchema), defaultValues: { email: "" } });

  const onSubmit = form.handleSubmit(async ({ email }) => {
    setServerError(null);
    track("signin_started", { method: "magic-link" });
    try {
      const res = await fetch("/api/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, callbackUrl }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; devLink?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Couldn't send the link");
      setSent({ email, devLink: data.devLink });
    } catch (e) {
      setServerError((e as Error).message);
    }
  });

  const social = (id: "google" | "apple") => {
    track("signin_started", { method: id });
    void signIn(id, { redirectTo: callbackUrl });
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      {sent ? (
        <m.div
          key="sent"
          className={styles.sent}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          role="status"
        >
          <m.div
            className={styles.mailIcon}
            initial={{ rotate: -20, y: 20 }}
            animate={{ rotate: [0, -8, 8, 0], y: 0 }}
            transition={{ duration: 0.9 }}
            aria-hidden
          >
            <MailCheck />
          </m.div>
          <h1 className="h-2">Check your inbox</h1>
          <p className="muted">
            We sent a magic link to <strong>{sent.email}</strong>. Tap it and you&apos;re in. It expires in 15 minutes.
          </p>
          {sent.devLink && (
            <a href={sent.devLink} className="btn btn-electric w-full">
              Dev mode: open the magic link <ArrowRight aria-hidden />
            </a>
          )}
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSent(null)}>
            Use a different email
          </button>
        </m.div>
      ) : (
        <m.div key="form" className="stack" style={{ "--gap": "1.5rem" } as React.CSSProperties} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className={styles.head}>
            <BrandLogo className={styles.logo} height={72} />
            <h1 className="h-2">Welcome to aduma.io</h1>
            <p className="muted">Save your sites, publish them forever, edit from anywhere. No passwords, ever.</p>
          </div>

          {(providers.google || providers.apple || showDevHints) && (
            <div className="stack" style={{ "--gap": "0.6rem" } as React.CSSProperties}>
              <button type="button" className="btn btn-outline btn-lg w-full" onClick={() => social("google")} disabled={!providers.google}>
                <GoogleIcon /> Continue with Google
              </button>
              <button type="button" className="btn btn-outline btn-lg w-full" onClick={() => social("apple")} disabled={!providers.apple}>
                <AppleIcon /> Continue with Apple
              </button>
              {showDevHints && (!providers.google || !providers.apple) && (
                <p className="hint center">Dev: set AUTH_GOOGLE_* / AUTH_APPLE_* in .env.local to enable social sign-in.</p>
              )}
            </div>
          )}

          <div className={styles.divider}>
            <span>or get a magic link</span>
          </div>

          <form onSubmit={onSubmit} noValidate className="stack" style={{ "--gap": "0.75rem" } as React.CSSProperties}>
            <div className="field">
              <label htmlFor="email" className="label">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="input"
                autoComplete="email"
                inputMode="email"
                placeholder="you@legend.com.au"
                aria-invalid={Boolean(form.formState.errors.email)}
                aria-describedby={form.formState.errors.email ? "email-error" : undefined}
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <p id="email-error" className="error-text" role="alert">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>
            <button type="submit" className="btn btn-primary btn-lg w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? <span className="spinner" aria-hidden /> : <Mail aria-hidden />}
              Email me a magic link
            </button>
            {serverError && (
              <p className="error-text center" role="alert">
                {serverError}
              </p>
            )}
          </form>

          <p className="hint center">By continuing you agree to be excellent to each other (and our terms).</p>
        </m.div>
      )}
    </AnimatePresence>
  );
}
