import { GoogleGenAI } from "@google/genai";

// Factory that creates a GoogleGenAI client using the provided API key.
// BYOK: never rely on environment; require apiKey per request/session.
export function createGenAI(apiKey: string): GoogleGenAI {
  if (!apiKey || typeof apiKey !== "string" || apiKey.length < 20) {
    throw new Error("MISSING_API_KEY");
  }
  return new GoogleGenAI({ apiKey });
}
