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

function getAesKey(): Buffer {
  const secret = process.env.BYOK_SECRET || process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || "pp-dev-secret";
  return crypto.createHash("sha256").update(secret).digest(); // 32 bytes
}

export function encryptApiKeyForCookie(apiKey: string): string {
  const iv = crypto.randomBytes(12);
  const key = getAesKey();
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(apiKey, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1.${iv.toString("base64url")}.${enc.toString("base64url")}.${tag.toString("base64url")}`;
}

export function decryptApiKeyFromCookie(payload?: string): string | undefined {
  try {
    if (!payload || !payload.startsWith("v1.")) return undefined;
    const [, ivb64, encb64, tagb64] = payload.split(".");
    if (!ivb64 || !encb64 || !tagb64) return undefined;
    const iv = Buffer.from(ivb64, "base64url");
    const enc = Buffer.from(encb64, "base64url");
    const tag = Buffer.from(tagb64, "base64url");
    const key = getAesKey();
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    const dec = Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
    return dec;
  } catch {
    return undefined;
  }
}

export function getApiKeyFromCookies(sessionId?: string, encrypted?: string, opts?: { touch?: boolean }): string | undefined {
  const fromStore = getApiKeyForSession(sessionId, opts);
  if (fromStore) return fromStore;
  return decryptApiKeyFromCookie(encrypted);
}