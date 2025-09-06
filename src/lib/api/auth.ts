export type AuthStatus = { connected: boolean; expiresAt?: number };

export async function getAuthStatus(): Promise<AuthStatus> {
  const res = await fetch("/api/auth/status", { method: "GET", cache: "no-store" });
  if (!res.ok) return { connected: false };
  return (await res.json()) as AuthStatus;
}

export async function connectApiKey(apiKey: string, rememberHours?: number): Promise<AuthStatus> {
  const res = await fetch("/api/auth/key", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey, rememberHours }),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j?.error?.message || `HTTP ${res.status}`);
  }
  return (await res.json()) as AuthStatus;
}

export async function disconnectApiKey(): Promise<void> {
  await fetch("/api/auth/clear", { method: "POST" });
}


