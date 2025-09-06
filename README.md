This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

### Production notes (BYOK on Vercel)

- API routes run on Node.js runtime with `preferredRegion: home` and are marked `force-dynamic` to avoid caching. This helps keep the in-memory BYOK store coherent when deploying to a single region.
- Recommended project setup: use a single region for the production deployment. If you need multi-region or horizontal scaling for BYOK sessions, replace the in-memory store with a shared KV/Redis.
- API caching: All `/api/*` responses include `Cache-Control: no-store` via `next.config.ts` headers. Auth endpoints set an HttpOnly cookie `pp.byok.sid` scoped to `/api`.
- Env flags for refine caching and limits:
  - `REFINER_EXPLICIT_CACHE_ENABLED` (boolean): enable explicit content caching by default.
  - `REFINER_CACHE_MODE`: one of `off | implicit_only | explicit_per_request | explicit_per_conversation`.
  - `REFINER_CACHE_DEFAULT_TTL_SECONDS` (number): default TTL for explicit caches.
  - `REFINER_CACHE_AUTO_DELETE_ON_READY` (boolean): auto delete explicit cache when status becomes `ready`.
  - `REFINER_THINKING_BUDGET` (number, default 24576): thinking budget for model calls.
- Image inputs: images are sent inline as data URIs; keep total < ~18–20MB to avoid upstream/request size limits.

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

Client requests may pass `cache.mode`, otherwise server defaults apply.
