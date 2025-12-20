"use client"

import { useState } from "react";
import { Info, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function GuidePanel({ family }: { family: "text" | "image" | "video" }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="glass-panel rounded-lg border-l-2 border-l-primary/30 overflow-hidden transition-all duration-300">
      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full h-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 text-xs text-muted-foreground hover:text-foreground active:bg-white/5 transition-colors group touch-target"
        aria-expanded={open}
      >
        <div className="size-5 sm:size-6 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary/20 transition-colors flex-shrink-0">
          <Info className="size-3 sm:size-3.5" />
        </div>
        <span className="font-mono uppercase tracking-wider text-[9px] sm:text-[10px] truncate">
          {family === "image"
            ? "/// IMAGE_GUIDE"
            : family === "video"
            ? "/// VIDEO_GUIDE"
            : "/// TEXT_GUIDE"}
        </span>
        <span className="ml-auto inline-flex items-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity flex-shrink-0">
          {open ? (
            <ChevronUp className="size-3.5 sm:size-4" />
          ) : (
            <ChevronDown className="size-3.5 sm:size-4" />
          )}
        </span>
      </button>

      {/* Collapsible content */}
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-0.5 sm:pt-1 text-[10px] sm:text-[11px] leading-relaxed text-muted-foreground font-mono">
            {family === "image" ? (
              <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                <ul className="list-none space-y-1.5 sm:space-y-2">
                  <li className="flex gap-1.5 sm:gap-2">
                    <span className="text-primary flex-shrink-0">•</span>
                    <span>Write a descriptive paragraph (avoid keyword lists).</span>
                  </li>
                  <li className="flex gap-1.5 sm:gap-2">
                    <span className="text-primary flex-shrink-0">•</span>
                    <span>Specify shot, lens, lighting, mood, textures, aspect ratio.</span>
                  </li>
                  <li className="flex gap-1.5 sm:gap-2">
                    <span className="text-primary flex-shrink-0">•</span>
                    <span>State the purpose (logo, product, portrait, etc.).</span>
                  </li>
                </ul>
                <ul className="list-none space-y-1.5 sm:space-y-2">
                  <li className="flex gap-1.5 sm:gap-2">
                    <span className="text-primary flex-shrink-0">•</span>
                    <span>Editing: describe only the change; keep style and lighting.</span>
                  </li>
                  <li className="flex gap-1.5 sm:gap-2">
                    <span className="text-primary flex-shrink-0">•</span>
                    <span>Composition: reference which elements to combine and where.</span>
                  </li>
                </ul>
              </div>
            ) : family === "video" ? (
              <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                <ul className="list-none space-y-1.5 sm:space-y-2">
                  <li className="flex gap-1.5 sm:gap-2">
                    <span className="text-primary flex-shrink-0">•</span>
                    <span>Describe as if briefing a cinematographer: shot, action, lighting.</span>
                  </li>
                  <li className="flex gap-1.5 sm:gap-2">
                    <span className="text-primary flex-shrink-0">•</span>
                    <span>Keep motion simple: one camera move, one clear subject action.</span>
                  </li>
                  <li className="flex gap-1.5 sm:gap-2">
                    <span className="text-primary flex-shrink-0">•</span>
                    <span>Specify style early (e.g., &ldquo;1970s film&rdquo;, &ldquo;handheld&rdquo;).</span>
                  </li>
                </ul>
                <ul className="list-none space-y-1.5 sm:space-y-2">
                  <li className="flex gap-1.5 sm:gap-2">
                    <span className="text-primary flex-shrink-0">•</span>
                    <span>For dialogue: keep lines short, label speakers clearly.</span>
                  </li>
                  <li className="flex gap-1.5 sm:gap-2">
                    <span className="text-primary flex-shrink-0">•</span>
                    <span>Use reference images to lock composition and style.</span>
                  </li>
                </ul>
              </div>
            ) : (
              <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                <ul className="list-none space-y-1.5 sm:space-y-2">
                  <li className="flex gap-1.5 sm:gap-2">
                    <span className="text-primary flex-shrink-0">•</span>
                    <span>Lead with intent and audience.</span>
                  </li>
                  <li className="flex gap-1.5 sm:gap-2">
                    <span className="text-primary flex-shrink-0">•</span>
                    <span>Define structure, steps, constraints, and output format.</span>
                  </li>
                  <li className="flex gap-1.5 sm:gap-2">
                    <span className="text-primary flex-shrink-0">•</span>
                    <span>Keep it single-paragraph in English for final output.</span>
                  </li>
                </ul>
                <ul className="list-none space-y-1.5 sm:space-y-2">
                  <li className="flex gap-1.5 sm:gap-2">
                    <span className="text-primary flex-shrink-0">•</span>
                    <span>Ask 1-3 targeted clarifications when critical details are missing.</span>
                  </li>
                  <li className="flex gap-1.5 sm:gap-2">
                    <span className="text-primary flex-shrink-0">•</span>
                    <span>Provide a recommended option with a short why.</span>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
