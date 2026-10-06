"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Draft } from "@/lib/drafts";

/**
 * Optional Supabase mirror for drafts. Completely inert unless
 * NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.
 * The SDK is dynamically imported so it never bloats the default bundle.
 *
 * Expected table (see README):
 *   create table drafts (id uuid primary key, data jsonb not null, updated_at timestamptz default now());
 */
let clientPromise: Promise<SupabaseClient | null> | null = null;

function getClient(): Promise<SupabaseClient | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return Promise.resolve(null);
  clientPromise ??= import("@supabase/supabase-js").then(({ createClient }) => createClient(url, key));
  return clientPromise;
}

export async function syncDraftRemote(draft: Draft): Promise<void> {
  try {
    const sb = await getClient();
    if (!sb) return;
    await sb.from("drafts").upsert({ id: draft.id, data: draft, updated_at: new Date().toISOString() });
  } catch (err) {
    console.warn("[supabase] draft sync failed", err);
  }
}

export async function deleteDraftRemote(id: string): Promise<void> {
  try {
    const sb = await getClient();
    if (!sb) return;
    await sb.from("drafts").delete().eq("id", id);
  } catch (err) {
    console.warn("[supabase] draft delete failed", err);
  }
}
