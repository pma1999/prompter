import { NextRequest, NextResponse } from "next/server";
import { getSessionExpiry, getApiKeyForSession, cleanupExpiredSessions } from "@/lib/server/keyStore";

const COOKIE_NAME = "pp.byok.sid";

export async function GET(req: NextRequest) {
  try {
    cleanupExpiredSessions();
    const cookie = req.cookies.get(COOKIE_NAME)?.value;
    try { console.debug("[byok][auth:status] cookie", { hasCookie: !!cookie, cookieLen: cookie?.length }); } catch {}
    const apiKey = getApiKeyForSession(cookie);
    if (!apiKey) {
      try { console.debug("[byok][auth:status] not_connected"); } catch {}
      return NextResponse.json({ connected: false });
    }
    const expiresAt = getSessionExpiry(cookie);
    try { console.debug("[byok][auth:status] connected", { expiresAt }); } catch {}
    return NextResponse.json({ connected: true, expiresAt });
  } catch (err: unknown) {
    const e = err as { message?: string };
    try { console.error("[byok][auth:status] error", { error: e?.message }); } catch {}
    return NextResponse.json({ error: { code: "INTERNAL", message: e?.message || "Internal error" } }, { status: 500 });
  }
}


