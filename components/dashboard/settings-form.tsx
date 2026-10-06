"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LogOut, Save, Trash2 } from "lucide-react";
import { signOut } from "next-auth/react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { useToast } from "@/components/ui/toast";
import { drafts } from "@/lib/drafts";
import { settingsSchema, type SettingsValues } from "@/lib/schemas";
import { siteConfig } from "@/lib/site";
import styles from "./dashboard.module.css";

const PROFILE_KEY = "webese:profile";

/**
 * Profile settings. Persisted to localStorage in this build; swap the save
 * handler for a server action / API call when a user DB is connected.
 */
export function SettingsForm({ email, defaults }: { email: string; defaults: SettingsValues }) {
  const toast = useToast();
  const form = useForm<SettingsValues>({ resolver: zodResolver(settingsSchema), defaultValues: defaults });
  const { errors, isDirty, isSubmitting } = form.formState;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(PROFILE_KEY);
      if (saved) form.reset({ ...defaults, ...(JSON.parse(saved) as Partial<SettingsValues>) });
    } catch {}
  }, [defaults, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    await new Promise((r) => setTimeout(r, 400));
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(values));
    } catch {}
    form.reset(values);
    toast("Settings saved. Looking good.", "✅");
  });

  return (
    <div className={styles.settings}>
      <form onSubmit={onSubmit} noValidate className={`card ${styles.panel}`} aria-labelledby="profile-title">
        <h2 id="profile-title" className={styles.panelTitle}>
          Profile
        </h2>

        <div className="field">
          <label className="label" htmlFor="s-email">
            Email
          </label>
          <input id="s-email" className="input" value={email} readOnly disabled />
        </div>

        <div className="field">
          <label className="label" htmlFor="s-name">
            Display name
          </label>
          <input id="s-name" className="input" aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "s-name-err" : undefined} {...form.register("name")} />
          {errors.name && (
            <p id="s-name-err" className="error-text" role="alert">
              {errors.name.message}
            </p>
          )}
        </div>

        <div className="field">
          <label className="label" htmlFor="s-username">
            Username
          </label>
          <div className="input-group">
            <input
              id="s-username"
              className="input mono"
              autoCapitalize="none"
              spellCheck={false}
              aria-invalid={Boolean(errors.username)}
              aria-describedby="s-username-hint"
              {...form.register("username")}
            />
            <span className="addon">.{siteConfig.publishDomain}</span>
          </div>
          <p id="s-username-hint" className={errors.username ? "error-text" : "hint"} role={errors.username ? "alert" : undefined}>
            {errors.username?.message ?? "Your default address for new sites."}
          </p>
        </div>

        <Controller
          control={form.control}
          name="marketing"
          render={({ field }) => (
            <div className={styles.switchRow}>
              <div>
                <p className="label" id="s-marketing-label">
                  Fun emails
                </p>
                <p className="hint">New features and the occasional gallery highlight. Never spam.</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={field.value}
                aria-labelledby="s-marketing-label"
                className={styles.switch}
                onClick={() => field.onChange(!field.value)}
              >
                <span />
              </button>
            </div>
          )}
        />

        <button type="submit" className="btn btn-primary" style={{ justifySelf: "start" }} disabled={!isDirty || isSubmitting}>
          {isSubmitting ? <span className="spinner" aria-hidden /> : <Save aria-hidden />} Save changes
        </button>
      </form>

      <section className={`card ${styles.panel} ${styles.dangerPanel}`} aria-labelledby="danger-title">
        <h2 id="danger-title" className={styles.panelTitle}>
          Danger zone
        </h2>
        <div className="row">
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => {
              if (!window.confirm("Delete every site saved on this device? This can't be undone.")) return;
              drafts.list().forEach((d) => drafts.remove(d.id));
              toast("All local sites cleared.", "🧹");
            }}
          >
            <Trash2 aria-hidden /> Clear sites on this device
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => void signOut({ redirectTo: "/" })}>
            <LogOut aria-hidden /> Sign out
          </button>
        </div>
      </section>
    </div>
  );
}
