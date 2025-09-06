import { RefineRequest, RefineResponse, AssetRef, UsageMetadata, RefineUsageBundle } from "@/domain/types";
import { getGenAI } from "@/lib/server/gemini";
import { refineResponseSchema, previewOnlySchema, finalOnlySchema } from "@/lib/server/refineSchema";
import { INSTRUCTION_PRESETS } from "@/lib/instructionPresets";
import { GoogleGenAI } from "@google/genai";
import {
  buildAssetsDigest,
  buildCacheKey,
  buildCachedContents,
  ensureCache,
  extractUsageMetadata,
  getDefaultCacheMode,
  shouldAutoDeleteOnReady,
  updateCacheTtl,
  deleteCache,
} from "@/lib/server/cacheService";

export function getPersonaForFamily(family: "text" | "image"): string {
  if (family === "image") {
    const p = INSTRUCTION_PRESETS.find((x) => x.id === "image-virtuoso");
    return p?.persona ?? "You are an Image Prompt Virtuoso.";
  }
  const p = INSTRUCTION_PRESETS.find((x) => x.id === "llm-refiner");
  return p?.persona ?? "You are a meticulous prompt engineer.";
}

function serializeQA(questions?: Array<{ id: string; text: string; options: Array<{ id: string; label: string; recommended?: boolean; why?: string }> }>, answers?: Array<{ questionId: string; optionId: string }>): string {
  if (!questions || questions.length === 0) return "";
  const answerMap = new Map<string, string>((answers || []).map((a) => [a.questionId, a.optionId]));
  const lines: string[] = ["\nClarification Q&A Transcript:"];
  for (const q of questions) {
    const selected = answerMap.get(q.id);
    const label = q.options.find((o) => o.id === selected)?.label || selected || "(unanswered)";
    lines.push(`- ${q.id}: ${q.text}`);
    lines.push(`  → Chosen: ${label}`);
  }
  return lines.join("\n");
}

export function buildDirective(req: RefineRequest, hasImages?: boolean): string {
  const base = [
    "You are refining a user's raw intent into a perfect, ready-to-use prompt.",
    req.family === "image"
      ? "Target generation model: gemini-2.5-flash-image (image generation)."
      : "Target generation model: gemini-2.5-flash (text).",
    ...(hasImages
      ? [
          "- If reference image(s) are attached to this request, consider them as grounding visual context when drafting the prompt. These same images will also be sent to the gemini-2.5-flash-image generation step.",
        ]
      : []),
    "Rules:",
    "- If critical details are missing, return status=\"needs_clarification\" with 1-3 multiple-choice questions (each with exactly one recommended option and a brief 'why'), plus a previewPrompt written entirely based on your recommended options.",
    "- Never return status=\"needs_clarification\" without questions[]. If you have no questions to ask, set status=\"ready\" and provide perfectedPrompt.",
    "- If details are sufficient, return status=\"ready\" with perfectedPrompt only.",
    "- Final prompts must be a single paragraph in English.",
    "- Use question ids as q1, q2, ... and option ids as A, B, C, ... (uppercase letters).",
    "- Provide recommendedAnswers as the list of (questionId, optionId) for your recommended choices.",
  ].join("\n");

  const raw = `\nRaw Prompt:\n"""\n${req.rawPrompt}\n"""`;

  const answersBlock = req.answers?.length
    ? `\nUser Answers:\n${req.answers.map((a) => `- ${a.questionId}: ${a.optionId}`).join("\n")}`
    : "";

  const priorPreview = req.previousPreviewPrompt ? `\nPrevious Preview Prompt (for grounding only):\n"""\n${req.previousPreviewPrompt}\n"""` : "";
  const priorQA = serializeQA(req.previousQuestions, req.answers);

  const directive = [base, raw, answersBlock, priorPreview, priorQA].join("\n");
  try { console.debug("[refine][service] directive", directive); } catch {}
  return directive;
}

export function buildCachedPrefix(req: RefineRequest, hasImages?: boolean): string {
  const base = [
    "You are refining a user's raw intent into a perfect, ready-to-use prompt.",
    req.family === "image"
      ? "Target generation model: gemini-2.5-flash-image (image generation)."
      : "Target generation model: gemini-2.5-flash (text).",
    ...(hasImages
      ? [
          "- If reference image(s) are attached to this request, consider them as grounding visual context when drafting the prompt. These same images will also be sent to the gemini-2.5-flash-image generation step.",
        ]
      : []),
    "Rules:",
    "- If critical details are missing, return status=\"needs_clarification\" with 1-3 multiple-choice questions (each with exactly one recommended option and a brief 'why'), plus a previewPrompt written entirely based on your recommended options.",
    "- Never return status=\"needs_clarification\" without questions[]. If you have no questions to ask, set status=\"ready\" and provide perfectedPrompt.",
    "- If details are sufficient, return status=\"ready\" with perfectedPrompt only.",
    "- Final prompts must be a single paragraph in English.",
    "- Use question ids as q1, q2, ... and option ids as A, B, C, ... (uppercase letters).",
    "- Provide recommendedAnswers as the list of (questionId, optionId) for your recommended choices.",
  ].join("\n");

  const raw = `\nRaw Prompt:\n"""\n${req.rawPrompt}\n"""`;
  const prefix = [base, raw].join("\n");
  try { console.debug("[refine][service] cachedPrefix", prefix); } catch {}
  return prefix;
}

export function buildPrimarySuffix(req: RefineRequest): string {
  const answersBlock = req.answers?.length
    ? `\nUser Answers:\n${req.answers.map((a) => `- ${a.questionId}: ${a.optionId}`).join("\n")}`
    : "";
  const priorPreview = req.previousPreviewPrompt ? `\nPrevious Preview Prompt (for grounding only):\n"""\n${req.previousPreviewPrompt}\n"""` : "";
  const priorQA = serializeQA(req.previousQuestions, req.answers);
  const suffix = [answersBlock, priorPreview, priorQA].join("\n");
  try { console.debug("[refine][service] primarySuffix", suffix); } catch {}
  return suffix;
}

function buildPreviewDirective(rawPrompt: string, assumed: Array<{ questionId: string; optionId: string }>, family: "text" | "image", previousPreview?: string, previousQuestions?: RefineRequest["previousQuestions"], hasImages?: boolean): string {
  const base = [
    "Synthesize a preview prompt now, assuming the following answers are chosen.",
    family === "image"
      ? "Target generation model: gemini-2.5-flash-image (image generation)."
      : "Target generation model: gemini-2.5-flash (text).",
    ...(hasImages
      ? [
          "- If reference image(s) are attached to this request, consider them as grounding visual context when drafting the prompt. These same images will also be sent to the gemini-2.5-flash-image generation step.",
        ]
      : []),
    "- The previewPrompt must be a single, descriptive paragraph in English.",
  ].join("\n");

  const raw = `\nRaw Prompt:\n"""\n${rawPrompt}\n"""`;
  const assumedBlock = `\nAssumed Answers:\n${assumed.map((a) => `- ${a.questionId}: ${a.optionId}`).join("\n")}`;
  const priorPreview = previousPreview ? `\nPrevious Preview (context):\n"""\n${previousPreview}\n"""` : "";
  const priorQA = serializeQA(previousQuestions, assumed);

  const directive = [base, raw, assumedBlock, priorPreview, priorQA].join("\n");
  try { console.debug("[refine][service] previewDirective", directive); } catch {}
  return directive;
}

function buildPreviewSuffix(rawPrompt: string, assumed: Array<{ questionId: string; optionId: string }>, family: "text" | "image", previousPreview?: string, previousQuestions?: RefineRequest["previousQuestions"], hasImages?: boolean): string {
  const base = [
    "Synthesize a preview prompt now, assuming the following answers are chosen.",
    family === "image"
      ? "Target generation model: gemini-2.5-flash-image (image generation)."
      : "Target generation model: gemini-2.5-flash (text).",
    ...(hasImages
      ? [
          "- If reference image(s) are attached to this request, consider them as grounding visual context when drafting the prompt. These same images will also be sent to the gemini-2.5-flash-image generation step.",
        ]
      : []),
    "- The previewPrompt must be a single, descriptive paragraph in English.",
  ].join("\n");
  const assumedBlock = `\nAssumed Answers:\n${assumed.map((a) => `- ${a.questionId}: ${a.optionId}`).join("\n")}`;
  const priorPreviewBlock = previousPreview ? `\nPrevious Preview (context):\n"""\n${previousPreview}\n"""` : "";
  const priorQA = serializeQA(previousQuestions, assumed);
  const suffix = [base, assumedBlock, priorPreviewBlock, priorQA].join("\n");
  try { console.debug("[refine][service] previewSuffix", suffix); } catch {}
  return suffix;
}

function buildFinalDirective(rawPrompt: string, allAnswers: Array<{ questionId: string; optionId: string }>, family: "text" | "image", previousPreview?: string, previousQuestions?: RefineRequest["previousQuestions"], hasImages?: boolean): string {
  const base = [
    "Synthesize the perfected prompt now, considering the user's intent and the following answers.",
    family === "image"
      ? "Target generation model: gemini-2.5-flash-image (image generation)."
      : "Target generation model: gemini-2.5-flash (text).",
    ...(hasImages
      ? [
          "- If reference image(s) are attached to this request, consider them as grounding visual context when drafting the prompt. These same images will also be sent to the gemini-2.5-flash-image generation step.",
        ]
      : []),
    "- The perfectedPrompt must be a single, descriptive paragraph in English.",
  ].join("\n");

  const raw = `\nRaw Prompt:\n"""\n${rawPrompt}\n"""`;
  const answersBlock = `\nClarification Answers:\n${allAnswers.map((a) => `- ${a.questionId}: ${a.optionId}`).join("\n")}`;
  const priorPreview = previousPreview ? `\nPrevious Preview (context):\n"""\n${previousPreview}\n"""` : "";
  const priorQA = serializeQA(previousQuestions, allAnswers);

  const directive = [base, raw, answersBlock, priorPreview, priorQA].join("\n");
  try { console.debug("[refine][service] finalDirective", directive); } catch {}
  return directive;
}

function buildFinalSuffix(rawPrompt: string, allAnswers: Array<{ questionId: string; optionId: string }>, family: "text" | "image", previousPreview?: string, previousQuestions?: RefineRequest["previousQuestions"], hasImages?: boolean): string {
  const base = [
    "Synthesize the perfected prompt now, considering the user's intent and the following answers.",
    family === "image"
      ? "Target generation model: gemini-2.5-flash-image (image generation)."
      : "Target generation model: gemini-2.5-flash (text).",
    ...(hasImages
      ? [
          "- If reference image(s) are attached to this request, consider them as grounding visual context when drafting the prompt. These same images will also be sent to the gemini-2.5-flash-image generation step.",
        ]
      : []),
    "- The perfectedPrompt must be a single, descriptive paragraph in English.",
  ].join("\n");
  const answersBlock = `\nClarification Answers:\n${allAnswers.map((a) => `- ${a.questionId}: ${a.optionId}`).join("\n")}`;
  const priorPreviewBlock = previousPreview ? `\nPrevious Preview (context):\n"""\n${previousPreview}\n"""` : "";
  const priorQA = serializeQA(previousQuestions, allAnswers);
  const suffix = [base, answersBlock, priorPreviewBlock, priorQA].join("\n");
  try { console.debug("[refine][service] finalSuffix", suffix); } catch {}
  return suffix;
}

function coerceResponseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1));
      } catch {}
    }
    const arrStart = text.indexOf("[");
    const arrEnd = text.lastIndexOf("]");
    if (arrStart >= 0 && arrEnd > arrStart) {
      try {
        return JSON.parse(text.slice(arrStart, arrEnd + 1));
      } catch {}
    }
    throw new Error("MODEL_RETURNED_NON_JSON");
  }
}

export function buildUserContents(text: string, assets?: AssetRef[]) {
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

  // For multimodal, put image parts first, then instruction text, per docs
  if (imageParts.length > 0) {
    return [...imageParts, { text }];
  }
  return text;
}

function annotateRecommendedOptions(
  questions: Array<{
    id: string;
    text: string;
    options: Array<{ id: string; label: string; recommended?: boolean; why?: string }>
  }> | undefined,
  recommendedAnswers: Array<{ questionId: string; optionId: string }> | undefined
) {
  if (!questions || questions.length === 0) return questions;
  const recMap = new Map<string, string>((recommendedAnswers || []).map((r) => [r.questionId, r.optionId]));
  return questions.map((q) => {
    const recOptId = recMap.get(q.id);
    const hasAnyRecommended = q.options.some((o) => !!o.recommended);
    if (!recOptId || hasAnyRecommended) return q;
    return {
      ...q,
      options: q.options.map((o) => (o.id === recOptId ? { ...o, recommended: true } : o)),
    };
  });
}

function aggregateUsage(usages: Array<UsageMetadata | undefined>): UsageMetadata | undefined {
  const acc: UsageMetadata = {};
  let any = false;
  for (const u of usages) {
    if (!u) continue;
    any = true;
    if (typeof u.promptTokenCount === "number") acc.promptTokenCount = (acc.promptTokenCount ?? 0) + u.promptTokenCount;
    if (typeof u.candidatesTokenCount === "number") acc.candidatesTokenCount = (acc.candidatesTokenCount ?? 0) + u.candidatesTokenCount;
    if (typeof u.totalTokenCount === "number") acc.totalTokenCount = (acc.totalTokenCount ?? 0) + u.totalTokenCount;
    if (typeof u.cachedContentTokenCount === "number") acc.cachedContentTokenCount = (acc.cachedContentTokenCount ?? 0) + u.cachedContentTokenCount;
    if (typeof u.thoughtsTokenCount === "number") acc.thoughtsTokenCount = (acc.thoughtsTokenCount ?? 0) + u.thoughtsTokenCount;
  }
  return any ? acc : undefined;
}

export async function refine(req: RefineRequest): Promise<RefineResponse> {
  if (req.family !== "image") {
    throw new Error("IMAGE_ONLY_FOR_NOW");
  }

  const ai: GoogleGenAI = getGenAI();
  const persona = getPersonaForFamily(req.family);
  const hasImages = (req.context?.image?.assets?.length || 0) > 0;

  const thinkingBudget = Number.parseInt(process.env.REFINER_THINKING_BUDGET || "24576", 10);

  const modelName = "gemini-2.5-flash-lite";
  const mode = req.cache?.mode || getDefaultCacheMode();
  const ttlSeconds = req.cache?.ttlSeconds;
  const assetsDigest = buildAssetsDigest(req.context?.image?.assets);
  const computedKey = buildCacheKey({
    modelName,
    family: req.family,
    instructionPresetId: req.instructionPresetId,
    rawPrompt: req.rawPrompt,
    hasImages,
    assetsDigest,
  });
  const key = req.cache?.key || computedKey;

  let cachedContentName: string | undefined = req.cache?.cachedContentName;
  let cacheCreated = false;
  let cacheExpireTime: string | undefined;

  const useExplicit = mode === "explicit_per_conversation" || mode === "explicit_per_request";
  if (useExplicit) {
    // Guard against stale cache reuse: if the client's key does not match the computed key, ignore provided cache name
    if (req.cache?.key && req.cache.key !== computedKey) {
      try { console.debug("[refine][cache] key_mismatch_discard", { provided: req.cache.key, computed: computedKey, cachedContentName }); } catch {}
      cachedContentName = undefined;
    }
    try {
      const prefix = buildCachedPrefix(req, hasImages);
      const cachedContents = buildCachedContents(prefix, req.context?.image?.assets);
      if (req.cache?.forceRefresh) {
        cachedContentName = undefined;
      }
      const ensured = await ensureCache({
        ai,
        modelName,
        systemInstruction: persona,
        cachedPrefixContents: cachedContents,
        requestedName: cachedContentName,
        ttlSeconds,
      });
      cachedContentName = ensured.name;
      cacheCreated = ensured.created;
      cacheExpireTime = ensured.expireTime;
    } catch (err: unknown) {
      try { console.warn("[refine][cache] ensure_error", { key, error: (err as any)?.message }); } catch {}
      cachedContentName = undefined;
    }
  }

  const primaryContents = useExplicit && cachedContentName
    ? buildUserContents(buildPrimarySuffix(req), undefined)
    : buildUserContents(buildDirective(req, hasImages), req.context?.image?.assets);

  const response = await ai.models.generateContent({
    model: modelName,
    contents: primaryContents,
    config: (
      useExplicit && cachedContentName
        ? {
            cachedContent: cachedContentName,
            thinkingConfig: { thinkingBudget },
            responseMimeType: "application/json",
            responseSchema: refineResponseSchema,
            temperature: 0.6,
          }
        : {
            systemInstruction: persona,
            thinkingConfig: { thinkingBudget },
            responseMimeType: "application/json",
            responseSchema: refineResponseSchema,
            temperature: 0.6,
          }
    ) as any,
  });
  try { console.debug("[refine][service] primary.raw", response.text); } catch {}
  const primaryUsage = extractUsageMetadata(response);
  try { console.debug("[refine][service] primary.usage", primaryUsage); } catch {}

  const jsonUnknown = coerceResponseJson(response.text || "");
  const json = jsonUnknown as {
    status?: RefineResponse["status"]; previewPrompt?: string; perfectedPrompt?: string; questions?: Array<{ id: string; text: string; options: Array<{ id: string; label: string; recommended?: boolean; why?: string }> }>; recommendedAnswers?: Array<{ questionId: string; optionId: string }>; warnings?: string[]; error?: { code: string; message: string };
  };
  try { console.debug("[refine][service] primary.parsed", json); } catch {}

  const conversationId = req.conversationId || crypto.randomUUID();
  const revision = (req.answers?.length || 0) + 1;

  const status = json.status as RefineResponse["status"];
  if (status !== "ready" && status !== "needs_clarification" && status !== "error") {
    throw new Error("INVALID_MODEL_OUTPUT");
  }

  let previewPrompt = json.previewPrompt;
  let perfectedPrompt = json.perfectedPrompt;
  const userAnswers = req.answers || [];
  const recommended = json.recommendedAnswers || [];

  const merged: Record<string, string> = {};
  for (const a of recommended) merged[a.questionId] = a.optionId;
  for (const a of userAnswers) merged[a.questionId] = a.optionId;
  const assumed = Object.entries(merged).map(([questionId, optionId]) => ({ questionId, optionId }));
  try { console.debug("[refine][service] mergedAnswers", assumed); } catch {}

  const hasQuestions = !!json.questions && json.questions.length > 0;

  if (status === "needs_clarification" && hasQuestions && !previewPrompt) {
    const previewContents = useExplicit && cachedContentName
      ? buildUserContents(
          buildPreviewSuffix(
            req.rawPrompt,
            assumed,
            req.family,
            req.previousPreviewPrompt,
            req.previousQuestions,
            hasImages
          ),
          undefined
        )
      : buildUserContents(
          buildPreviewDirective(
            req.rawPrompt,
            assumed,
            req.family,
            req.previousPreviewPrompt,
            req.previousQuestions,
            hasImages
          ),
          req.context?.image?.assets
        );

    const previewResp = await ai.models.generateContent({
      model: modelName,
      contents: previewContents,
      config: (
        useExplicit && cachedContentName
          ? {
              cachedContent: cachedContentName,
              thinkingConfig: { thinkingBudget: Math.min(thinkingBudget, 2048) },
              responseMimeType: "application/json",
              responseSchema: previewOnlySchema,
              temperature: 0.4,
            }
          : {
              systemInstruction: persona,
              thinkingConfig: { thinkingBudget: Math.min(thinkingBudget, 2048) },
              responseMimeType: "application/json",
              responseSchema: previewOnlySchema,
              temperature: 0.4,
            }
      ) as any,
    });
    try { console.debug("[refine][service] preview.raw", previewResp.text); } catch {}
    const previewUsage = extractUsageMetadata(previewResp);
    try { console.debug("[refine][service] preview.usage", previewUsage); } catch {}
    const previewJson = coerceResponseJson(previewResp.text || "") as { previewPrompt?: string };
    try { console.debug("[refine][service] preview.parsed", previewJson); } catch {}
    if (previewJson.previewPrompt) previewPrompt = previewJson.previewPrompt;
    var usagePreviewVar: UsageMetadata | undefined = previewUsage;
  }

  if ((status === "ready" || !hasQuestions) && !perfectedPrompt) {
    const finalContents = useExplicit && cachedContentName
      ? buildUserContents(
          buildFinalSuffix(
            req.rawPrompt,
            assumed,
            req.family,
            req.previousPreviewPrompt,
            req.previousQuestions,
            hasImages
          ),
          undefined
        )
      : buildUserContents(
          buildFinalDirective(
            req.rawPrompt,
            assumed,
            req.family,
            req.previousPreviewPrompt,
            req.previousQuestions,
            hasImages
          ),
          req.context?.image?.assets
        );

    const finalResp = await ai.models.generateContent({
      model: modelName,
      contents: finalContents,
      config: (
        useExplicit && cachedContentName
          ? {
              cachedContent: cachedContentName,
              thinkingConfig: { thinkingBudget },
              responseMimeType: "application/json",
              responseSchema: finalOnlySchema,
              temperature: 0.6,
            }
          : {
              systemInstruction: persona,
              thinkingConfig: { thinkingBudget },
              responseMimeType: "application/json",
              responseSchema: finalOnlySchema,
              temperature: 0.6,
            }
      ) as any,
    });
    try { console.debug("[refine][service] final.raw", finalResp.text); } catch {}
    const finalUsage = extractUsageMetadata(finalResp);
    try { console.debug("[refine][service] final.usage", finalUsage); } catch {}
    const finalJson = coerceResponseJson(finalResp.text || "") as { perfectedPrompt?: string };
    try { console.debug("[refine][service] final.parsed", finalJson); } catch {}
    if (finalJson.perfectedPrompt) {
      perfectedPrompt = finalJson.perfectedPrompt;
    }
    var usageFinalVar: UsageMetadata | undefined = finalUsage;
  }

  if (!hasQuestions && !perfectedPrompt) {
    if (!previewPrompt && assumed.length > 0) {
      const previewFallbackContents = useExplicit && cachedContentName
        ? buildUserContents(
            buildPreviewSuffix(
              req.rawPrompt,
              assumed,
              req.family,
              req.previousPreviewPrompt,
              req.previousQuestions,
              hasImages
            ),
            undefined
          )
        : buildUserContents(
            buildPreviewDirective(
              req.rawPrompt,
              assumed,
              req.family,
              req.previousPreviewPrompt,
              req.previousQuestions,
              hasImages
            ),
            req.context?.image?.assets
          );

      const previewResp = await ai.models.generateContent({
        model: modelName,
        contents: previewFallbackContents,
        config: (
          useExplicit && cachedContentName
            ? {
                cachedContent: cachedContentName,
                thinkingConfig: { thinkingBudget: Math.min(thinkingBudget, 1024) },
                responseMimeType: "application/json",
                responseSchema: previewOnlySchema,
                temperature: 0.3,
              }
            : {
                systemInstruction: persona,
                thinkingConfig: { thinkingBudget: Math.min(thinkingBudget, 1024) },
                responseMimeType: "application/json",
                responseSchema: previewOnlySchema,
                temperature: 0.3,
              }
        ) as any,
      });
      try { console.debug("[refine][service] previewFallback.raw", previewResp.text); } catch {}
      const previewFallbackUsage = extractUsageMetadata(previewResp);
      try { console.debug("[refine][service] previewFallback.usage", previewFallbackUsage); } catch {}
      const pj = coerceResponseJson(previewResp.text || "") as { previewPrompt?: string };
      try { console.debug("[refine][service] previewFallback.parsed", pj); } catch {}
      if (pj.previewPrompt) previewPrompt = pj.previewPrompt;
      var usagePreviewFallbackVar: UsageMetadata | undefined = previewFallbackUsage;
    }
    perfectedPrompt = perfectedPrompt || previewPrompt || "";
  }

  const statusOut: RefineResponse["status"] = !hasQuestions ? "ready" : status;
  const usageBundle: RefineUsageBundle | undefined = (function () {
    const primary = primaryUsage;
    const preview = typeof usagePreviewVar !== "undefined" ? usagePreviewVar : undefined;
    const final = typeof usageFinalVar !== "undefined" ? usageFinalVar : undefined;
    const previewFallback = typeof usagePreviewFallbackVar !== "undefined" ? usagePreviewFallbackVar : undefined;
    const aggregate = aggregateUsage([primary, preview, final, previewFallback]);
    if (!primary && !preview && !final && !previewFallback) return undefined;
    return { primary, preview, final, previewFallback, aggregate } as RefineUsageBundle;
  })();

  const result: RefineResponse = {
    conversationId,
    revision,
    status: statusOut,
    previewPrompt,
    perfectedPrompt,
    questions: annotateRecommendedOptions(json.questions, json.recommendedAnswers),
    recommendedAnswers: json.recommendedAnswers,
    warnings: json.warnings,
    error: json.error,
    schemaVersion: "1.0",
    usage: usageBundle,
    cache: useExplicit && cachedContentName ? {
      mode: "explicit",
      cachedContentName,
      key,
      expireTime: cacheExpireTime,
      created: cacheCreated,
    } : (primaryUsage ? { mode: "implicit_only", usage: { totalTokenCount: primaryUsage.totalTokenCount, cachedTokens: undefined } as any } : undefined),
  };
  try { console.debug("[refine][service] outgoing", result); } catch {}

  if (useExplicit && cachedContentName) {
    if (statusOut === "needs_clarification") {
      await updateCacheTtl(ai, cachedContentName, ttlSeconds);
    } else if (statusOut === "ready" && shouldAutoDeleteOnReady()) {
      await deleteCache(ai, cachedContentName);
    }
  }

  return result;
}
