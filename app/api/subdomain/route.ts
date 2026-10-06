import { NextResponse } from "next/server";
import { subdomainSchema } from "@/lib/schemas";

export const runtime = "edge";

/** Names we never hand out, plus a few "already taken" ones for realism. */
const RESERVED = new Set(["www", "app", "api", "admin", "mail", "help", "support", "blog", "status", "webese", "ezyweb", "login", "signin", "dashboard"]);
const TAKEN = new Set(["mochi", "test", "party", "wedding", "cat", "dog", "birthday", "max"]);

/**
 * GET /api/subdomain?name=foo → { available, reason? }
 * Mock availability check. Swap for a real lookup against webese.ai.
 */
export async function GET(req: Request) {
  const name = new URL(req.url).searchParams.get("name") ?? "";
  const parsed = subdomainSchema.safeParse(name);
  if (!parsed.success) {
    return NextResponse.json({ available: false, reason: parsed.error.issues[0]?.message });
  }
  const sub = parsed.data;
  if (RESERVED.has(sub)) return NextResponse.json({ available: false, reason: "That one's reserved, sorry!" });
  if (TAKEN.has(sub)) {
    return NextResponse.json({ available: false, reason: "Someone beat you to it.", suggestion: `${sub}-${Math.floor(Math.random() * 90 + 10)}` });
  }
  return NextResponse.json({ available: true });
}
