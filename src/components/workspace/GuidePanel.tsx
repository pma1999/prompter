"use client"

import { useState } from "react";
import { Info, ChevronDown, ChevronUp } from "lucide-react";

export function GuidePanel({ family }: { family: "text" | "image" }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-md border bg-muted/40 px-3 py-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
        aria-expanded={open}
      >
        <Info className="size-4" />
        <span className="font-medium">{family === "image" ? "Image prompt tips" : "Text prompt tips"}</span>
        <span className="ml-auto inline-flex items-center gap-1">
          <span className="hidden sm:inline">{open ? "Hide" : "Show"}</span>
          {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </span>
      </button>
      {open && (
        <div className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
          {family === "image" ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <ul className="list-disc pl-4 space-y-1">
                <li>Write a descriptive paragraph (avoid keyword lists).</li>
                <li>Specify shot, lens, lighting, mood, textures, aspect ratio.</li>
                <li>State the purpose (logo, product, portrait, etc.).</li>
              </ul>
              <ul className="list-disc pl-4 space-y-1">
                <li>Editing: describe only the change; keep style and lighting.</li>
                <li>Composition: reference which elements to combine and where.</li>
                <li>Need a specific ratio? Provide a reference image.</li>
              </ul>
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              <ul className="list-disc pl-4 space-y-1">
                <li>Lead with intent and audience.</li>
                <li>Define structure, steps, constraints, and output format.</li>
                <li>Keep it single-paragraph in English for final output.</li>
              </ul>
              <ul className="list-disc pl-4 space-y-1">
                <li>Ask 1–3 targeted clarifications when critical details are missing.</li>
                <li>Provide a recommended option with a short why.</li>
                <li>Prefer precise, unambiguous wording.</li>
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
