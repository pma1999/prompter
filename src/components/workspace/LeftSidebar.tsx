"use client"

import { SessionsSidebar } from "@/components/workspace/SessionsSidebar";
import { SessionData } from "@/domain/types";

export function LeftSidebar({ onSelect }: { onSelect?: (s: SessionData) => void }) {
  return (
    <div className="flex flex-col h-full bg-muted/20 dark:bg-black/60 backdrop-blur-md border-r border-border/40 dark:border-white/5">
      <SessionsSidebar onSelect={(s) => onSelect?.(s)} />
    </div>
  );
}
