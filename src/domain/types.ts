export type ModelFamily = "text" | "image";

export type ModelId =
  | "gemini-2.5-pro"
  | "gemini-2.5-flash"
  | "gemini-2.5-flash-lite"
  | "gemini-2.5-flash-image";

export interface ModelInfo {
  id: ModelId;
  family: ModelFamily;
  label: string;
  description: string;
  capabilities: string[];
}

export interface InstructionPreset {
  id: string;
  label: string;
  description: string;
  persona: string;
  family: ModelFamily | "any";
}

export interface AssetRef {
  id?: string;
  name: string;
  mimeType: string;
  sizeBytes?: number;
  source: "uploaded" | "url";
  url?: string;
  // Data URI for inline small images: e.g., "data:image/png;base64,...."
  dataUri?: string;
}

export interface RefineRequestContextImage {
  workflow?: "generate" | "edit" | "compose";
  assets?: AssetRef[];
}

export interface RefineRequest {
  conversationId?: string;
  modelId: ModelId;
  family: ModelFamily;
  rawPrompt: string;
  instructionPresetId: string;
  answers?: Array<{ questionId: string; optionId: string }>;
  allowPartialAnswers?: boolean;
  // Optional prior turn context to ground the model like a conversation
  previousPreviewPrompt?: string;
  previousQuestions?: QuestionItem[];
  context?: {
    image?: RefineRequestContextImage;
  };
  // Optional caching preferences/metadata
  cache?: {
    mode?: "off" | "implicit_only" | "explicit_per_request" | "explicit_per_conversation";
    cachedContentName?: string;
    key?: string;
    ttlSeconds?: number;
    forceRefresh?: boolean;
  };
  client?: { appVersion?: string; schemaVersion?: string };
}

export interface QuestionOption {
  id: string;
  label: string;
  recommended?: boolean;
  why?: string;
}

export interface QuestionItem {
  id: string;
  text: string;
  options: QuestionOption[];
}

export type RefineStatus = "ready" | "needs_clarification" | "error";

export interface ModalityTokenCount {
  modality: string;
  tokenCount: number;
}

export interface UsageMetadata {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  totalTokenCount?: number;
  cachedContentTokenCount?: number;
  thoughtsTokenCount?: number;
  promptTokensDetails?: ModalityTokenCount[];
  cacheTokensDetails?: ModalityTokenCount[];
}

export interface RefineUsageBundle {
  primary?: UsageMetadata;
  preview?: UsageMetadata;
  final?: UsageMetadata;
  previewFallback?: UsageMetadata;
  aggregate?: UsageMetadata;
}

export interface RefineResponse {
  conversationId: string;
  revision: number;
  status: RefineStatus;
  previewPrompt?: string;
  perfectedPrompt?: string;
  questions?: QuestionItem[];
  recommendedAnswers?: Array<{ questionId: string; optionId: string }>;
  warnings?: string[];
  error?: { code: string; message: string };
  schemaVersion: string;
  usage?: RefineUsageBundle;
  // Optional caching metadata returned by server for client reuse
  cache?: {
    mode: "implicit_only" | "explicit";
    cachedContentName?: string;
    key?: string;
    expireTime?: string;
    created?: boolean;
    usage?: { cachedTokens?: number; totalTokenCount?: number };
  };
}

export interface TokenCountResponse {
  totalTokens: number;
  cachedContentTokenCount?: number;
  promptTokensDetails?: ModalityTokenCount[];
  cacheTokensDetails?: ModalityTokenCount[];
}

export interface SessionMeta {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  modelId: ModelId;
  family: ModelFamily;
  revision: number;
}

export interface SessionData {
  meta: SessionMeta;
  rawPrompt: string;
  instructionPresetId: string;
  previewPrompt?: string;
  perfectedPrompt?: string;
  questions?: QuestionItem[];
  recommendedAnswers?: Array<{ questionId: string; optionId: string }>;
  answers?: Array<{ questionId: string; optionId: string }>;
}
