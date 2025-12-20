"use client"

import { Button } from "@/components/ui/button";
import type { TokenCountResponse } from "@/domain/types";

export function ActionBar({ onRefine, onReset, onSave, onExport, busy, preflight }: { onRefine: () => void; onReset: () => void; onSave: () => void; onExport: () => void; busy: boolean; preflight?: TokenCountResponse; }) {
  return (
    <div className="fixed bottom-6 right-6 lg:right-10 z-50 flex items-center gap-4">
      {/* Preflight Stats (Floating Tag) */}
      {preflight && (
        <div className="hidden lg:flex flex-col items-end gap-1 animate-in slide-in-from-bottom-2 duration-300">
          <div className="text-[10px] font-mono text-muted-foreground uppercase bg-background/80 backdrop-blur border px-2 py-1 rounded-full shadow-lg">
            Est. Tokens: {preflight.totalTokens}
          </div>
        </div>
      )}

      {/* Main Action Group */}
      <div className="flex items-center gap-2 p-2 bg-background/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl ring-1 ring-white/10">
        <Button
          variant="ghost"
          onClick={onReset}
          disabled={busy}
          className="rounded-xl px-4 text-muted-foreground hover:text-foreground"
        >
          Reset
        </Button>
        <Button
          variant="ghost"
          onClick={onSave}
          disabled={busy}
          className="rounded-xl px-4"
        >
          Save
        </Button>

        <Button
          variant="ghost"
          onClick={onExport}
          disabled={busy}
          className="rounded-xl px-4"
        >
          Export
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        <Button
          onClick={onRefine}
          disabled={busy}
          className="rounded-xl px-8 h-12 text-base font-bold tracking-wide shadow-[0_0_20px_rgba(255,214,10,0.3)] hover:shadow-[0_0_30px_rgba(255,214,10,0.5)] transition-all"
        >
          {busy ? (
            <div className="flex items-center gap-2">
              <span className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              REFINING...
            </div>
          ) : (
            "REFINE PROMPT"
          )}
        </Button>
      </div>
    </div>
  );
}
