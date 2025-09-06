
### Production notes (BYOK on Vercel)

- API routes run on Node.js runtime with `preferredRegion: home` and are marked `force-dynamic` to avoid caching. This helps keep the in-memory BYOK store coherent when deploying to a single region.
- Recommended project setup: use a single region for the production deployment. If you need multi-region or horizontal scaling for BYOK sessions, replace the in-memory store with a shared KV/Redis.
- API caching: All `/api/*` responses include `Cache-Control: no-store` via `next.config.ts` headers. Security headers also include `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `Strict-Transport-Security`, `X-Frame-Options: DENY`, and a restrictive `Permissions-Policy`.
- BYOK cookies (server-only): `__Secure-pp.byok.sid` (HttpOnly, Secure, SameSite=Strict, Path=/api). For backward-compatibility the app also reads `pp.byok.sid`.
- Optional stateless fallback cookie (env-gated): `__Secure-pp.byok.sid.enc` contains the API key encrypted (AES-256-GCM) and is `HttpOnly`/`Secure`/`SameSite=Strict`/`Path=/api`. Gate with `BYOK_ENCRYPTED_COOKIE_ENABLED`. Default: disabled in production, enabled in development.
- Session TTL: server store entries can slide on access; the API refreshes cookie `maxAge` opportunistically to align with server-side expiration.

## Secrets & Rotation

- Required in production: `BYOK_SECRET_CURRENT` (used for encryption). Optionally set `BYOK_SECRET_PREVIOUS_1` to allow seamless rotation.
- The app decrypts both `v2` (versioned, keyed) and legacy `v1` payloads. New cookies are issued as `v2` using the CURRENT secret.
- Script `scripts/set-byok-secret.ps1` provisions `BYOK_SECRET_CURRENT` and `BYOK_SECRET_PREVIOUS_1` for `production` and `preview`, and writes them to `.env.local`.

## Gemini Caching (Implicit + Explicit)

The refine backend integrates Gemini context caching.

- Implicit caching: enabled by default on Gemini 2.5. We log `usageMetadata` when available.
- Explicit caching: per-conversation cache for `gemini-2.5-flash-lite` containing the stable prefix (persona + rules + raw prompt and optional inline images). Subsequent calls reference the cache via `config.cachedContent` and send only a small dynamic suffix.

Environment variables:

- `REFINER_EXPLICIT_CACHE_ENABLED` (default: false)
- `REFINER_CACHE_MODE` (default: explicit_per_conversation when explicit enabled, otherwise implicit_only)
- `REFINER_CACHE_DEFAULT_TTL_SECONDS` (default: 900)
- `REFINER_CACHE_AUTO_DELETE_ON_READY` (default: false)
- `REFINER_THINKING_BUDGET` (default: 24576)
- `BYOK_ENCRYPTED_COOKIE_ENABLED` (default: false in production; true in development)
- `BYOK_SECRET_CURRENT` (required in production), `BYOK_SECRET_PREVIOUS_1` (optional)

Client requests may pass `cache.mode`, otherwise server defaults apply.
