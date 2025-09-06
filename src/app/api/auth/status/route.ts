import { NextRequest, NextResponse } from "next/server";
import { getSessionExpiry, getApiKeyForSession, cleanupExpiredSessions, decryptApiKeyFromCookie } from "@/lib/server/keyStore";
import { isEncryptedCookieEnabled, readByokCookies } from "@/lib/server/cookies";

export const runtime = "nodejs";
export const preferredRegion = "home";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    cleanupExpiredSessions();
    const { sessionId, enc } = readByokCookies(req);
    try { console.debug("[byok][auth:status] cookie", { hasCookie: !!sessionId, cookieLen: sessionId?.length }); } catch {}
    const apiKey = getApiKeyForSession(sessionId) || (isEncryptedCookieEnabled() ? decryptApiKeyFromCookie(enc) : undefined);
    if (!apiKey) {
      try { console.debug("[byok][auth:status] not_connected"); } catch {}
      return NextResponse.json({ connected: false });
    }
    const expiresAt = getSessionExpiry(sessionId);
    try { console.debug("[byok][auth:status] connected", { expiresAt }); } catch {}
    return NextResponse.json({ connected: true, expiresAt });
  } catch (err: unknown) {
    const e = err as { message?: string };
    try { console.error("[byok][auth:status] error", { error: e?.message }); } catch {}
    return NextResponse.json({ error: { code: "INTERNAL", message: e?.message || "Internal error" } }, { status: 500 });
  }
}


