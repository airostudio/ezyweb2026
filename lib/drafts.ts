"use client";

import { useSyncExternalStore } from "react";
import type { SiteSpec } from "@/lib/generator/types";
import { syncDraftRemote, deleteDraftRemote } from "@/lib/supabase";

/**
 * Draft storage.
 *
 * Source of truth is localStorage so anyone can play without an account.
 * If Supabase env vars are present, every write is mirrored to a `drafts`
 * table (fire-and-forget) so signed-in users get their sites everywhere.
 */

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  at: number;
}

export interface Draft {
  id: string;
  title: string;
  emoji: string;
  tagline: string;
  prompt: string;
  html: string;
  spec: SiteSpec | null;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  published?: { subdomain: string; customDomain?: string; at: number };
}

const KEY = "webese:drafts:v1";
const listeners = new Set<() => void>();
let cache: Draft[] | null = null;
const EMPTY: Draft[] = [];

function read(): Draft[] {
  if (cache) return cache;
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as Draft[]) : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(next: Draft[]): void {
  cache = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage full or blocked (private mode). Keep the in-memory copy.
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  // Keep tabs in sync.
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      cb();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export const drafts = {
  list: (): Draft[] => [...read()].sort((a, b) => b.updatedAt - a.updatedAt),
  get: (id: string): Draft | undefined => read().find((d) => d.id === id),
  bySubdomain: (sub: string): Draft | undefined => read().find((d) => d.published?.subdomain === sub),
  save(draft: Draft): void {
    const all = read().filter((d) => d.id !== draft.id);
    write([{ ...draft, updatedAt: Date.now() }, ...all]);
    void syncDraftRemote(draft);
  },
  remove(id: string): void {
    write(read().filter((d) => d.id !== id));
    void deleteDraftRemote(id);
  },
  isSubdomainTaken(sub: string, exceptId?: string): boolean {
    return read().some((d) => d.published?.subdomain === sub && d.id !== exceptId);
  },
};

/** Reactive list of drafts, newest first. */
export function useDrafts(): Draft[] {
  return useSyncExternalStore(subscribe, () => read(), () => EMPTY).slice().sort((a, b) => b.updatedAt - a.updatedAt);
}

/** Has the client store loaded? (false during SSR/first paint) */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}
