"use client"

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { getAuthStatus, connectApiKey, disconnectApiKey } from "@/lib/api/auth";
import { emitCommand } from "@/lib/commandBus";

export function ApiKeyManager({ onStatusChange }: { onStatusChange?: (connected: boolean) => void }) {
  const [open, setOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const [expiresAt, setExpiresAt] = useState<number | undefined>(undefined);
  const [apiKey, setApiKey] = useState("");
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const s = await getAuthStatus();
        setConnected(s.connected);
        setExpiresAt(s.expiresAt);
      } catch {}
    })();
  }, []);

  function onOpen() {
    setOpen(true);
  }

  async function onConnect() {
    if (!apiKey.trim()) { toast.error("Enter your API key"); return; }
    setBusy(true);
    try {
      const status = await connectApiKey(apiKey.trim(), remember ? 24 : 8);
      setConnected(status.connected);
      setExpiresAt(status.expiresAt);
      setApiKey("");
      setOpen(false);
      toast.success("API key connected");
      onStatusChange?.(true);
      emitCommand("api-key-connected");
    } catch (e: unknown) {
      const msg = (e as Error)?.message || "Failed to connect key";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  async function onDisconnect() {
    setBusy(true);
    try {
      await disconnectApiKey();
      setConnected(false);
      setExpiresAt(undefined);
      toast.success("Disconnected");
      onStatusChange?.(false);
      emitCommand("api-key-disconnected");
    } catch {} finally { setBusy(false); }
  }

  const label = useMemo(() => {
    if (connected) {
      if (expiresAt) {
        const date = expiresAt > 1e12 ? new Date(expiresAt) : new Date(expiresAt * 1000);
        return `Key: Connected (expires ${date.toLocaleString()})`;
      }
      return "Key: Connected";
    }
    return "Key: Not Connected";
  }, [connected, expiresAt]);

  return (
    <>
      <Button variant={connected ? "default" : "outline"} size="sm" onClick={onOpen}>
        {label}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect your Gemini API key</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">Get a free key in <a className="underline" href="https://ai.google.dev/gemini-api" target="_blank" rel="noreferrer">Google AI Studio</a>. We never store your key in local storage. It’s kept server-side and referenced by an HttpOnly cookie; an optional encrypted HttpOnly fallback may be used for availability. Your key is never exposed to page scripts.</div>
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input id="apiKey" type="password" placeholder="GEMINI-..." value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm">Remember on this device</div>
              <Switch checked={remember} onCheckedChange={setRemember} />
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={onConnect} disabled={busy}>Connect</Button>
              <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
              {connected && (
                <Button variant="destructive" className="ml-auto" onClick={onDisconnect} disabled={busy}>Disconnect</Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}


