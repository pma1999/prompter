import { z } from "zod";
import { SessionData } from "@/domain/types";

const SESSION_STORAGE_KEY = "pp.sessions";

const ModelIdSchema = z.union([
  z.literal("gemini-2.5-pro"),
  z.literal("gemini-2.5-flash"),
  z.literal("gemini-2.5-flash-lite"),
  z.literal("gemini-2.5-flash-image"),
]);

const SessionMetaSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
  modelId: ModelIdSchema,
  family: z.union([z.literal("text"), z.literal("image")]),
  revision: z.number(),
});

const QuestionSchema = z.object({
  id: z.string(),
  text: z.string(),
  options: z.array(
    z.object({ id: z.string(), label: z.string(), recommended: z.boolean().optional(), why: z.string().optional() })
  ),
});

const SessionDataSchema: z.ZodType<SessionData> = z.object({
  meta: SessionMetaSchema,
  rawPrompt: z.string(),
  instructionPresetId: z.string(),
  previewPrompt: z.string().optional(),
  perfectedPrompt: z.string().optional(),
  questions: z.array(QuestionSchema).optional(),
  recommendedAnswers: z.array(z.object({ questionId: z.string(), optionId: z.string() })).optional(),
  answers: z.array(z.object({ questionId: z.string(), optionId: z.string() })).optional(),
});

export function loadSessions(): SessionData[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const validated: SessionData[] = [];
    for (const item of parsed) {
      const result = SessionDataSchema.safeParse(item);
      if (result.success) validated.push(result.data);
    }
    return validated;
  } catch {
    return [];
  }
}

export function saveSessions(sessions: SessionData[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessions));
}

export function upsertSession(next: SessionData) {
  const all = loadSessions();
  const idx = all.findIndex((s) => s.meta.id === next.meta.id);
  if (idx >= 0) {
    all[idx] = next;
  } else {
    all.unshift(next);
  }
  saveSessions(all);
}

export function deleteSession(id: string) {
  const all = loadSessions().filter((s) => s.meta.id !== id);
  saveSessions(all);
}

export function exportSession(session: SessionData): string {
  return JSON.stringify(session, null, 2);
}

export function importSession(json: string): SessionData | null {
  try {
    const parsed = JSON.parse(json);
    const result = SessionDataSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}
