"use client"

import { Textarea } from "@/components/ui/textarea";
import { useEffect, useRef } from "react";

export function RawPromptInput({ value, onChange, placeholder, onSubmit }: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    const newHeight = Math.max(160, el.scrollHeight);
    el.style.height = `${newHeight}px`;
  }, [value]);

  return (
    <div className="relative group">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 via-primary/0 to-primary/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 rounded-lg blur-sm" />

      <div className="relative glass-panel rounded-lg p-1 overflow-hidden transition-all duration-300 group-focus-within:ring-1 group-focus-within:ring-primary/50">
        <Textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              onSubmit?.();
            }
          }}
          placeholder={placeholder}
          className="w-full bg-transparent border-0 focus-visible:ring-0 resize-none min-h-[160px] p-6 text-lg font-mono leading-relaxed placeholder:text-muted-foreground/50 selection:bg-primary/20"
          spellCheck={false}
        />

        <div className="absolute bottom-3 right-4 flex items-center gap-2 pointer-events-none opacity-0 group-focus-within:opacity-100 transition-opacity duration-300">
          <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-mono uppercase tracking-wider">Ctrl + Enter</span>
        </div>
      </div>
    </div>
  );
}
