"use client"

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { LeftSidebar } from "@/components/workspace/LeftSidebar";
import { ModelSwitch } from "@/components/workspace/ModelSwitch";
import { RawPromptInput } from "@/components/workspace/RawPromptInput";
import { ImageTemplatePicker } from "@/components/workspace/ImageTemplatePicker";
import { ImageReferenceUploader } from "@/components/workspace/ImageReferenceUploader";
import { ClarificationPanel } from "@/components/workspace/ClarificationPanel";
import { ActionBar } from "@/components/workspace/ActionBar";
import { PreviewPromptCard, PerfectedPromptCard } from "@/components/workspace/PreviewAndFinal";
import { MODELS, getDefaultModelId } from "@/lib/models";
import { ModelId, QuestionItem, SessionData, AssetRef } from "@/domain/types";
import { GuidePanel } from "@/components/workspace/GuidePanel";
import { toast } from "sonner";
import { upsertSession, exportSession, importSession } from "@/lib/persistence";
import { subscribeCommands } from "@/lib/commandBus";
import { postRefine } from "@/lib/api/refine";
import { postCountTokens } from "@/lib/api/tokens";
import type { UsageMetadata, RefineUsageBundle, TokenCountResponse, RefineRequest } from "@/domain/types";
import { getAuthStatus } from "@/lib/api/auth";

export function Workspace() {
  const [modelId, setModelId] = useState<ModelId>(getDefaultModelId("image"));
  const family = useMemo(() => MODELS.find((m) => m.id === modelId)!.family, [modelId]);
  const presetId = family === "image" ? "image-virtuoso" : "llm-refiner";
  const [raw, setRaw] = useState("");

  const [preview, setPreview] = useState<string | undefined>(undefined);
  const [finalPrompt, setFinalPrompt] = useState<string | undefined>(undefined);
  const [questions, setQuestions] = useState<QuestionItem[] | undefined>(undefined);
  const [answers, setAnswers] = useState<Record<string, string | undefined>>({});
  const [busy, setBusy] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(undefined);
  const [currentSessionName, setCurrentSessionName] = useState<string>("Untitled Session");
  const [imageAssets, setImageAssets] = useState<AssetRef[]>([]);
  const [cacheName, setCacheName] = useState<string | undefined>(undefined);
  const [cacheKey, setCacheKey] = useState<string | undefined>(undefined);
  const [usage, setUsage] = useState<RefineUsageBundle | undefined>(undefined);
  const [cumulativeUsage, setCumulativeUsage] = useState<UsageMetadata | undefined>(undefined);
  const [preflight, setPreflight] = useState<TokenCountResponse | undefined>(undefined);
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  useEffect(() => {
    (async () => {
      try {
        const s = await getAuthStatus();
        setHasApiKey(s.connected);
      } catch {
        setHasApiKey(false);
      }
    })();
  }, []);



  useEffect(() => {
    return subscribeCommands(async (cmd) => {
      if (cmd === "new-session") {
        const id = crypto.randomUUID();
        const now = Date.now();
        const s: SessionData = {
          meta: { id, name: "Untitled Session", createdAt: now, updatedAt: now, modelId, family, revision: 0 },
          rawPrompt: "",
          instructionPresetId: presetId,
        };
        upsertSession(s);
        setCurrentSessionId(id);
        setCurrentSessionName(s.meta.name);
        setRaw("");
        setPreview(undefined);
        setFinalPrompt(undefined);
        setQuestions(undefined);
        setAnswers({});
        setImageAssets([]);
        setCacheName(undefined);
        setCacheKey(undefined);
        toast.success("New session created");
      }
      if (cmd === "import-session") {
        const text = await navigator.clipboard.readText();
        const s = importSession(text);
        if (!s) return toast.error("Clipboard does not contain a valid session JSON");
        upsertSession(s);
        setCurrentSessionId(s.meta.id);
        setCurrentSessionName(s.meta.name);
        setModelId(s.meta.modelId);
        setRaw(s.rawPrompt);
        setPreview(s.previewPrompt);
        setFinalPrompt(s.perfectedPrompt);
        setQuestions(s.questions);
        const ans: Record<string, string | undefined> = {};
        s.answers?.forEach((a) => (ans[a.questionId] = a.optionId));
        setAnswers(ans);
        setImageAssets([]);
        setCacheName(undefined);
        setCacheKey(undefined);
        toast.success("Imported session from clipboard");
      }
      if (cmd === "export-session") {
        const data: SessionData = {
          meta: {
            id: currentSessionId ?? crypto.randomUUID(),
            name: currentSessionName,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            modelId,
            family,
            revision: 0,
          },
          rawPrompt: raw,
          instructionPresetId: presetId,
          previewPrompt: preview,
          perfectedPrompt: finalPrompt,
          questions,
          answers: Object.entries(answers).map(([questionId, optionId]) => ({ questionId, optionId: optionId ?? "" })),
        };
        await navigator.clipboard.writeText(exportSession(data));
        toast.success("Exported session to clipboard");
      }
      if (cmd === "open-docs") {
        window.open("https://ai.google.dev/gemini-api", "_blank");
      }
      if (cmd === "open-shortcuts") {
        toast.info("Shortcuts: Ctrl/⌘+K Command Palette, Ctrl/⌘+Enter Refine");
      }
      if (cmd === "api-key-connected") {
        setHasApiKey(true);
        // Avoid reusing caches from a different key
        setCacheName(undefined);
        setCacheKey(undefined);
      }
      if (cmd === "api-key-disconnected") {
        setHasApiKey(false);
        setCacheName(undefined);
        setCacheKey(undefined);
      }
    });
  }, [modelId, family, presetId, raw, preview, finalPrompt, questions, answers, currentSessionId, currentSessionName]);

  function handleModelChange(id: ModelId) {
    setModelId(id);
    setPreview(undefined);
    setFinalPrompt(undefined);
    setQuestions(undefined);
    setAnswers({});
    setCacheName(undefined);
    setCacheKey(undefined);
    setUsage(undefined);
    setCumulativeUsage(undefined);
    setPreflight(undefined);
  }

  // Preflight token counting (debounced on raw/model/assets/answers/preview/questions/cache changes)
  useEffect(() => {
    let cancelled = false;
    const handler = setTimeout(async () => {
      try {
        if (!raw.trim()) { setPreflight(undefined); return; }
        if (!hasApiKey) { setPreflight(undefined); return; }
        const req: RefineRequest & { includeCachedPrefix?: boolean } = {
          conversationId: currentSessionId,
          modelId,
          family,
          rawPrompt: raw,
          instructionPresetId: presetId,
          answers: Object.entries(answers).filter(([, v]) => v).map(([questionId, optionId]) => ({ questionId, optionId: optionId! })),
          previousPreviewPrompt: preview,
          previousQuestions: questions,
          context: imageAssets.length ? { image: { assets: imageAssets } } : undefined,
          cache: { mode: "explicit_per_conversation", cachedContentName: cacheName, key: cacheKey },
          includeCachedPrefix: true,
        };
        const resp = await postCountTokens(req);
        if (!cancelled) setPreflight(resp);
      } catch {
        if (!cancelled) setPreflight(undefined);
      }
    }, 400);
    return () => { cancelled = true; clearTimeout(handler); };
  }, [raw, modelId, family, presetId, answers, preview, questions, imageAssets, cacheName, cacheKey, currentSessionId, hasApiKey]);

  function handleInsertTemplate(text: string) {
    setRaw((r) => (r ? r + "\n\n" + text : text));
  }

  async function onRefine() {
    if (!raw.trim()) {
      toast.error("Please enter your raw prompt.");
      return;
    }
    if (!hasApiKey) {
      try {
        const s = await getAuthStatus();
        if (s.connected) {
          setHasApiKey(true);
        } else {
          toast.error("Connect your Gemini API key to continue.");
          return;
        }
      } catch {
        toast.error("Connect your Gemini API key to continue.");
        return;
      }
    }
    if (family !== "image") {
      toast.error("This version currently supports Image prompt refinement only.");
      return;
    }
    setBusy(true);
    try {
      const resp = await postRefine({
        conversationId: currentSessionId,
        modelId,
        family,
        rawPrompt: raw,
        instructionPresetId: presetId,
        answers: Object.entries(answers)
          .filter(([, v]) => v)
          .map(([questionId, optionId]) => ({ questionId, optionId: optionId! })),
        allowPartialAnswers: true,
        previousPreviewPrompt: preview,
        previousQuestions: questions,
        context: imageAssets.length ? { image: { assets: imageAssets } } : undefined,
        cache: { mode: "explicit_per_conversation", cachedContentName: cacheName, key: cacheKey },
      });

      setPreview(resp.previewPrompt);
      setFinalPrompt(resp.perfectedPrompt);
      setQuestions((prev) => (typeof resp.questions !== "undefined" ? resp.questions : prev));
      setUsage(resp.usage);
      if (resp.usage?.aggregate) {
        const a = resp.usage.aggregate;
        setCumulativeUsage((prev) => {
          const base: UsageMetadata = prev ? { ...prev } : {};
          if (typeof a.promptTokenCount === "number") base.promptTokenCount = (base.promptTokenCount ?? 0) + a.promptTokenCount;
          if (typeof a.candidatesTokenCount === "number") base.candidatesTokenCount = (base.candidatesTokenCount ?? 0) + a.candidatesTokenCount;
          if (typeof a.totalTokenCount === "number") base.totalTokenCount = (base.totalTokenCount ?? 0) + a.totalTokenCount;
          if (typeof a.cachedContentTokenCount === "number") base.cachedContentTokenCount = (base.cachedContentTokenCount ?? 0) + a.cachedContentTokenCount;
          if (typeof a.thoughtsTokenCount === "number") base.thoughtsTokenCount = (base.thoughtsTokenCount ?? 0) + a.thoughtsTokenCount;
          return base;
        });
      }

      const id = resp.conversationId;
      setCurrentSessionId(id);
      const now = Date.now();
      const session: SessionData = {
        meta: { id, name: currentSessionName, createdAt: now, updatedAt: now, modelId, family, revision: resp.revision },
        rawPrompt: raw,
        instructionPresetId: presetId,
        previewPrompt: resp.previewPrompt,
        perfectedPrompt: resp.perfectedPrompt,
        questions: resp.questions,
        recommendedAnswers: resp.recommendedAnswers,
        answers: Object.entries(answers).filter(([, v]) => v).map(([questionId, optionId]) => ({ questionId, optionId: optionId! })),
      };
      upsertSession(session);

      // Persist cache for this conversation if explicit cache was used
      if (resp.cache?.mode === "explicit") {
        setCacheName(resp.cache.cachedContentName);
        setCacheKey(resp.cache.key);
      } else {
        setCacheName(undefined);
        setCacheKey(undefined);
      }

      if (resp.status === "ready" && resp.perfectedPrompt) {
        toast.success("Perfected prompt ready");
        // Keep clarifications, images, and conversation context so user can edit and re-refine
      } else if (resp.status === "needs_clarification") {
        toast.message("Answer a few clarifying questions to refine further");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to refine";
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  function onAnswer(questionId: string, optionId: string) {
    setAnswers((a) => ({ ...a, [questionId]: optionId }));
  }

  function onReset() {
    setRaw("");
    setPreview(undefined);
    setFinalPrompt(undefined);
    setQuestions(undefined);
    setAnswers({});
    setCurrentSessionId(undefined);
    setImageAssets([]);
    setCacheName(undefined);
    setCacheKey(undefined);
    setUsage(undefined);
    setCumulativeUsage(undefined);
    setPreflight(undefined);
  }

  function onSave() {
    const id = currentSessionId ?? crypto.randomUUID();
    const now = Date.now();
    const data: SessionData = {
      meta: { id, name: currentSessionName, createdAt: now, updatedAt: now, modelId, family, revision: 0 },
      rawPrompt: raw,
      instructionPresetId: presetId,
      previewPrompt: preview,
      perfectedPrompt: finalPrompt,
      questions,
      answers: Object.entries(answers).map(([questionId, optionId]) => ({ questionId, optionId: optionId ?? "" })),
    };
    upsertSession(data);
    setCurrentSessionId(id);
    toast.success("Session saved");
  }

  function onExport() {
    const data = { modelId, presetId, raw, preview, finalPrompt, questions, answers };
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    toast.success("Exported to clipboard");
  }

  function onCopyPreview() {
    if (preview) {
      navigator.clipboard.writeText(preview);
      toast.success("Preview copied");
    }
  }

  function onSelectSession(s: SessionData) {
    setModelId(s.meta.modelId);
    setRaw(s.rawPrompt);
    setPreview(s.previewPrompt);
    setFinalPrompt(s.perfectedPrompt);
    setQuestions(s.questions);
    const ans: Record<string, string | undefined> = {};
    s.answers?.forEach((a) => (ans[a.questionId] = a.optionId));
    setAnswers(ans);
    setCurrentSessionId(s.meta.id);
    setCurrentSessionName(s.meta.name);
  }

  return (
    <AppShell left={<LeftSidebar onSelect={onSelectSession} />} center={(
      <div className="space-y-4">
        <ModelSwitch value={modelId} onChange={handleModelChange} />
        <GuidePanel family={family} />
        {family === "image" && <ImageTemplatePicker onInsert={handleInsertTemplate} />}
        {family === "image" && (
          <ImageReferenceUploader assets={imageAssets} onChangeAssets={setImageAssets} />
        )}
        <RawPromptInput value={raw} onChange={setRaw} onSubmit={onRefine} placeholder={family === "image" ? "Describe your vision… (Purpose, subject, lighting, camera, mood)" : "Describe your goal… (Audience, constraints, desired format)"} />
        {!hasApiKey && (
          <div className="text-sm text-amber-600 dark:text-amber-500">Connect your Gemini API key using the button in the top right to enable refinement.</div>
        )}
        {questions && <ClarificationPanel questions={questions} answers={answers} onAnswer={onAnswer} />}
        <ActionBar onRefine={onRefine} onReset={onReset} onSave={onSave} onExport={onExport} busy={busy} preflight={preflight} />
        {/* Mobile outputs inline (desktop uses right column) */}
        <div className="lg:hidden space-y-4">
          <PreviewPromptCard value={preview} usage={usage?.preview || usage?.primary} onCopy={onCopyPreview} onInsert={() => setRaw(preview || "")} />
          <PerfectedPromptCard value={finalPrompt} usage={cumulativeUsage || usage?.aggregate || usage?.final || usage?.primary} />
        </div>
      </div>
    )} right={(
      <div>
        <PreviewPromptCard value={preview} usage={usage?.preview || usage?.primary} onCopy={onCopyPreview} onInsert={() => setRaw(preview || "")} />
        <PerfectedPromptCard value={finalPrompt} usage={cumulativeUsage || usage?.aggregate || usage?.final || usage?.primary} />
      </div>
    )} />
  );
}
