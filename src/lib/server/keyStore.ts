import crypto from "crypto";

interface KeySession {
  apiKey: string;
  expiresAt: number;
}

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24h

// In-memory store with dev-HMR persistence. In production, swap with Redis/KV.
type GlobalWithKeyStore = typeof globalThis & { __ppByokStore?: Map<string, KeySession> };
const g = globalThis as GlobalWithKeyStore;
const sessionIdToSession: Map<string, KeySession> = g.__ppByokStore ?? (g.__ppByokStore = new Map<string, KeySession>());

function now(): number {
  return Date.now();
}

function generateSessionId(): string {
  return crypto.randomUUID();
}

function normalizeTtlMs(ttlMs?: number): number {
  if (!ttlMs || !Number.isFinite(ttlMs) || ttlMs <= 0) return DEFAULT_TTL_MS;
  const max = 7 * 24 * 60 * 60 * 1000; // cap at 7 days
  return Math.min(ttlMs, max);
}

export function createOrUpdateKeySession(apiKey: string, ttlMs?: number): { sessionId: string; expiresAt: number } {
  const expiresAt = now() + normalizeTtlMs(ttlMs);
  const sessionId = generateSessionId();
  sessionIdToSession.set(sessionId, { apiKey, expiresAt });
  try { console.debug("[byok][store] session_create", { sessionId, expiresAt, size: sessionIdToSession.size }); } catch {}
  return { sessionId, expiresAt };
}

export function getApiKeyForSession(sessionId: string | undefined, opts?: { touch?: boolean }): string | undefined {
  if (!sessionId) return undefined;
  const entry = sessionIdToSession.get(sessionId);
  if (!entry) return undefined;
  if (entry.expiresAt <= now()) {
    sessionIdToSession.delete(sessionId);
    try { console.debug("[byok][store] session_expired", { sessionId }); } catch {}
    return undefined;
  }
  if (opts?.touch) {
    // Renew session on access by extending 50% of default TTL (sliding window)
    const extension = Math.floor(DEFAULT_TTL_MS * 0.5);
    entry.expiresAt = Math.min(entry.expiresAt + extension, now() + DEFAULT_TTL_MS);
    sessionIdToSession.set(sessionId, entry);
    try { console.debug("[byok][store] session_touch", { sessionId, newExpiresAt: entry.expiresAt }); } catch {}
  }
  try { console.debug("[byok][store] session_get", { sessionId, expiresAt: entry.expiresAt }); } catch {}
  return entry.apiKey;
}

export function getSessionExpiry(sessionId: string | undefined): number | undefined {
  if (!sessionId) return undefined;
  const entry = sessionIdToSession.get(sessionId);
  if (!entry) return undefined;
  if (entry.expiresAt <= now()) {
    sessionIdToSession.delete(sessionId);
    return undefined;
  }
  return entry.expiresAt;
}

export function deleteSession(sessionId: string | undefined): void {
  if (!sessionId) return;
  sessionIdToSession.delete(sessionId);
  try { console.debug("[byok][store] session_delete", { sessionId, size: sessionIdToSession.size }); } catch {}
}

// Best-effort background cleanup (no timers in serverless; called opportunistically)
export function cleanupExpiredSessions(): void {
  const t = now();
  let removed = 0;
  for (const [sid, entry] of sessionIdToSession.entries()) {
    if (entry.expiresAt <= t) sessionIdToSession.delete(sid);
    removed++;
  }
  if (removed) { try { console.debug("[byok][store] cleanup", { removed, size: sessionIdToSession.size }); } catch {} }
}

export function getStoreSize(): number {
  return sessionIdToSession.size;
}

// --- Encrypted cookie helpers (stateless BYOK for serverless) ---
type KeyBundle = { current?: Buffer; previous1?: Buffer; legacy?: Buffer[] };

function sha256(input: string): Buffer {
  return crypto.createHash("sha256").update(input).digest();
}

function getKeyBundle(): KeyBundle {
  const isProd = process.env.NODE_ENV === "production";
  const currentSecret = process.env.BYOK_SECRET_CURRENT || process.env.BYOK_SECRET;
  const previous1 = process.env.BYOK_SECRET_PREVIOUS_1;

  if (isProd && !process.env.BYOK_SECRET_CURRENT) {
    throw new Error("BYOK_SECRET_CURRENT_MISSING");
  }

  const bundle: KeyBundle = { current: undefined, previous1: undefined, legacy: [] };
  if (currentSecret) bundle.current = sha256(currentSecret);
  if (previous1) bundle.previous1 = sha256(previous1);

  // Legacy fallbacks for v1 payloads only (best-effort in dev)
  const legacyCandidates: string[] = [];
  if (process.env.BYOK_SECRET) legacyCandidates.push(process.env.BYOK_SECRET);
  if (process.env.NEXTAUTH_SECRET) legacyCandidates.push(process.env.NEXTAUTH_SECRET);
  if (process.env.AUTH_SECRET) legacyCandidates.push(process.env.AUTH_SECRET);
  if (!isProd && legacyCandidates.length === 0) legacyCandidates.push("pp-dev-secret");
  bundle.legacy = legacyCandidates.map(sha256);
  return bundle;
}

export function encryptApiKeyForCookie(apiKey: string): string {
  // v2 with versioned key id ('c' current). Decryptors should prefer indicated key.
  const keys = getKeyBundle();
  if (!keys.current) throw new Error("BYOK_SECRET_CURRENT_MISSING");
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", keys.current, iv);
  const enc = Buffer.concat([cipher.update(apiKey, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v2.c.${iv.toString("base64url")}.${enc.toString("base64url")}.${tag.toString("base64url")}`;
}

export function decryptApiKeyFromCookie(payload?: string): string | undefined {
  try {
    if (!payload) return undefined;
    const parts = payload.split(".");
    if (parts[0] === "v2") {
      // v2.<kid>.<iv>.<enc>.<tag>
      const [, kid, ivb64, encb64, tagb64] = parts;
      if (!kid || !ivb64 || !encb64 || !tagb64) return undefined;
      const iv = Buffer.from(ivb64, "base64url");
      const enc = Buffer.from(encb64, "base64url");
      const tag = Buffer.from(tagb64, "base64url");
      const keys = getKeyBundle();
      const key = kid === "c" ? keys.current : kid === "p1" ? keys.previous1 : undefined;
      if (!key) return undefined;
      const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
      decipher.setAuthTag(tag);
      const dec = Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
      return dec;
    }
    if (parts[0] === "v1") {
      // Try all available keys (current/previous/legacy) for backward compatibility
      const [, ivb64, encb64, tagb64] = parts;
      if (!ivb64 || !encb64 || !tagb64) return undefined;
      const iv = Buffer.from(ivb64, "base64url");
      const enc = Buffer.from(encb64, "base64url");
      const tag = Buffer.from(tagb64, "base64url");
      const keys = getKeyBundle();
      const candidates: Buffer[] = [keys.current, keys.previous1, ...(keys.legacy || [])].filter(Boolean) as Buffer[];
      for (const key of candidates) {
        try {
          const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
          decipher.setAuthTag(tag);
          const dec = Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
          return dec;
        } catch {
          // try next key
        }
      }
      return undefined;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

export function getApiKeyFromCookies(sessionId?: string, encrypted?: string, opts?: { touch?: boolean }): string | undefined {
  const fromStore = getApiKeyForSession(sessionId, opts);
  if (fromStore) return fromStore;
  return decryptApiKeyFromCookie(encrypted);
}