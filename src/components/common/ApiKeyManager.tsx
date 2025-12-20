"use client"

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { getAuthStatus, connectApiKey, disconnectApiKey } from "@/lib/api/auth";
import { emitCommand, subscribeCommands } from "@/lib/commandBus";
import { Key, Check, X } from "lucide-react";

export function ApiKeyManager({
  onStatusChange,
  showButton = true,
}: {
  onStatusChange?: (connected: boolean) => void;
  showButton?: boolean;
}) {
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

  // Listen for connect-api-key command (used by mobile menu)
  useEffect(() => {
    return subscribeCommands((cmd) => {
      if (cmd === "connect-api-key") {
        setOpen(true);
      }
    });
  }, []);

  function onOpen() {
    setOpen(true);
  }

  async function onConnect() {
    if (!apiKey.trim()) {
      toast.error("Enter your API key");
      return;
    }
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
    } catch {} finally {
      setBusy(false);
    }
  }

  const label = useMemo(() => {
    if (connected) {
      if (expiresAt) {
        const date =
          expiresAt > 1e12 ? new Date(expiresAt) : new Date(expiresAt * 1000);
        return `Key: Connected (expires ${date.toLocaleString()})`;
      }
      return "Key: Connected";
    }
    return "Key: Not Connected";
  }, [connected, expiresAt]);

  const shortLabel = useMemo(() => {
    return connected ? "Connected" : "Connect";
  }, [connected]);

  return (
    <>
      {showButton && (
        <Button
          variant={connected ? "default" : "outline"}
          size="sm"
          onClick={onOpen}
          className="gap-1.5 sm:gap-2 h-8 sm:h-9 px-2 sm:px-3 text-[10px] sm:text-xs touch-target-sm"
        >
          {connected ? (
            <Check className="size-3 sm:size-3.5" />
          ) : (
            <Key className="size-3 sm:size-3.5" />
          )}
          {/* Full label on md+, short on smaller */}
          <span className="hidden md:inline">{label}</span>
          <span className="md:hidden">{shortLabel}</span>
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              Connect your Gemini API key
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4">
            <div className="text-[11px] sm:text-sm text-muted-foreground leading-relaxed">
              Get a free key in{" "}
              <a
                className="underline text-primary"
                href="https://ai.google.dev/gemini-api"
                target="_blank"
                rel="noreferrer"
              >
                Google AI Studio
              </a>
              . We never store your key in local storage. It&apos;s kept
              server-side and referenced by an HttpOnly cookie.
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiKey" className="text-xs sm:text-sm">
                API Key
              </Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="GEMINI-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="h-9 sm:h-10 text-sm"
              />
            </div>
            <div className="flex items-center justify-between py-1">
              <div className="text-xs sm:text-sm text-muted-foreground">
                Remember on this device
              </div>
              <Switch checked={remember} onCheckedChange={setRemember} />
            </div>
            <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2">
              <Button
                onClick={onConnect}
                disabled={busy}
                className="h-9 sm:h-10 text-xs sm:text-sm flex-1 xs:flex-none touch-target"
              >
                Connect
              </Button>
              <Button
                variant="ghost"
                onClick={() => setOpen(false)}
                disabled={busy}
                className="h-9 sm:h-10 text-xs sm:text-sm flex-1 xs:flex-none touch-target"
              >
                Cancel
              </Button>
              {connected && (
                <Button
                  variant="destructive"
                  className="xs:ml-auto h-9 sm:h-10 text-xs sm:text-sm flex-1 xs:flex-none touch-target gap-1"
                  onClick={onDisconnect}
                  disabled={busy}
                >
                  <X className="size-3.5" />
                  Disconnect
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
