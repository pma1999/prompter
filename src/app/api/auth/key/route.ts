import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createOrUpdateKeySession, encryptApiKeyForCookie } from "@/lib/server/keyStore";
import { assertSameOrigin, rateLimit } from "@/lib/server/security";
import { isEncryptedCookieEnabled, setEncryptedCookie, setSessionCookie } from "@/lib/server/cookies";

export const runtime = "nodejs";
export const preferredRegion = "home";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  apiKey: z.string().min(20).max(256),
  rememberHours: z.number().int().positive().max(24 * 7).optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Defense-in-depth: enforce same-origin on credential-setting endpoint
    assertSameOrigin(req);
    const rl = rateLimit(req, "auth:key", { allow: 10, windowMs: 60_000 });
    if (!rl.ok) {
      return NextResponse.json({ error: { code: "RATE_LIMITED", message: "Too many requests" } }, { status: 429, headers: { "Retry-After": Math.ceil((rl.resetAt - Date.now()) / 1000).toString() } });
    }
    const payload = await req.json();
    const parsed = BodySchema.safeParse(payload);
    if (!parsed.success) {
      try { console.warn("[byok][auth:key] bad_request", { issues: parsed.error.issues }); } catch {}
      return NextResponse.json({ error: { code: "BAD_REQUEST", message: parsed.error.message } }, { status: 400 });
    }

    const ttlMs = (parsed.data.rememberHours ?? 24) * 60 * 60 * 1000;
    const { sessionId, expiresAt } = createOrUpdateKeySession(parsed.data.apiKey, ttlMs);

    const res = NextResponse.json({ connected: true, expiresAt });
    setSessionCookie(res, sessionId, ttlMs);
    // Optional stateless encrypted fallback (env-gated)
    if (isEncryptedCookieEnabled()) {
      setEncryptedCookie(res, encryptApiKeyForCookie(parsed.data.apiKey), ttlMs);
    }
    try { console.debug("[byok][auth:key] set", { sessionId, expiresAt }); } catch {}
    return res;
  } catch (err: unknown) {
    const e = err as { message?: string };
    try { console.error("[byok][auth:key] error", { error: e?.message }); } catch {}
    return NextResponse.json({ error: { code: "INTERNAL", message: e?.message || "Internal error" } }, { status: 500 });
  }
}


