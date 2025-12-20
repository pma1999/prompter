"use client"

import { MODELS } from "@/lib/models";
import { ModelFamily, ModelId } from "@/domain/types";

import { cn } from "@/lib/utils";
import { ImageIcon, MessageSquare, VideoIcon } from "lucide-react";



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
      icon: MessageSquare,
      color: "from-indigo-500 to-blue-600",
      description: "Gemini 3 Pro & Flash, GPT-5.2, Claude 4.5 Sonnet, Claude 4.5 Opus...",
    },
    {
      id: "image",
      label: "IMAGE",
      icon: ImageIcon,
      color: "from-orange-500 to-amber-500",
      description: "Gemini 2.5 Flash Image, Gemini 3 Pro Image, GPT-Image-1.5...",
    },
    {
      id: "video",
      label: "VIDEO",
      icon: VideoIcon,
      color: "from-purple-600 to-pink-600",
      description: "Veo 3, Sora 2...",
    },
  ] as const;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-display font-bold uppercase tracking-widest text-foreground">
          <span className="text-primary mr-2">01</span>
          Model Selection
        </h2>
        <div className="h-px flex-1 bg-border/50 ml-6" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {CATEGORIES.map((cat) => {
          const isActive = currentFamily === cat.id;
          return (
            <div
              key={cat.id}
              onClick={() => handleFamilySelect(cat.id as ModelFamily)}
              className={cn(
                "relative p-5 border rounded-xl cursor-pointer transition-all duration-300 group overflow-hidden",
                isActive
                  ? "bg-primary/5 border-primary/50 shadow-[0_0_20px_-5px_rgba(255,214,10,0.15)]"
                  : "bg-card/40 hover:bg-muted/30 border-border/40 hover:border-primary/30"
              )}
            >
              {isActive && <div className="absolute top-0 right-0 size-2 bg-primary shadow-[0_0_10px_var(--color-primary)]" />}

              <div className="flex items-center gap-3 mb-3">
                <div className={cn("p-2 rounded-lg bg-gradient-to-br text-white shadow-inner", cat.color)}>
                  <cat.icon className="size-5" />
                </div>
                <div className={cn("font-display font-bold text-lg tracking-wide", isActive ? "text-primary" : "text-foreground")}>
                  {cat.label}
                </div>
              </div>

              <div className="text-xs text-muted-foreground leading-relaxed group-hover:text-foreground/80 transition-colors">
                Compatible with: <span className="italic opacity-80">{cat.description}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
