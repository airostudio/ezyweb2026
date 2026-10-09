/**
 * Server-side usage quotas — the budget guard for paid LLM calls.
 *
 * Counts builds per visitor per day and edits per site. Uses Upstash Redis
 * (REST, edge-friendly, no SDK) when UPSTASH_REDIS_REST_URL/TOKEN are set;
 * otherwise an in-memory map, which only holds per server instance, so set
 * up Upstash before turning on a paid model in production.
 */

const DAY = 86_400;
const MONTH = 30 * DAY;

type Store = { incr(key: string, ttlSeconds: number): Promise<number>; decr(key: string): Promise<void> };

const memory = new Map<string, { n: number; exp: number }>();
const memoryStore: Store = {
  async incr(key, ttl) {
    const now = Date.now();
    const cur = memory.get(key);
    const next = cur && cur.exp > now ? { n: cur.n + 1, exp: cur.exp } : { n: 1, exp: now + ttl * 1000 };
    memory.set(key, next);
    if (memory.size > 50_000) for (const [k, v] of memory) if (v.exp <= now) memory.delete(k);
    return next.n;
  },
  async decr(key) {
    const cur = memory.get(key);
    if (cur) cur.n = Math.max(0, cur.n - 1);
  },
};

function upstashStore(url: string, token: string): Store {
  const call = async (commands: (string | number)[][]) => {
    const res = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(commands),
    });
    if (!res.ok) throw new Error(`Upstash ${res.status}`);
    return (await res.json()) as { result: number }[];
  };
  return {
    async incr(key, ttl) {
      // NX: only set the expiry when the key is new, so the window is fixed.
      const [first] = await call([["INCR", key], ["EXPIRE", key, ttl, "NX"]]);
      return first?.result ?? 1;
    },
    async decr(key) {
      await call([["DECR", key]]);
    },
  };
}

const store: Store =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? upstashStore(process.env.UPSTASH_REDIS_REST_URL, process.env.UPSTASH_REDIS_REST_TOKEN)
    : memoryStore;

export interface QuotaResult {
  ok: boolean;
  used: number;
  limit: number;
  /** Give the unit back (e.g. the generation failed before costing much). */
  refund: () => Promise<void>;
}

async function consume(key: string, limit: number, ttl: number): Promise<QuotaResult> {
  try {
    const used = await store.incr(key, ttl);
    const refund = () => store.decr(key).catch(() => {});
    if (used > limit) {
      await refund();
      return { ok: false, used: limit, limit, refund: async () => {} };
    }
    return { ok: true, used, limit, refund };
  } catch (err) {
    // Fail closed: if we can't count, don't spend.
    console.error("[quota] store unavailable", err);
    return { ok: false, used: limit, limit, refund: async () => {} };
  }
}

export const quota = {
  build: (identity: string, limit: number) => consume(`q:build:${identity}`, limit, DAY),
  edit: (identity: string, siteId: string, limit: number) => consume(`q:edit:${identity}:${siteId}`, limit, MONTH),
};

/** A stable identity for quotas: the signed-in email, else the client IP. */
export function quotaIdentity(email: string | null | undefined, headers: Headers): string {
  if (email) return `u:${email.toLowerCase()}`;
  const ip = headers.get("x-real-ip") ?? headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
  return `ip:${ip}`;
}
