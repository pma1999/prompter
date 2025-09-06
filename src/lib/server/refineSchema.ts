import { Type } from "@google/genai";

export const refineResponseSchema = {
  type: Type.OBJECT,
  properties: {
    status: { type: Type.STRING, enum: ["ready", "needs_clarification", "error"] },
    previewPrompt: { type: Type.STRING },
    perfectedPrompt: { type: Type.STRING },
    questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          text: { type: Type.STRING },
          options: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                label: { type: Type.STRING },
                recommended: { type: Type.BOOLEAN },
                why: { type: Type.STRING },
              },
              required: ["id", "label"],
              propertyOrdering: ["id", "label", "recommended", "why"],
            },
          },
        },
        required: ["id", "text", "options"],
        propertyOrdering: ["id", "text", "options"],
      },
    },
    recommendedAnswers: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          questionId: { type: Type.STRING },
          optionId: { type: Type.STRING },
        },
        required: ["questionId", "optionId"],
        propertyOrdering: ["questionId", "optionId"],
      },
    },
    warnings: { type: Type.ARRAY, items: { type: Type.STRING } },
    error: {
      type: Type.OBJECT,
      properties: {
        code: { type: Type.STRING },
        message: { type: Type.STRING },
      },
      required: ["code", "message"],
      propertyOrdering: ["code", "message"],
    },
  },
  required: ["status"],
  propertyOrdering: [
    "status",
    "previewPrompt",
    "perfectedPrompt",
    "questions",
    "recommendedAnswers",
    "warnings",
    "error",
  ],
} as const;

export const previewOnlySchema = {
  type: Type.OBJECT,
  properties: {
    previewPrompt: { type: Type.STRING },
  },
  required: ["previewPrompt"],
  propertyOrdering: ["previewPrompt"],
} as const;

export const finalOnlySchema = {
  type: Type.OBJECT,
  properties: {
    perfectedPrompt: { type: Type.STRING },
  },
  required: ["perfectedPrompt"],
  propertyOrdering: ["perfectedPrompt"],
} as const;
