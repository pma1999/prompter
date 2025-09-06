import { NextRequest } from "next/server";

type RateLimitWindow = {
  allow: number;
  windowMs: number;
};

// Simple in-memory token bucket per key (IP or session), suitable for single-region deployments.
// In multi-region/horizontal setups, replace with a shared KV/Redis implementation.
type Bucket = { tokens: number; resetAt: number };
const buckets: Map<string, Bucket> = new Map<string, Bucket>();

function getClientIp(req: NextRequest): string {
  // Prefer Vercel/Proxy header, fallback to remote address
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() || "unknown";
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

export function isSameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (!origin || !host) return true; // Treat missing as same-origin for server-to-server
  try {
    const u = new URL(origin);
    return u.host === host;
  } catch {
    return false;
  }
}

export function assertSameOrigin(req: NextRequest): void {
  if (!isSameOrigin(req)) {
    const origin = req.headers.get("origin");
    const host = req.headers.get("host");
    const err = new Error("FORBIDDEN_ORIGIN") as Error & { details?: { origin?: string | null; host?: string | null } };
    err.details = { origin, host };
    throw err;
  }
}

export function rateLimit(req: NextRequest, keyPrefix: string, conf: RateLimitWindow): { ok: boolean; remaining: number; resetAt: number } {
  const ip = getClientIp(req);
  const key = `${keyPrefix}:${ip}`;
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { tokens: conf.allow, resetAt: now + conf.windowMs };
    buckets.set(key, bucket);
  }
  if (bucket.tokens <= 0) {
    return { ok: false, remaining: 0, resetAt: bucket.resetAt };
  }
  bucket.tokens -= 1;
  return { ok: true, remaining: bucket.tokens, resetAt: bucket.resetAt };
}


