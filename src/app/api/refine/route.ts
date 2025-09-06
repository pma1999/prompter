import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { refine } from "@/lib/server/refineService";
import { createGenAI } from "@/lib/server/gemini";
import { getApiKeyForSession, getApiKeyFromCookies, getSessionExpiry } from "@/lib/server/keyStore";
import { isEncryptedCookieEnabled, readByokCookies, setSessionCookie } from "@/lib/server/cookies";

export const runtime = "nodejs";
export const preferredRegion = "home";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const CacheSchema = z
  .object({
    mode: z.enum(["off", "implicit_only", "explicit_per_request", "explicit_per_conversation"]).optional(),
    cachedContentName: z.string().optional(),
    key: z.string().optional(),
    ttlSeconds: z.number().int().positive().optional(),
    forceRefresh: z.boolean().optional(),
  })
  .optional();

const AssetRefSchema = z
  .object({
    id: z.string().optional(),
    name: z.string(),
    mimeType: z.string(),
    sizeBytes: z.number().int().positive().optional(),
    source: z.enum(["uploaded", "url"]),
    url: z.string().url().optional(),
    dataUri: z.string().startsWith("data:").optional(),
  })
  .superRefine((val, ctx) => {
    if (val.source === "uploaded" && !val.dataUri) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "dataUri required for uploaded assets" });
    }
    if (val.source === "url" && !val.url) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "url required for url assets" });
    }
  });

const RefineRequestSchema = z.object({
  conversationId: z.string().uuid().optional(),
  modelId: z.enum(["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.5-flash-image"]),
  family: z.enum(["text", "image"]),
  rawPrompt: z.string().min(1),
  instructionPresetId: z.string(),
  answers: z.array(z.object({ questionId: z.string(), optionId: z.string() })).optional(),
  allowPartialAnswers: z.boolean().optional(),
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
  cache: CacheSchema,
  client: z.object({ appVersion: z.string().optional(), schemaVersion: z.string().optional() }).optional(),
});

export async function POST(req: NextRequest) {
  let payload: unknown;
  try {
    payload = await req.json();
    console.debug("[refine][route] incoming", {
      // Log non-sensitive metadata only
      hasBody: !!payload,
    });
    const parsed = RefineRequestSchema.safeParse(payload);
    if (!parsed.success) {
      console.warn("[refine][route] validation_error", parsed.error.issues);
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: parsed.error.message } },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const { sessionId, enc } = readByokCookies(req);
    try { console.debug("[byok][refine] cookie", { hasCookie: !!sessionId, cookieLen: sessionId?.length }); } catch {}
    const apiKey = getApiKeyFromCookies(sessionId, isEncryptedCookieEnabled() ? enc : undefined, { touch: true });
    if (!apiKey) {
      try { console.warn("[byok][refine] missing_api_key"); } catch {}
      return NextResponse.json(
        { error: { code: "MISSING_API_KEY", message: "Please connect your Gemini API key." } },
        { status: 401 }
      );
    }
    const ai = createGenAI(apiKey);
    const result = await refine(ai, data as unknown as import("@/domain/types").RefineRequest);
    console.debug("[refine][route] outgoing", {
      ok: true,
      status: result.status,
      conversationId: result.conversationId,
    });
    const res = NextResponse.json(result);
    // Align cookie TTL with server-side sliding TTL if applicable
    if (sessionId) {
      const exp = getSessionExpiry(sessionId);
      if (exp && exp > Date.now()) {
        setSessionCookie(res, sessionId, exp - Date.now());
      }
    }
    return res;
  } catch (err: unknown) {
    const e = err as { message?: string };
    console.error("[refine][route] error", { error: e?.message });
    const code = e.message === "IMAGE_ONLY_FOR_NOW" ? 400 : 502;
    const message = e.message || "Internal error";
    return NextResponse.json(
      {
        conversationId: crypto.randomUUID(),
        revision: 0,
        status: "error",
        error: { code: code === 400 ? "NOT_IMPLEMENTED" : "UPSTREAM_ERROR", message },
        schemaVersion: "1.0",
      },
      { status: code }
    );
  }
}
