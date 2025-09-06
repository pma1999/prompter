import { GoogleGenAI } from "@google/genai";
import { RefineRequest, TokenCountResponse } from "@/domain/types";
import { buildCachedContents } from "@/lib/server/cacheService";
import { buildDirective, buildPrimarySuffix, buildCachedPrefix, buildUserContents } from "@/lib/server/refineService";

function hasImages(req: RefineRequest): boolean {
  return (req.context?.image?.assets?.length || 0) > 0;
}

export async function countTokensForRefineNextTurn(ai: GoogleGenAI, req: RefineRequest & { includeCachedPrefix?: boolean }): Promise<TokenCountResponse> {
  const modelName = req.family === "image" ? "gemini-2.5-flash-lite" : "gemini-2.5-flash";
  const imagesPresent = hasImages(req);

  const useExplicit = req.cache?.mode === "explicit_per_conversation" || req.cache?.mode === "explicit_per_request";
  const cachedName = req.cache?.cachedContentName;

  if (useExplicit && cachedName) {
    // Count only the dynamic suffix for the next call.
    const suffix = buildPrimarySuffix(req);
    const contents = buildUserContents(suffix, undefined);
    const resp = await ai.models.countTokens({ model: modelName, contents });
    return {
      totalTokens: resp.totalTokens ?? 0,
      // cached prefix already accounted by the server during generateContent via cachedContent
    };
  }

  if (useExplicit && !cachedName) {
    // We will count both: the prefix to be cached and the dynamic suffix.
    const prefixText = buildCachedPrefix(req, imagesPresent);
    const prefixContents = buildCachedContents(prefixText, req.context?.image?.assets);
    const suffixText = buildPrimarySuffix(req);
    const suffixContents = buildUserContents(suffixText, undefined);

    const [prefixResp, suffixResp] = await Promise.all([
      ai.models.countTokens({ model: modelName, contents: prefixContents }),
      ai.models.countTokens({ model: modelName, contents: suffixContents }),
    ]);
    return {
      totalTokens: suffixResp.totalTokens ?? 0,
      cachedContentTokenCount: prefixResp.totalTokens ?? 0,
    };
  }

  // Implicit mode: count the full directive (text + optional images) that would be sent.
  const directive = buildDirective(req, imagesPresent);
  const contents = buildUserContents(directive, req.context?.image?.assets);
  const resp = await ai.models.countTokens({ model: modelName, contents });
  return {
    totalTokens: resp.totalTokens ?? 0,
  };
}


