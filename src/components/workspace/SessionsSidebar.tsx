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
    <div className="flex flex-1 flex-col">
      <div className="p-3 flex items-center gap-2 flex-wrap">
        <Input className="min-w-0 flex-1" placeholder="Search sessions…" value={filter} onChange={(e) => setFilter(e.target.value)} />
        <Button size="sm" onClick={createNew}>New</Button>
      </div>
      <Separator />
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {filtered.map((s) => (
            <div key={s.meta.id} className="group rounded-md border p-2">
              <div className="text-sm font-medium flex items-center justify-between">
                <input
                  className="bg-transparent outline-none w-[70%]"
                  defaultValue={s.meta.name}
                  onBlur={(e) => rename(s.meta.id, e.target.value)}
                />
                <div className="text-xs text-muted-foreground">{MODELS.find((m) => m.id === s.meta.modelId)?.label}</div>
              </div>
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <Button size="sm" variant="secondary" onClick={() => onSelect(s)}>Open</Button>
                <Button size="sm" variant="ghost" onClick={() => handleExport(s)}>Export</Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(s.meta.id)}>Delete</Button>
              </div>
            </div>
          ))}
          {!filtered.length && (
            <div className="text-sm text-muted-foreground">No sessions yet.</div>
          )}
        </div>
      </ScrollArea>
      <Separator />
      <div className="p-3 flex items-center justify-between">
        <Button size="sm" variant="outline" onClick={handleImport}>Import from Clipboard</Button>
        <div className="text-xs text-muted-foreground">Ctrl/⌘+K for commands</div>
      </div>
    </div>
  );
}
