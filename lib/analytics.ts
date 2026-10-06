"use client";

/**
 * Analytics shim. Calls Plausible and/or PostHog if their scripts are loaded
 * (see components/analytics.tsx). Safe no-op otherwise, so feature code can
 * call `track()` freely without caring which provider is configured.
 */
type Props = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Props }) => void;
    posthog?: { capture: (event: string, props?: Props) => void };
  }
}

export type AnalyticsEvent =
  | "prompt_submitted"
  | "generation_completed"
  | "generation_failed"
  | "edit_submitted"
  | "remix_clicked"
  | "demo_clicked"
  | "publish_opened"
  | "site_published"
  | "custom_domain_added"
  | "signin_started"
  | "upgrade_clicked";

export function track(event: AnalyticsEvent, props?: Props): void {
  if (typeof window === "undefined") return;
  try {
    window.plausible?.(event, props ? { props } : undefined);
    window.posthog?.capture(event, props);
    if (process.env.NODE_ENV === "development") console.debug("[track]", event, props ?? "");
  } catch {
    /* analytics must never break the app */
  }
}
