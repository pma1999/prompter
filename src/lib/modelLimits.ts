import { ModelId } from "@/domain/types";

export interface ModelTokenBudget {
  maxInputTokens?: number;
  maxOutputTokens?: number;
  maxTotalTokens?: number;
}

function envInt(name: string): number | undefined {
  const v = process.env[name as keyof NodeJS.ProcessEnv];
  if (!v) return undefined;
  const n = Number.parseInt(String(v), 10);
  return Number.isFinite(n) ? n : undefined;
}

function keyFor(id: ModelId, kind: string): string {
  const norm = id.toUpperCase().replace(/[^A-Z0-9]+/g, "_");
  return `NEXT_PUBLIC_${norm}_${kind}`;
}

export function getModelTokenBudget(id: ModelId): ModelTokenBudget {
  return {
    maxInputTokens: envInt(keyFor(id, "MAX_INPUT_TOKENS")),
    maxOutputTokens: envInt(keyFor(id, "MAX_OUTPUT_TOKENS")),
    maxTotalTokens: envInt(keyFor(id, "MAX_TOTAL_TOKENS")),
  };
}


