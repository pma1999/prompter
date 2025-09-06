import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { countTokensForRefineNextTurn } from "@/lib/server/tokenService";
import { createGenAI } from "@/lib/server/gemini";
import { getApiKeyForSession } from "@/lib/server/keyStore";

const COOKIE_NAME = "pp.byok.sid";
import type { RefineRequest } from "@/domain/types";

export const runtime = "nodejs";
export const preferredRegion = "home";
export const dynamic = "force-dynamic";

const AssetRefSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number().int().positive().optional(),
  source: z.enum(["uploaded", "url"]),
  url: z.string().url().optional(),
  dataUri: z.string().startsWith("data:").optional(),
});

const RefineCountSchema = z.object({
  conversationId: z.string().uuid().optional(),
  modelId: z.enum(["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.5-flash-image"]),
  family: z.enum(["text", "image"]),
  rawPrompt: z.string().min(1),
  instructionPresetId: z.string(),
  answers: z.array(z.object({ questionId: z.string(), optionId: z.string() })).optional(),
  previousPreviewPrompt: z.string().optional(),
  previousQuestions: z
    .array(
      z.object({
        id: z.string(),
        text: z.string(),
        options: z.array(z.object({ id: z.string(), label: z.string(), recommended: z.boolean().optional(), why: z.string().optional() })),
      })
    )
    .optional(),
  context: z
    .object({
      image: z
        .object({
          workflow: z.enum(["generate", "edit", "compose"]).optional(),
          assets: z.array(AssetRefSchema).max(4).optional(),
        })
        .optional(),
    })
    .optional(),
  cache: z
    .object({
      mode: z.enum(["off", "implicit_only", "explicit_per_request", "explicit_per_conversation"]).optional(),
      cachedContentName: z.string().optional(),
      key: z.string().optional(),
      ttlSeconds: z.number().int().positive().optional(),
      forceRefresh: z.boolean().optional(),
    })
    .optional(),
  includeCachedPrefix: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  let payload: unknown;
  try {
    payload = await req.json();
    const parsed = RefineCountSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ error: { code: "BAD_REQUEST", message: parsed.error.message } }, { status: 400 });
    }
    const sessionId = req.cookies.get(COOKIE_NAME)?.value;
    try { console.debug("[byok][tokens] cookie", { hasCookie: !!sessionId, cookieLen: sessionId?.length }); } catch {}
    const apiKey = getApiKeyForSession(sessionId, { touch: true });
    if (!apiKey) {
      try { console.warn("[byok][tokens] missing_api_key"); } catch {}
      return NextResponse.json({ error: { code: "MISSING_API_KEY", message: "Please connect your Gemini API key." } }, { status: 401 });
    }
    const ai = createGenAI(apiKey);
    const result = await countTokensForRefineNextTurn(ai, parsed.data as RefineRequest & { includeCachedPrefix?: boolean });
    return NextResponse.json(result);
  } catch (err: unknown) {
    const e = err as { message?: string };
    return NextResponse.json({ error: { code: "UPSTREAM_ERROR", message: e?.message || "Internal error" } }, { status: 502 });
  }
}


