import { RefineRequest, RefineResponse } from "@/domain/types";

export async function postRefine(req: RefineRequest): Promise<RefineResponse> {
  try {
    console.debug("[refine][client] request", {
      conversationId: req.conversationId,
      family: req.family,
      modelId: req.modelId,
      cache: req.cache,
      hasPreviousPreview: !!req.previousPreviewPrompt,
      previousQuestions: req.previousQuestions?.map((q) => ({ id: q.id, text: q.text })) ?? [],
      answers: req.answers ?? [],
    });
  } catch {}

  const res = await fetch("/api/refine", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
    // Cookies (session id) are sent by default on same-origin; ensure no-cache to reflect auth status changes immediately
    cache: "no-store",
  });
  const json = await res.json();

  try {
    console.debug("[refine][client] response", {
      ok: res.ok,
      status: res.status,
      body: json,
    });
  } catch {}

  if (!res.ok) {
    const errMsg = json?.error?.message || `HTTP ${res.status}`;
    throw new Error(errMsg);
  }
  return json as RefineResponse;
}
