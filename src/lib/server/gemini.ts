import { GoogleGenAI } from "@google/genai";

let _ai: GoogleGenAI | null = null;

export function getGenAI(): GoogleGenAI {
  if (_ai) return _ai;
  // Uses GEMINI_API_KEY from environment automatically if not provided
  _ai = new GoogleGenAI({});
  return _ai;
}
