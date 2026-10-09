import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { streamAnthropic } from "@/lib/ai/anthropic";
import { streamOpenAI } from "@/lib/ai/openai";
import { buildMessage, editMessage } from "@/lib/ai/prompt";
import { activeProvider, cleanHtml, GenerationError, pageMeta } from "@/lib/ai/shared";
import { edit, generate, type GenerateEvent, type SiteSpec } from "@/lib/generator";
import { STAGES } from "@/lib/generator/stages";
import { PLAN_LIMITS } from "@/lib/plans";
import { quota, quotaIdentity } from "@/lib/quota";
import { generateRequestSchema } from "@/lib/schemas";

export const runtime = "edge";

/**
 * POST /api/generate
 *
 * Body: { prompt, siteId?, spec?, html? }   (siteId + spec/html ⇒ follow-up edit)
 * Response: `application/x-ndjson` stream of `GenerateEvent`s, one per line.
 *
 * Engines, in priority order:
 *   1. ADUMA_API_URL set   → proxy to the hosted aduma.io engine (same protocol)
 *   2. an LLM key present  → Claude Haiku 5.5 or GPT-5.6 Luna (lib/ai)
 *   3. otherwise           → the built-in mock generator (free, offline)
 *
 * Every plan uses the same cheap model; plan limits (daily builds, edits per
 * site) are enforced here before any tokens are spent.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = generateRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 422 });
  }
  const { prompt, siteId } = parsed.data;
  const spec = (parsed.data.spec ?? null) as SiteSpec | null;
  const currentHtml = parsed.data.html ?? null;
  const isEdit = Boolean(siteId && (spec || currentHtml));

  // ── Budget guard: plan-based quotas, charged before spending tokens ────
  const session = await auth();
  const plan = PLAN_LIMITS[session?.user?.plan ?? "free"];
  const identity = quotaIdentity(session?.user?.email, req.headers);
  const charge = isEdit ? await quota.edit(identity, siteId!, plan.editsPerSite) : await quota.build(identity, plan.dailyBuilds);
  if (!charge.ok) {
    const message = isEdit
      ? `You've used all ${plan.editsPerSite} edits for this site on the ${plan.name} plan.`
      : `You've built ${plan.dailyBuilds} sites today, the ${plan.name} plan's daily limit. Fresh builds unlock tomorrow.`;
    return NextResponse.json({ error: message, code: "quota" }, { status: 429 });
  }

  const upstream = process.env.ADUMA_API_URL;
  if (upstream) return proxyToAduma(upstream, parsed.data);

  const provider = activeProvider();
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (e: GenerateEvent) => controller.enqueue(encoder.encode(JSON.stringify(e) + "\n"));
      try {
        if (provider === "mock") {
          // The mock edits its structured spec; a page changed in the visual
          // editor has no spec any more, so only a real AI engine can edit it.
          if (isEdit && !spec) throw new GenerationError("This site has hand edits, so chat changes need the full AI builder, which isn't switched on yet. Keep using the editor for now!");
          await runMock(send, req.signal, prompt, isEdit ? spec : null);
        }
        else await runLLM(send, req.signal, provider, prompt, isEdit ? currentHtml : null);
      } catch (err) {
        if (req.signal.aborted) return;
        // Failed builds don't count against the user's quota.
        await charge.refund();
        if (err instanceof GenerationError) send({ type: "error", message: err.message });
        else {
          console.error(`[generate] ${provider} failed`, err);
          send({ type: "error", message: "Our gremlins tripped over a cable. Give it another go?" });
        }
      } finally {
        try {
          controller.close();
        } catch {
          /* client already gone */
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}

type Send = (e: GenerateEvent) => void;

/** Friendly narration shown while the model writes (keyed to progress). */
const LLM_THOUGHTS = [
  "Reading the vibe…",
  "Picking a palette that slaps",
  "Writing words with personality",
  "Laying out the page",
  "Polishing the little details",
];

/** Streams a real LLM build/edit, mapping raw text to stage/html events. */
async function runLLM(send: Send, signal: AbortSignal, provider: "anthropic" | "openai", prompt: string, currentHtml: string | null) {
  const streamer = provider === "anthropic" ? streamAnthropic : streamOpenAI;
  const message = currentHtml ? editMessage(prompt, currentHtml) : buildMessage(prompt);
  // Rough expected size, used only to advance the progress stages.
  const expected = currentHtml ? Math.max(currentHtml.length, 6_000) : 16_000;

  let stage = 0;
  const advance = (to: number) => {
    while (stage < to && stage < STAGES.length - 1) {
      stage++;
      send({ type: "stage", stage, label: STAGES[stage]! });
      send({ type: "thought", text: LLM_THOUGHTS[stage]! });
    }
  };
  send({ type: "stage", stage: 0, label: STAGES[0]! });
  send({ type: "thought", text: currentHtml ? "Got it — tweaking things…" : LLM_THOUGHTS[0]! });

  let raw = "";
  for await (const delta of streamer(message, signal)) {
    raw += delta;
    send({ type: "html", chunk: delta });
    const progress = raw.length / expected;
    advance(progress > 0.85 ? 4 : progress > 0.35 ? 3 : progress > 0.12 ? 2 : 1);
  }
  advance(4);

  const html = cleanHtml(raw);
  if (!html) throw new GenerationError("That didn't come out as a website. Try rewording your idea?");
  const meta = pageMeta(html);
  send({
    type: "done",
    spec: null,
    html,
    title: meta.title,
    tagline: meta.tagline,
    summary: currentHtml
      ? "Done! Want anything else changed?"
      : `Here's “${meta.title ?? "your site"}”. Want changes? Just ask — try “make it darker” or “add a photo gallery”.`,
  });
}

/** The offline mock: same events, simulated pacing. */
async function runMock(send: Send, signal: AbortSignal, prompt: string, spec: SiteSpec | null) {
  const result = spec ? edit(spec, prompt) : generate(prompt);
  const isEdit = Boolean(spec);
  const pace = isEdit ? 260 : 520;
  const stages = isEdit ? [0, 3, 4] : [0, 1, 2, 3, 4];
  const thoughts = [...result.thoughts];
  for (const stage of stages) {
    if (signal.aborted) return;
    send({ type: "stage", stage, label: STAGES[stage]! });
    const thought = thoughts.shift();
    if (thought) {
      await sleep(pace * 0.4);
      send({ type: "thought", text: thought });
    }
    if (stage === 3) {
      for (const c of chunk(result.html, isEdit ? 12 : 28)) {
        if (signal.aborted) return;
        send({ type: "html", chunk: c });
        await sleep(isEdit ? 25 : 45);
      }
    } else {
      await sleep(pace * (0.75 + Math.random() * 0.5));
    }
  }
  for (const t of thoughts) send({ type: "thought", text: t });
  await sleep(180);
  send({ type: "done", spec: result.spec, html: result.html, summary: result.summary, title: result.spec.title, tagline: result.spec.tagline });
}

/** Pass-through to a hosted aduma.io engine that speaks the same protocol. */
async function proxyToAduma(url: string, payload: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.ADUMA_API_KEY ? { Authorization: `Bearer ${process.env.ADUMA_API_KEY}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok || !res.body) {
    return NextResponse.json({ error: "aduma.io is having a moment. Try again shortly." }, { status: 502 });
  }
  return new Response(res.body, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" },
  });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
function chunk(s: string, n: number): string[] {
  const size = Math.ceil(s.length / n);
  const out: string[] = [];
  for (let i = 0; i < s.length; i += size) out.push(s.slice(i, i + size));
  return out;
}
