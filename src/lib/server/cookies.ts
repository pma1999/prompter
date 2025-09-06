import { NextRequest, NextResponse } from "next/server";

// Primary secure cookie names
export const COOKIE_NAME_SESSION_PRIMARY = "__Secure-pp.byok.sid";
export const COOKIE_NAME_ENC_PRIMARY = "__Secure-pp.byok.sid.enc";

// Backward-compatibility fallback names
const COOKIE_NAME_SESSION_FALLBACK = "pp.byok.sid";
const COOKIE_NAME_ENC_FALLBACK = "pp.byok.sid.enc";

const SESSION_COOKIE_CANDIDATES = [COOKIE_NAME_SESSION_PRIMARY, COOKIE_NAME_SESSION_FALLBACK];
const ENC_COOKIE_CANDIDATES = [COOKIE_NAME_ENC_PRIMARY, COOKIE_NAME_ENC_FALLBACK];

export function readByokCookies(req: NextRequest): { sessionId?: string; enc?: string } {
  for (const name of SESSION_COOKIE_CANDIDATES) {
    const v = req.cookies.get(name)?.value;
    if (v) {
      // Try to also capture enc using same prefix set if present
      for (const encName of ENC_COOKIE_CANDIDATES) {
        const e = req.cookies.get(encName)?.value;
        if (e) return { sessionId: v, enc: e };
      }
      return { sessionId: v, enc: undefined };
    }
  }
  for (const name of ENC_COOKIE_CANDIDATES) {
    const e = req.cookies.get(name)?.value;
    if (e) return { enc: e };
  }
  return {};
}

export function setSessionCookie(res: NextResponse, sessionId: string, ttlMs: number): void {
  const secure = process.env.NODE_ENV === "production";
  res.cookies.set(COOKIE_NAME_SESSION_PRIMARY, sessionId, {
    httpOnly: true,
    secure,
    sameSite: "strict",
    path: "/api",
    maxAge: Math.max(0, Math.floor(ttlMs / 1000)),
  });
}

export function setEncryptedCookie(res: NextResponse, payload: string, ttlMs: number): void {
  const secure = process.env.NODE_ENV === "production";
  res.cookies.set(COOKIE_NAME_ENC_PRIMARY, payload, {
    httpOnly: true,
    secure,
    sameSite: "strict",
    path: "/api",
    maxAge: Math.max(0, Math.floor(ttlMs / 1000)),
  });
}

export function clearByokCookies(res: NextResponse): void {
  const secure = process.env.NODE_ENV === "production";
  const names = [...SESSION_COOKIE_CANDIDATES, ...ENC_COOKIE_CANDIDATES];
  for (const n of names) {
    res.cookies.set(n, "", {
      httpOnly: true,
      secure,
      sameSite: "strict",
      path: "/api",
      maxAge: 0,
    });
  }
}

export function isEncryptedCookieEnabled(): boolean {
  const explicit = process.env.BYOK_ENCRYPTED_COOKIE_ENABLED;
  if (typeof explicit === "string") {
    return explicit.toLowerCase() === "true";
  }
  // Auto-enable in production when a current secret is configured, to ensure
  // stateless BYOK works reliably across serverless instances.
  if (process.env.NODE_ENV === "production" && process.env.BYOK_SECRET_CURRENT) {
    return true;
  }
  // Default: enabled in dev, disabled in production without a secret
  return process.env.NODE_ENV !== "production";
}


