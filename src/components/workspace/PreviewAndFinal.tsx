"use client"

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { estimateTextMetrics } from "@/lib/token";
import { Copy, FileCode, ArrowDownToLine } from "lucide-react";
import type { UsageMetadata } from "@/domain/types";

export function PreviewPromptCard({
  value,
  usage,
  onCopy,
  onInsert,
  onChange,
}: {
  value?: string;
  usage?: UsageMetadata;
  onCopy: () => void;
  onInsert: () => void;
  onChange: (next: string) => void;
}) {
  if (!value) return null;
  const m = estimateTextMetrics(value);

  return (
    <div className="group relative">
      <div className="absolute inset-0 bg-primary/5 blur-xl group-hover:bg-primary/10 transition-colors" />
      <div className="glass-panel rounded-none sm:rounded-lg border-l-2 border-l-primary/50 relative overflow-hidden">
        {/* Header */}
        <div className="p-2 sm:p-3 border-b border-white/5 flex items-center justify-between bg-black/20">
          <div className="font-mono text-[9px] sm:text-[10px] uppercase tracking-widest text-primary/80 truncate">
            <span className="hidden xs:inline">{"/// P-01 "}</span>PREVIEW
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <div className="size-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[9px] sm:text-[10px] text-muted-foreground font-mono">LIVE</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-4">
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-transparent border-0 focus-visible:ring-0 resize-y min-h-[100px] sm:min-h-[120px] text-xs sm:text-sm font-mono text-foreground/90 leading-relaxed custom-scrollbar p-0"
            spellCheck={false}
          />
        </div>

        {/* Footer */}
        <div className="p-2 sm:p-2.5 border-t border-white/5 bg-black/20 flex items-center justify-between gap-2">
          {/* Stats */}
          <div className="text-[9px] sm:text-[10px] font-mono text-muted-foreground/60 flex gap-2 sm:gap-3 truncate">
            <span>
              <span className="hidden xs:inline">TOKENS: </span>
              <span className="xs:hidden">T:</span>
              {usage?.totalTokenCount ?? (m.tokens || 0)}
            </span>
            <span className="hidden xs:inline">CHARS: {m.chars}</span>
          </div>

          {/* Actions */}
          <div className="flex gap-1 sm:gap-2 flex-shrink-0">
            <button
              onClick={onInsert}
              className="text-[10px] sm:text-[11px] uppercase tracking-wider hover:text-primary transition-colors px-2 py-1.5 sm:px-2 sm:py-1 rounded touch-target-sm flex items-center gap-1"
            >
              <ArrowDownToLine className="size-3 sm:hidden" />
              <span className="hidden sm:inline">Insert</span>
            </button>
            <button
              onClick={onCopy}
              className="text-[10px] sm:text-[11px] uppercase tracking-wider bg-white/5 hover:bg-white/10 transition-colors px-2.5 py-1.5 sm:px-3 sm:py-1 text-primary rounded touch-target-sm flex items-center gap-1"
            >
              <Copy className="size-3" />
              <span className="hidden xs:inline">Copy</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PerfectedPromptCard({
  value,
  usage,
  onChange,
}: {
  value?: string;
  usage?: UsageMetadata;
  onChange: (next: string) => void;
}) {
  if (!value) return null;
  const m = estimateTextMetrics(value);

  return (
    <div className="group relative mt-4 sm:mt-6 animate-in slide-in-from-right-4 duration-500 fade-in">
      {/* Glow effect */}
      <div className="absolute -inset-0.5 bg-gradient-to-br from-primary via-transparent to-primary opacity-20 blur-lg group-hover:opacity-30 transition-opacity" />

      <div className="glass-panel border border-primary/20 relative overflow-hidden bg-black/40 sm:rounded-lg">
        {/* Header */}
        <div className="p-2 sm:p-3 border-b border-primary/20 flex items-center justify-between bg-black/40 gap-2">
          <div className="font-display font-bold text-xs sm:text-sm tracking-widest text-primary uppercase flex items-center gap-1.5 sm:gap-2 truncate">
            <span className="text-base sm:text-lg">✦</span>
            <span className="hidden xs:inline">PERFECTED_OUTPUT</span>
            <span className="xs:hidden">OUTPUT</span>
          </div>
          <div className="font-mono text-[9px] sm:text-[10px] text-primary/60 border border-primary/20 px-1 sm:px-1.5 py-0.5 flex-shrink-0">
            <span className="hidden xs:inline">CONFIDENCE: </span>99%
          </div>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-4 md:p-5 font-sans relative">
          {/* Background decoration - hidden on mobile */}
          <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none hidden sm:block">
            <svg className="size-16 md:size-20" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="1" fill="none" />
              <path d="M50 10 L50 90 M10 50 L90 50" stroke="currentColor" strokeWidth="1" />
            </svg>
          </div>

          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-transparent border-0 focus-visible:ring-0 resize-y min-h-[180px] sm:min-h-[200px] md:min-h-[240px] text-sm sm:text-base leading-relaxed text-foreground p-0 relative z-10 font-medium selection:bg-primary/30"
            spellCheck={false}
          />
        </div>

        {/* Footer Actions */}
        <div className="p-2 sm:p-3 border-t border-primary/10 bg-primary/5 flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 sm:gap-3">
          {/* Token stats */}
          <div className="text-[9px] sm:text-[10px] font-mono text-muted-foreground flex items-center gap-2 sm:gap-3 flex-wrap">
            <span className="flex items-center gap-1 sm:gap-1.5">
              <span className="size-1 bg-primary rounded-full" />
              IN: {usage?.promptTokenCount ?? 0}
            </span>
            <span className="flex items-center gap-1 sm:gap-1.5">
              <span className="size-1 bg-green-500 rounded-full" />
              OUT: {usage?.candidatesTokenCount ?? 0}
            </span>
            <span className="opacity-50 hidden xs:inline">
              | TOTAL: {usage?.totalTokenCount ?? (m.tokens || 0)}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex gap-1.5 sm:gap-2 w-full xs:w-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText("```\n" + value + "\n```");
                toast.success("Copied as Markdown");
              }}
              className="h-8 sm:h-7 text-[10px] sm:text-xs hover:bg-primary/10 hover:text-primary flex-1 xs:flex-none touch-target-sm gap-1"
            >
              <FileCode className="size-3 sm:size-3.5" />
              <span className="hidden xs:inline">MD</span>
            </Button>
            <Button
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(value);
                toast.success("Copied as text");
              }}
              className="h-8 sm:h-7 text-[10px] sm:text-xs bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_12px_rgba(255,214,10,0.3)] sm:shadow-[0_0_15px_rgba(255,214,10,0.4)] flex-1 xs:flex-none touch-target-sm gap-1"
            >
              <Copy className="size-3 sm:size-3.5" />
              <span>COPY<span className="hidden sm:inline"> RESULT</span></span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
