import { NextRequest, NextResponse } from "next/server";
import { deleteSession } from "@/lib/server/keyStore";
import { assertSameOrigin, rateLimit } from "@/lib/server/security";
import { clearByokCookies, readByokCookies } from "@/lib/server/cookies";

export const runtime = "nodejs";
export const preferredRegion = "home";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const rl = rateLimit(req, "auth:clear", { allow: 20, windowMs: 60_000 });
    if (!rl.ok) {
      return NextResponse.json({ error: { code: "RATE_LIMITED", message: "Too many requests" } }, { status: 429, headers: { "Retry-After": Math.ceil((rl.resetAt - Date.now()) / 1000).toString() } });
    }
    const { sessionId } = readByokCookies(req);
    if (sessionId) deleteSession(sessionId);
    const res = NextResponse.json({ connected: false });
    clearByokCookies(res);
    try { console.debug("[byok][auth:clear] cleared", { hadCookie: !!sessionId }); } catch {}
    return res;
  } catch (err: unknown) {
    const e = err as { message?: string };
    try { console.error("[byok][auth:clear] error", { error: e?.message }); } catch {}
    return NextResponse.json({ error: { code: "INTERNAL", message: e?.message || "Internal error" } }, { status: 500 });
  }
}


