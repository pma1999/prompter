import { RefineRequest, TokenCountResponse } from "@/domain/types";

export async function postCountTokens(req: RefineRequest & { includeCachedPrefix?: boolean }): Promise<TokenCountResponse> {
  try {
    console.debug("[tokens][client] request", {
      family: req.family,
      modelId: req.modelId,
      cache: req.cache,
      hasImages: !!req.context?.image?.assets?.length,
      includeCachedPrefix: req.includeCachedPrefix,
    });
  } catch {}

  const res = await fetch("/api/tokens/count", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
    cache: "no-store",
  });
  const json = await res.json();
  try {
    console.debug("[tokens][client] response", { ok: res.ok, status: res.status, body: json });
  } catch {}
  if (!res.ok) {
    const errMsg = json?.error?.message || `HTTP ${res.status}`;
    throw new Error(errMsg);
  }
  return json as TokenCountResponse;
}


