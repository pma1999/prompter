export type AppCommand =
  | "new-session"
  | "import-session"
  | "export-session"
  | "open-docs"
  | "open-shortcuts"
  | "connect-api-key"
  | "api-key-connected"
  | "api-key-disconnected"
  | "sessions-updated";

const EVENT_NAME = "pp:command";

export function emitCommand(command: AppCommand) {
  if (typeof window === "undefined") return;
  const ev = new CustomEvent<AppCommand>(EVENT_NAME, { detail: command });
  window.dispatchEvent(ev);
}

export function subscribeCommands(handler: (cmd: AppCommand) => void) {
  function onEvent(e: Event) {
    const ce = e as CustomEvent<AppCommand>;
    handler(ce.detail);
  }
  window.addEventListener(EVENT_NAME, onEvent as EventListener);
  return () => window.removeEventListener(EVENT_NAME, onEvent as EventListener);
}
