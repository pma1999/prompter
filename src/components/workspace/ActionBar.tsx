"use client"

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, RotateCcw, Save, Share2, Sparkles } from "lucide-react";
import type { TokenCountResponse } from "@/domain/types";

export function ActionBar({
  onRefine,
  onReset,
  onSave,
  onExport,
  busy,
  preflight,
}: {
  onRefine: () => void;
  onReset: () => void;
  onSave: () => void;
  onExport: () => void;
  busy: boolean;
  preflight?: TokenCountResponse;
}) {
  return (
    <div className="fixed bottom-3 sm:bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 lg:left-auto lg:translate-x-0 lg:right-6 xl:right-10 z-50 flex items-center gap-2 sm:gap-3 md:gap-4 safe-bottom">
      {/* Preflight Stats (Floating Tag) - visible on md+ screens */}
      {preflight && (
        <div className="hidden md:flex flex-col items-end gap-1 animate-in slide-in-from-bottom-2 duration-300">
          <div className="text-[10px] font-mono text-muted-foreground uppercase bg-background/80 backdrop-blur border border-border/50 px-2 py-1 rounded-full shadow-lg">
            Est. Tokens: {preflight.totalTokens.toLocaleString()}
          </div>
        </div>
      )}

      {/* Main Action Group */}
      <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 p-1.5 sm:p-2 bg-background/90 backdrop-blur-xl border border-border/50 rounded-xl sm:rounded-2xl shadow-2xl ring-1 ring-white/10">
        {/* Desktop: Full buttons */}
        <div className="hidden sm:flex items-center gap-1 md:gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            disabled={busy}
            className="rounded-lg sm:rounded-xl px-2 sm:px-3 md:px-4 h-8 sm:h-9 md:h-10 text-xs sm:text-sm text-muted-foreground hover:text-foreground gap-1.5"
          >
            <RotateCcw className="size-3.5 sm:size-4" />
            <span className="hidden md:inline">Reset</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onSave}
            disabled={busy}
            className="rounded-lg sm:rounded-xl px-2 sm:px-3 md:px-4 h-8 sm:h-9 md:h-10 text-xs sm:text-sm gap-1.5"
          >
            <Save className="size-3.5 sm:size-4" />
            <span className="hidden md:inline">Save</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onExport}
            disabled={busy}
            className="rounded-lg sm:rounded-xl px-2 sm:px-3 md:px-4 h-8 sm:h-9 md:h-10 text-xs sm:text-sm gap-1.5"
          >
            <Share2 className="size-3.5 sm:size-4" />
            <span className="hidden md:inline">Export</span>
          </Button>
          <div className="w-px h-5 sm:h-6 bg-border/50 mx-0.5 sm:mx-1" />
        </div>

        {/* Mobile: Dropdown for secondary actions */}
        <div className="sm:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={busy}
                className="rounded-lg h-9 w-9 p-0 touch-target-sm"
              >
                <MoreHorizontal className="size-4" />
                <span className="sr-only">More actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="top" className="w-40">
              <DropdownMenuItem onClick={onReset} className="gap-2">
                <RotateCcw className="size-4" />
                Reset
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onSave} className="gap-2">
                <Save className="size-4" />
                Save
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onExport} className="gap-2">
                <Share2 className="size-4" />
                Export
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Primary Action Button - Always visible */}
        <Button
          onClick={onRefine}
          disabled={busy}
          className="rounded-lg sm:rounded-xl px-4 sm:px-5 md:px-6 lg:px-8 h-10 sm:h-11 md:h-12 text-xs sm:text-sm md:text-base font-bold tracking-wide shadow-[0_0_15px_rgba(255,214,10,0.25)] sm:shadow-[0_0_20px_rgba(255,214,10,0.3)] hover:shadow-[0_0_25px_rgba(255,214,10,0.4)] md:hover:shadow-[0_0_30px_rgba(255,214,10,0.5)] transition-all touch-target gap-1.5 sm:gap-2"
        >
          {busy ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="size-3.5 sm:size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span className="hidden xs:inline">REFINING</span>
              <span className="xs:hidden">...</span>
            </div>
          ) : (
            <>
              <Sparkles className="size-3.5 sm:size-4" />
              <span className="hidden sm:inline">REFINE PROMPT</span>
              <span className="sm:hidden">REFINE</span>
            </>
          )}
        </Button>
      </div>

      {/* Mobile preflight indicator - subtle bottom label */}
      {preflight && (
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 md:hidden">
          <div className="text-[9px] font-mono text-muted-foreground/70 uppercase bg-background/60 backdrop-blur px-2 py-0.5 rounded-full border border-border/30">
            ~{preflight.totalTokens.toLocaleString()} tokens
          </div>
        </div>
      )}
    </div>
  );
}
