import { NextResponse } from "next/server";
import { edit, generate, type GenerateEvent, type SiteSpec } from "@/lib/generator";
import { generateRequestSchema } from "@/lib/schemas";
import { STAGES } from "@/lib/generator/stages";

export const runtime = "edge";

/**
 * POST /api/generate
 *
 * Body: { prompt: string, spec?: SiteSpec }   (spec present ⇒ follow-up edit)
 * Response: `application/x-ndjson` stream of `GenerateEvent`s, one per line.
 *
 * If WEBESE_API_URL is configured the request is proxied verbatim to the real
 * webese.ai endpoint, which must speak the same NDJSON event protocol.
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

  const upstream = process.env.WEBESE_API_URL;
  if (upstream) return proxyToWebese(upstream, parsed.data);

  const { prompt } = parsed.data;
  const spec = (parsed.data.spec ?? null) as SiteSpec | null;
  const isEdit = Boolean(spec);

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (e: GenerateEvent) => controller.enqueue(encoder.encode(JSON.stringify(e) + "\n"));
      // Abort quietly if the client navigates away mid-stream.
      const aborted = () => req.signal.aborted;

      try {
        const result = isEdit && spec ? edit(spec, prompt) : generate(prompt);
        // Simulated latency: snappy but long enough to enjoy the show.
        const pace = isEdit ? 260 : 520;

        const stages = isEdit ? [0, 3, 4] : [0, 1, 2, 3, 4];
        const thoughts = [...result.thoughts];
        for (const stage of stages) {
          if (aborted()) return;
          send({ type: "stage", stage, label: STAGES[stage]! });
          const thought = thoughts.shift();
          if (thought) {
            await sleep(pace * 0.4);
            send({ type: "thought", text: thought });
          }
          // Stream the HTML during "Building the page" for the live-code effect.
          if (stage === 3) {
            const chunks = chunk(result.html, isEdit ? 12 : 28);
            for (const c of chunks) {
              if (aborted()) return;
              send({ type: "html", chunk: c });
              await sleep(isEdit ? 25 : 45);
            }
          } else {
            await sleep(pace * jitter());
          }
        }
        for (const t of thoughts) send({ type: "thought", text: t });
        await sleep(180);
        send({ type: "done", spec: result.spec, html: result.html, summary: result.summary });
      } catch (err) {
        console.error("[generate] mock failed", err);
        send({ type: "error", message: "Our gremlins tripped over a cable. Give it another go?" });
      } finally {
        controller.close();
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

/** Pass-through to the real webese.ai API once credentials exist. */
async function proxyToWebese(url: string, payload: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.WEBESE_API_KEY ? { Authorization: `Bearer ${process.env.WEBESE_API_KEY}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok || !res.body) {
    return NextResponse.json({ error: "webese.ai is having a moment. Try again shortly." }, { status: 502 });
  }
  return new Response(res.body, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" },
  });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const jitter = () => 0.75 + Math.random() * 0.5;
function chunk(s: string, n: number): string[] {
  const size = Math.ceil(s.length / n);
  const out: string[] = [];
  for (let i = 0; i < s.length; i += size) out.push(s.slice(i, i + size));
  return out;
}
