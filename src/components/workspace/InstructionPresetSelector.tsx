"use client"

import { INSTRUCTION_PRESETS } from "@/lib/instructionPresets";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export function InstructionPresetSelector({ value, onChange, family }: { value: string; onChange: (id: string) => void; family: "text" | "image" | "video" }) {
  const options = INSTRUCTION_PRESETS.filter((p) => p.family === family || p.family === "any");

  if (options.length === 0) return (
    <div className="p-4 text-xs font-mono text-muted-foreground opacity-50 text-center border border-dashed border-white/10 rounded">
      NO_PRESETS_AVAILABLE
    </div>
  );

  return (
    <RadioGroup value={value} onValueChange={onChange} className="grid gap-2">
      {options.map((p) => {
        const isSelected = value === p.id;
        return (
          <div key={p.id} onClick={() => onChange(p.id)} className={`
             cursor-pointer group relative overflow-hidden transition-all duration-300
             border rounded-sm p-3
             ${isSelected
              ? "bg-primary/10 border-primary/50 shadow-[0_0_15px_-5px_rgba(255,214,10,0.3)]"
              : "bg-card/50 dark:bg-black/40 border-border/40 dark:border-white/5 hover:border-border dark:hover:border-white/20 hover:bg-muted/50 dark:hover:bg-white/5"
            }
          `}>
            {isSelected && <div className="absolute top-0 right-0 size-1.5 bg-primary shadow-[0_0_5px_var(--color-primary)]" />}

            <div className="flex items-center gap-3">
              <RadioGroupItem value={p.id} id={`preset-${p.id}`} className="sr-only" />
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor={`preset-${p.id}`} className={`font-display font-bold uppercase tracking-wider text-xs cursor-pointer ${isSelected ? "text-primary" : "text-foreground/80 group-hover:text-foreground"}`}>
                    {p.label}
                  </Label>
                  {isSelected && <span className="text-[10px] font-mono text-primary animate-pulse">ACTIVE</span>}
                </div>
                <div className={`text-[10px] leading-relaxed line-clamp-2 ${isSelected ? "text-primary/80" : "text-muted-foreground group-hover:text-muted-foreground/80"}`}>
                  {p.description}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </RadioGroup>
  );
}
