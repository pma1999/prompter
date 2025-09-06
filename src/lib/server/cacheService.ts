import { GoogleGenAI } from "@google/genai";
import { AssetRef, RefineRequest, UsageMetadata, ModalityTokenCount } from "@/domain/types";

export type CacheMode = "off" | "implicit_only" | "explicit_per_request" | "explicit_per_conversation";

function parseBooleanEnv(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  const v = value.toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

export function getDefaultCacheMode(): CacheMode {
  const explicitEnabled = parseBooleanEnv(process.env.REFINER_EXPLICIT_CACHE_ENABLED, false);
  const mode = (process.env.REFINER_CACHE_MODE || (explicitEnabled ? "explicit_per_conversation" : "implicit_only")) as CacheMode;
  if (mode === "off" || mode === "implicit_only" || mode === "explicit_per_request" || mode === "explicit_per_conversation") {
    return mode;
  }
  return explicitEnabled ? "explicit_per_conversation" : "implicit_only";
}

export function getDefaultTtlSeconds(): number {
  const n = Number.parseInt(process.env.REFINER_CACHE_DEFAULT_TTL_SECONDS || "900", 10);
  return Number.isFinite(n) && n > 0 ? n : 900;
}

export function shouldAutoDeleteOnReady(): boolean {
  return parseBooleanEnv(process.env.REFINER_CACHE_AUTO_DELETE_ON_READY, false);
}

function toDurationString(seconds: number | undefined): string | undefined {
  if (!seconds || seconds <= 0) return undefined;
  return `${Math.floor(seconds)}s`;
}

function simpleHash(input: string): string {
  // djb2 non-cryptographic hash for stable keys
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
}

export function buildAssetsDigest(assets?: AssetRef[]): string {
  if (!assets || assets.length === 0) return "no_assets";
  const parts = assets
    .slice()
    .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
    .map((a) => {
      const dataLen = a.dataUri ? a.dataUri.length : 0;
      const dataStart = a.dataUri ? a.dataUri.slice(0, 64) : "";
      return [a.name, a.mimeType, a.sizeBytes ?? 0, a.source, a.url ?? "", dataLen, dataStart].join("|");
    })
    .join("||");
  return simpleHash(parts);
}

export function buildCacheKey(params: {
  modelName: string;
  family: RefineRequest["family"];
  instructionPresetId: string;
  rawPrompt: string;
  hasImages: boolean;
  assetsDigest: string;
}): string {
  const { modelName, family, instructionPresetId, rawPrompt, hasImages, assetsDigest } = params;
  const rawPreview = rawPrompt.slice(0, 512);
  const body = [modelName, family, instructionPresetId, hasImages ? "img1" : "img0", assetsDigest, rawPreview].join("#");
  return `refine:${simpleHash(body)}`;
}

export function buildCachedContents(prefixText: string, assets?: AssetRef[]): unknown {
  const imageParts = (assets || [])
    .filter((a) => a.mimeType && a.dataUri)
    .map((a) => {
      const base64 = (a.dataUri || "").split(",")[1] || "";
      return {
        inlineData: {
          mimeType: a.mimeType,
          data: base64,
        },
      } as const;
    });
  if (imageParts.length > 0) {
    return [...imageParts, { text: prefixText }];
  }
  return prefixText;
}

export async function ensureCache(params: {
  ai: GoogleGenAI;
  modelName: string;
  systemInstruction: string;
  cachedPrefixContents: unknown;
  requestedName?: string;
  ttlSeconds?: number;
}): Promise<{ name: string; expireTime?: string; created: boolean }> {
  const { ai, modelName, systemInstruction, cachedPrefixContents, requestedName } = params;
  const ttl = toDurationString(params.ttlSeconds ?? getDefaultTtlSeconds());
  if (requestedName) {
    // Caller believes this cache exists and is valid; do not validate here to avoid extra roundtrips
    return { name: requestedName, created: false };
  }
  const created = await ai.caches.create({
    model: modelName,
    config: {
      contents: cachedPrefixContents as any,
      systemInstruction,
      ...(ttl ? { ttl } : {}),
    },
  });
  const createdName = (created as any)?.name as string;
  const createdExpire = (created as any)?.expireTime as string | undefined;
  try { console.debug("[refine][cache] create", { name: createdName, expireTime: createdExpire }); } catch {}
  return { name: createdName, expireTime: createdExpire, created: true };
}

export async function updateCacheTtl(ai: GoogleGenAI, name: string, ttlSeconds?: number): Promise<void> {
  const ttl = toDurationString(ttlSeconds ?? getDefaultTtlSeconds());
  if (!ttl) return;
  try {
    const updated = await ai.caches.update({ name, config: { ttl } });
    try { console.debug("[refine][cache] update_ttl", { name, expireTime: (updated as any)?.expireTime }); } catch {}
  } catch (err: unknown) {
    try { console.warn("[refine][cache] update_ttl_error", { name, error: (err as any)?.message }); } catch {}
  }
}

export async function deleteCache(ai: GoogleGenAI, name: string): Promise<void> {
  try {
    await ai.caches.delete({ name });
    try { console.debug("[refine][cache] delete", { name }); } catch {}
  } catch (err: unknown) {
    try { console.warn("[refine][cache] delete_error", { name, error: (err as any)?.message }); } catch {}
  }
}

function toModalityList(val: any): ModalityTokenCount[] | undefined {
  if (!Array.isArray(val)) return undefined;
  return val
    .map((item) => {
      const modality = item?.modality || item?.modality_type || item?.type;
      const tokenCount = item?.tokenCount ?? item?.token_count;
      if (!modality || typeof tokenCount !== "number") return undefined;
      return { modality: String(modality), tokenCount: Number(tokenCount) } as ModalityTokenCount;
    })
    .filter(Boolean) as ModalityTokenCount[];
}

export function extractUsageMetadata(resp: any): UsageMetadata | undefined {
  const meta = (resp as any)?.usageMetadata || (resp as any)?.usage_metadata;
  if (!meta) return undefined;
  const promptTokenCount = meta.promptTokenCount ?? meta.prompt_token_count;
  const candidatesTokenCount = meta.candidatesTokenCount ?? meta.candidates_token_count;
  const totalTokenCount = meta.totalTokenCount ?? meta.total_token_count;
  const cachedContentTokenCount = meta.cachedContentTokenCount ?? meta.cached_content_token_count ?? meta.cachedTokens ?? meta.cached_tokens;
  const thoughtsTokenCount = meta.thoughtsTokenCount ?? meta.thoughts_token_count;
  const promptTokensDetails = toModalityList(meta.promptTokensDetails ?? meta.prompt_tokens_details);
  const cacheTokensDetails = toModalityList(meta.cacheTokensDetails ?? meta.cache_tokens_details);
  const out: UsageMetadata = {};
  if (typeof promptTokenCount === "number") out.promptTokenCount = promptTokenCount;
  if (typeof candidatesTokenCount === "number") out.candidatesTokenCount = candidatesTokenCount;
  if (typeof totalTokenCount === "number") out.totalTokenCount = totalTokenCount;
  if (typeof cachedContentTokenCount === "number") out.cachedContentTokenCount = cachedContentTokenCount;
  if (typeof thoughtsTokenCount === "number") out.thoughtsTokenCount = thoughtsTokenCount;
  if (promptTokensDetails?.length) out.promptTokensDetails = promptTokensDetails;
  if (cacheTokensDetails?.length) out.cacheTokensDetails = cacheTokensDetails;
  return out;
}


