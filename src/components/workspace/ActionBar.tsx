"use client"

import { Button } from "@/components/ui/button";
import type { TokenCountResponse } from "@/domain/types";

export function ActionBar({ onRefine, onReset, onSave, onExport, busy, preflight }: { onRefine: () => void; onReset: () => void; onSave: () => void; onExport: () => void; busy: boolean; preflight?: TokenCountResponse; }) {
  // We don't know the modelId here; keep this component simple and only render the metric without heavy logic.
  return (
    <div className="flex items-center gap-2">
      <Button onClick={onRefine} disabled={busy}>{busy ? "Refining…" : "Refine"}</Button>
      <Button variant="secondary" onClick={onSave} disabled={busy}>Save</Button>
      <Button variant="ghost" onClick={onReset} disabled={busy}>Reset</Button>
      <div className="flex-1" />
      {preflight && (
        <div className="text-xs text-muted-foreground mr-2">
          Next call: input {preflight.totalTokens}{typeof preflight.cachedContentTokenCount === "number" ? ` • cached prefix ${preflight.cachedContentTokenCount}` : ""}
        </div>
      )}
      <Button variant="outline" onClick={onExport} disabled={busy}>Export</Button>
    </div>
  );
}
