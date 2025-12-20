"use client"

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { estimateTextMetrics } from "@/lib/token";
import type { UsageMetadata } from "@/domain/types";

export function PreviewPromptCard({ value, usage, onCopy, onInsert, onChange }: { value?: string; usage?: UsageMetadata; onCopy: () => void; onInsert: () => void; onChange: (next: string) => void }) {
  if (!value) return null;
  const m = estimateTextMetrics(value);
  return (
    <div className="group relative">
      <div className="absolute inset-0 bg-primary/5 blur-xl group-hover:bg-primary/10 transition-colors" />
      <div className="glass-panel rounded-none border-l-2 border-l-primary/50 relative overflow-hidden">
        <div className="p-3 border-b border-white/5 flex items-center justify-between bg-black/20">
          <div className="font-mono text-[10px] uppercase tracking-widest text-primary/80">{"/// P-01 PREVIEW_SLATE"}</div>
          <div className="flex items-center gap-1">
            <div className="size-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] items-center text-muted-foreground font-mono">LIVE</span>
          </div>
        </div>

        <div className="p-4">
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-transparent border-0 focus-visible:ring-0 resize-y min-h-[120px] text-sm font-mono text-foreground/90 leading-relaxed custom-scrollbar p-0"
            spellCheck={false}
          />
        </div>

        <div className="p-2 border-t border-white/5 bg-black/20 flex items-center justify-between">
          <div className="text-[10px] font-mono text-muted-foreground/60 flex gap-3">
            <span>TOKENS: {usage?.totalTokenCount ?? (m.tokens || 0)}</span>
            <span>CHARS: {m.chars}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onInsert}
              className="text-[10px] uppercase tracking-wider hover:text-primary transition-colors px-2 py-1"
            >
              Insert
            </button>
            <button
              onClick={onCopy}
              className="text-[10px] uppercase tracking-wider bg-white/5 hover:bg-white/10 transition-colors px-3 py-1 text-primary"
            >
              Copy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PerfectedPromptCard({ value, usage, onChange }: { value?: string; usage?: UsageMetadata; onChange: (next: string) => void }) {
  if (!value) return null;
  const m = estimateTextMetrics(value);
  return (
    <div className="group relative mt-6 animate-in slide-in-from-right-4 duration-500 fade-in">
      {/* Glow effect */}
      <div className="absolute -inset-0.5 bg-gradient-to-br from-primary via-transparent to-primary opacity-20 blur-lg group-hover:opacity-30 transition-opacity" />

      <div className="glass-panel border border-primary/20 relative overflow-hidden bg-black/40">
        {/* Header */}
        <div className="p-3 border-b border-primary/20 flex items-center justify-between bg-black/40">
          <div className="font-display font-bold text-sm tracking-widest text-primary uppercase flex items-center gap-2">
            <span className="text-lg">✦</span>
            PERFECTED_OUTPUT
          </div>
          <div className="font-mono text-[10px] text-primary/60 border border-primary/20 px-1.5 py-0.5">
            CONFIDENCE: 99%
          </div>
        </div>

        {/* Content */}
        <div className="p-5 font-sans relative">
          <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none">
            <svg className="size-20" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="1" fill="none" />
              <path d="M50 10 L50 90 M10 50 L90 50" stroke="currentColor" strokeWidth="1" />
            </svg>
          </div>

          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-transparent border-0 focus-visible:ring-0 resize-y min-h-[240px] text-base leading-relaxed text-foreground p-0 relative z-10 font-medium selection:bg-primary/30"
            spellCheck={false}
          />
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-primary/10 bg-primary/5 flex flex-wrap items-center justify-between gap-3">
          <div className="text-[10px] font-mono text-muted-foreground flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="size-1 bg-primary rounded-full" />
              IN: {usage?.promptTokenCount ?? 0}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-1 bg-green-500 rounded-full" />
              OUT: {usage?.candidatesTokenCount ?? 0}
            </span>
            <span className="opacity-50">| TOTAL: {usage?.totalTokenCount ?? (m.tokens || 0)}</span>
          </div>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { navigator.clipboard.writeText("```\n" + value + "\n```"); toast.success("Copied as Markdown"); }}
              className="h-7 text-xs hover:bg-primary/10 hover:text-primary"
            >
              MD
            </Button>
            <Button
              size="sm"
              onClick={() => { navigator.clipboard.writeText(value); toast.success("Copied as text"); }}
              className="h-7 text-xs bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(255,214,10,0.4)]"
            >
              COPY RESULT
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
