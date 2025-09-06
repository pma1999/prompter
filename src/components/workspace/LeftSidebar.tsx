"use client"

import { SessionsSidebar } from "@/components/workspace/SessionsSidebar";
import { SessionData } from "@/domain/types";

export function LeftSidebar({ onSelect }: { onSelect?: (s: SessionData) => void }) {
  return <SessionsSidebar onSelect={(s) => onSelect?.(s)} />;
}
