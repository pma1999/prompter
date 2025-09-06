"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { estimateTextMetrics } from "@/lib/token";
import type { UsageMetadata } from "@/domain/types";

export function PreviewPromptCard({ value, usage, onCopy, onInsert }: { value?: string; usage?: UsageMetadata; onCopy: () => void; onInsert: () => void }) {
  if (!value) return null;
  const m = estimateTextMetrics(value);
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-sm">Preview Prompt (Based on recommended choices)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <pre className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-md max-h-[320px] overflow-auto">{value}</pre>
        <div className="text-xs text-muted-foreground">
          {typeof usage?.cachedContentTokenCount === "number" && (
            <span>Cached {usage.cachedContentTokenCount} • </span>
          )}
          <span>Input {usage?.promptTokenCount ?? 0} • Output {usage?.candidatesTokenCount ?? 0} • Thoughts {usage?.thoughtsTokenCount ?? 0} • Total {usage?.totalTokenCount ?? (m.tokens || 0)}</span>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={onCopy}>Copy</Button>
          <Button variant="ghost" size="sm" onClick={onInsert}>Insert into Raw</Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function PerfectedPromptCard({ value, usage }: { value?: string; usage?: UsageMetadata }) {
  if (!value) return null;
  const m = estimateTextMetrics(value);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">The Perfected Prompt</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <pre className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-md max-h-[420px] overflow-auto">{value}</pre>
        <div className="text-xs text-muted-foreground">
          {typeof usage?.cachedContentTokenCount === "number" && (
            <span>Cached {usage.cachedContentTokenCount} • </span>
          )}
          <span>Input {usage?.promptTokenCount ?? 0} • Output {usage?.candidatesTokenCount ?? 0} • Thoughts {usage?.thoughtsTokenCount ?? 0} • Total {usage?.totalTokenCount ?? (m.tokens || 0)}</span>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => { navigator.clipboard.writeText(value); toast.success("Copied as text"); }}>Copy</Button>
          <Button variant="secondary" size="sm" onClick={() => { navigator.clipboard.writeText("```\n" + value + "\n```"); toast.success("Copied as Markdown"); }}>Copy as Markdown</Button>
        </div>
        <Separator />
        <div className="text-xs text-muted-foreground">Use directly in your model. Always in English, single paragraph.</div>
      </CardContent>
    </Card>
  );
}
