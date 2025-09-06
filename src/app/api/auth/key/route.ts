import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createOrUpdateKeySession, encryptApiKeyForCookie } from "@/lib/server/keyStore";

const COOKIE_NAME = "pp.byok.sid";

export const runtime = "nodejs";
export const preferredRegion = "home";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  apiKey: z.string().min(20).max(256),
  rememberHours: z.number().int().positive().max(24 * 7).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const parsed = BodySchema.safeParse(payload);
    if (!parsed.success) {
      try { console.warn("[byok][auth:key] bad_request", { issues: parsed.error.issues }); } catch {}
      return NextResponse.json({ error: { code: "BAD_REQUEST", message: parsed.error.message } }, { status: 400 });
    }

    const ttlMs = (parsed.data.rememberHours ?? 24) * 60 * 60 * 1000;
    const { sessionId, expiresAt } = createOrUpdateKeySession(parsed.data.apiKey, ttlMs);

    const res = NextResponse.json({ connected: true, expiresAt });
    const secure = process.env.NODE_ENV === "production";
    res.cookies.set(COOKIE_NAME, sessionId, {
      httpOnly: true,
      secure,
      sameSite: "strict",
      path: "/api",
      maxAge: Math.floor(ttlMs / 1000),
    });
    // Set a stateless encrypted fallback so that serverless cold starts or multi-region still work
    res.cookies.set(`${COOKIE_NAME}.enc`, encryptApiKeyForCookie(parsed.data.apiKey), {
      httpOnly: true,
      secure,
      sameSite: "strict",
      path: "/api",
      maxAge: Math.floor(ttlMs / 1000),
    });
    try { console.debug("[byok][auth:key] set", { sessionId, expiresAt, secure }); } catch {}
    return res;
  } catch (err: unknown) {
    const e = err as { message?: string };
    try { console.error("[byok][auth:key] error", { error: e?.message }); } catch {}
    return NextResponse.json({ error: { code: "INTERNAL", message: e?.message || "Internal error" } }, { status: 500 });
  }
}


