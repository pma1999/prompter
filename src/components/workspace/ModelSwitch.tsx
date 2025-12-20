"use client"

import { MODELS } from "@/lib/models";
import { ModelFamily, ModelId } from "@/domain/types";

import { cn } from "@/lib/utils";
import { ImageIcon, MessageSquare, VideoIcon, ChevronRight } from "lucide-react";

export function ModelSwitch({ value, onChange }: { value: ModelId; onChange: (id: ModelId) => void }) {
  const selected = MODELS.find((m) => m.id === value)!;
  const currentFamily: ModelFamily = selected.family;

  const handleFamilySelect = (fam: ModelFamily) => {
    // Select default representative model for each family
    if (fam === "text") onChange("gemini-2.5-pro");
    if (fam === "image") onChange("gemini-2.5-flash-image");
    if (fam === "video") onChange("sora-2-prompt-expert");
  };

  const CATEGORIES = [
    {
      id: "text",
      label: "TEXT",
      shortLabel: "TXT",
      icon: MessageSquare,
      color: "from-indigo-500 to-blue-600",
      description: "Gemini 3 Pro & Flash, GPT-5.2, Claude 4.5 Sonnet, Claude 4.5 Opus...",
      shortDesc: "LLM prompts",
    },
    {
      id: "image",
      label: "IMAGE",
      shortLabel: "IMG",
      icon: ImageIcon,
      color: "from-orange-500 to-amber-500",
      description: "Gemini 2.5 Flash Image, Gemini 3 Pro Image, GPT-Image-1.5...",
      shortDesc: "Image generation",
    },
    {
      id: "video",
      label: "VIDEO",
      shortLabel: "VID",
      icon: VideoIcon,
      color: "from-purple-600 to-pink-600",
      description: "Veo 3, Sora 2...",
      shortDesc: "Video prompts",
    },
  ] as const;

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-base sm:text-lg md:text-xl font-display font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
          <span className="text-primary">01</span>
          <span className="hidden xs:inline">Model Selection</span>
          <span className="xs:hidden">Model</span>
        </h2>
        <div className="h-px flex-1 bg-border/50 hidden sm:block" />
      </div>

      {/* Horizontal scroll wrapper for extra small screens */}
      <div className="-mx-3 px-3 sm:mx-0 sm:px-0">
        {/* Grid layout - responsive */}
        <div className="grid grid-cols-3 sm:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
          {CATEGORIES.map((cat) => {
            const isActive = currentFamily === cat.id;
            return (
              <button
                type="button"
                key={cat.id}
                onClick={() => handleFamilySelect(cat.id as ModelFamily)}
                className={cn(
                  "relative p-3 sm:p-4 md:p-5 border rounded-lg sm:rounded-xl cursor-pointer transition-all duration-300 group overflow-hidden text-left touch-active",
                  isActive
                    ? "bg-primary/5 border-primary/50 shadow-[0_0_20px_-5px_rgba(255,214,10,0.15)]"
                    : "bg-card/40 hover:bg-muted/30 border-border/40 hover:border-primary/30 active:bg-muted/50"
                )}
              >
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute top-0 right-0 size-2 bg-primary shadow-[0_0_10px_var(--color-primary)]" />
                )}

                {/* Icon and label row */}
                <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-3">
                  <div className={cn(
                    "p-1.5 sm:p-2 rounded-md sm:rounded-lg bg-gradient-to-br text-white shadow-inner flex-shrink-0",
                    cat.color
                  )}>
                    <cat.icon className="size-4 sm:size-5" />
                  </div>
                  <div className={cn(
                    "font-display font-bold text-xs sm:text-base md:text-lg tracking-wide truncate",
                    isActive ? "text-primary" : "text-foreground"
                  )}>
                    {/* Show short label on xs, full label on sm+ */}
                    <span className="hidden sm:inline">{cat.label}</span>
                    <span className="sm:hidden">{cat.shortLabel}</span>
                  </div>
                </div>

                {/* Description - hidden on very small screens */}
                <div className="hidden sm:block text-[10px] sm:text-xs text-muted-foreground leading-relaxed group-hover:text-foreground/80 transition-colors line-clamp-2">
                  <span className="hidden md:inline">Compatible with: </span>
                  <span className="hidden md:inline italic opacity-80">{cat.description}</span>
                  <span className="md:hidden">{cat.shortDesc}</span>
                </div>

                {/* Mobile arrow indicator when active */}
                {isActive && (
                  <div className="absolute bottom-2 right-2 sm:hidden">
                    <ChevronRight className="size-3 text-primary animate-pulse" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile: Selected model description */}
      <div className="sm:hidden px-1">
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          {CATEGORIES.find(c => c.id === currentFamily)?.description}
        </p>
      </div>
    </div>
  );
}
