import { ModelFamily, ModelId, ModelInfo } from "@/domain/types";

export const MODELS: ModelInfo[] = [
  {
    id: "gemini-2.5-pro",
    family: "text",
    label: "Gemini 2.5 Pro",
    description: "Advanced LLM for high-quality text prompts and reasoning.",
    capabilities: ["text"],
  },
  {
    id: "gemini-2.5-flash",
    family: "text",
    label: "Gemini 2.5 Flash",
    description: "Fast LLM for prompt refinement and low-latency use.",
    capabilities: ["text"],
  },
  {
    id: "gemini-2.5-flash-image",
    family: "image",
    label: "Gemini 2.5 Flash Image",
    description: "Natively multimodal image generation, editing, and composition.",
    capabilities: ["image", "text-to-image", "image-edit", "composition"],
  },
  {
    id: "sora-2-prompt-expert",
    family: "video",
    label: "Sora 2 Video Prompt Expert",
    description: "Expert prompt refinement for OpenAI Sora 2 video generation.",
    capabilities: ["video", "text-to-video", "image-to-video"],
  },
];

export function getDefaultModelId(family: ModelFamily): ModelId {
  if (family === "image") return "gemini-2.5-flash-image";
  if (family === "video") return "sora-2-prompt-expert";
  return "gemini-2.5-pro";
}
