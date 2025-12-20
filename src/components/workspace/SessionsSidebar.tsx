"use client"

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { MODELS } from "@/lib/models";
import { deleteSession, exportSession, importSession, loadSessions, upsertSession, renameSession } from "@/lib/persistence";
import { SessionData } from "@/domain/types";
import { toast } from "sonner";
import { subscribeCommands } from "@/lib/commandBus";

export function SessionsSidebar({ onSelect }: { onSelect: (session: SessionData) => void }) {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    setSessions(loadSessions());
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeCommands((cmd) => {
      if (cmd === "sessions-updated") {
        setSessions(loadSessions());
      }
    });
    function onStorage(e: StorageEvent) {
      if (e.key === "pp.sessions") {
        setSessions(loadSessions());
      }
    }
    window.addEventListener("storage", onStorage);
    return () => {
      unsubscribe();
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const filtered = useMemo(() => {
    if (!filter) return sessions;
    return sessions.filter((s) => s.meta.name.toLowerCase().includes(filter.toLowerCase()));
  }, [sessions, filter]);

  function createNew() {
    const id = crypto.randomUUID();
    const now = Date.now();
    const session: SessionData = {
      meta: {
        id,
        name: "Untitled Session",
        createdAt: now,
        updatedAt: now,
        modelId: "gemini-2.5-flash-image",
        family: "image",
        revision: 0,
      },
      rawPrompt: "",
      instructionPresetId: "image-virtuoso",
    };
    upsertSession(session);
    setSessions(loadSessions());
    onSelect(session);
  }

  function handleDelete(id: string) {
    deleteSession(id);
    setSessions(loadSessions());
  }

  async function handleExport(s: SessionData) {
    await navigator.clipboard.writeText(exportSession(s));
    toast.success("Exported session to clipboard");
  }

  async function handleImport() {
    const text = await navigator.clipboard.readText();
    const s = importSession(text);
    if (!s) {
      toast.error("Clipboard does not contain a valid session JSON");
      return;
    }
    upsertSession(s);
    setSessions(loadSessions());
  }

  function rename(id: string, name: string) {
    renameSession(id, name);
    setSessions(loadSessions());
  }

  return (
    <div className="flex flex-1 flex-col h-full bg-background/50 dark:bg-black/60">
      <div className="p-4 border-b border-border/40 dark:border-white/5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-mono tracking-widest text-muted-foreground">{"/// SESSION_LOGS"}</span>
          <Button size="icon" variant="ghost" onClick={createNew} className="size-6 hover:bg-muted dark:hover:bg-white/10 rounded-sm">
            <span className="text-lg leading-none mb-0.5">+</span>
          </Button>
        </div>
        <Input
          className="h-8 bg-muted/50 dark:bg-black/40 border-border/40 dark:border-white/10 text-xs focus-visible:ring-primary/50 font-mono"
          placeholder="FILTER_BY_NAME..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {filtered.map((s) => (
            <div key={s.meta.id} className="group bg-card/40 dark:bg-white/5 glass-panel rounded-sm p-3 border-l-2 border-l-transparent hover:border-l-primary transition-all duration-300 relative overflow-hidden text-foreground">
              <div className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-background/90 dark:bg-black/80 backdrop-blur z-10">
                <button onClick={() => handleExport(s)} className="text-[10px] px-1 hover:text-primary transition-colors text-foreground">EXP</button>
                <div className="w-px bg-border/50 dark:bg-white/20 h-3 self-center" />
                <button onClick={() => handleDelete(s.meta.id)} className="text-[10px] px-1 hover:text-red-500 transition-colors text-foreground">DEL</button>
              </div>

              <div className="space-y-2 relative z-0">
                <input
                  className="bg-transparent outline-none w-full text-sm font-medium text-foreground/90 placeholder:text-muted-foreground/50 focus:text-primary transition-colors truncate pr-8"
                  defaultValue={s.meta.name}
                  onBlur={(e) => rename(s.meta.id, e.target.value)}
                />

                <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                  <span className="truncate max-w-[50%] opacity-70 uppercase">
                    {MODELS.find((m) => m.id === s.meta.modelId)?.family || "UNKNOWN"}
                  </span>
                  <span className="opacity-50">{new Date(s.meta.updatedAt).toLocaleDateString()}</span>
                </div>

                <Button size="sm" variant="secondary" onClick={() => onSelect(s)} className="w-full h-7 text-xs bg-muted/50 dark:bg-white/5 hover:bg-primary/20 hover:text-primary border border-border/40 dark:border-white/5 group-hover:border-primary/20 transition-all font-mono tracking-wide">
                  OPEN_SESSION
                </Button>
              </div>
            </div>
          ))}
          {!filtered.length && (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground space-y-2 opacity-50">
              <div className="size-10 rounded-full border border-dashed border-border/40 dark:border-white/20" />
              <div className="text-[10px] font-mono uppercase">NO_DATA</div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-border/40 dark:border-white/5 bg-muted/20 dark:bg-black/40">
        <Button size="sm" variant="outline" onClick={handleImport} className="w-full h-8 text-xs border-border/40 dark:border-white/10 hover:bg-muted dark:hover:bg-white/5 hover:text-primary font-mono uppercase tracking-wide">
          Import Clipboard
        </Button>
      </div>
    </div>
  );
}
