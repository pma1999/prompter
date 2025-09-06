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
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <div className="space-y-2">
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
        className="min-h-[120px] resize-y"
      />
      <div className="text-xs text-muted-foreground">Press Ctrl/⌘+Enter to refine</div>
    </div>
  );
}
