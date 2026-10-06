"use client";

import type { GenerateEvent, SiteSpec } from "@/lib/generator/types";

/**
 * Calls POST /api/generate and yields each NDJSON event as it arrives.
 * Works for both the mock and the real webese.ai backend (same protocol).
 */
export async function* streamGenerate(
  input: { prompt: string; spec?: SiteSpec | null },
  signal?: AbortSignal,
): AsyncGenerator<GenerateEvent> {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal,
  });

  if (!res.ok || !res.body) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    yield { type: "error", message: data?.error ?? "Something went sideways. Try again?" };
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let nl: number;
    while ((nl = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (line) yield JSON.parse(line) as GenerateEvent;
    }
  }
  if (buffer.trim()) yield JSON.parse(buffer) as GenerateEvent;
}
