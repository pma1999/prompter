"use client"

import * as React from "react";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Command, FolderPlus, Import, Save, BookOpenText, Keyboard } from "lucide-react";
import { emitCommand } from "@/lib/commandBus";

export function CommandMenu() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  function run(cmd: Parameters<typeof emitCommand>[0]) {
    emitCommand(cmd);
    setOpen(false);
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Command className="mr-2 size-4" />
        Command
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Sessions">
            <CommandItem onSelect={() => run("new-session")}>
              <FolderPlus className="mr-2 size-4" />
              New Session
            </CommandItem>
            <CommandItem onSelect={() => run("import-session")}>
              <Import className="mr-2 size-4" />
              Import from JSON
            </CommandItem>
            <CommandItem onSelect={() => run("export-session")}>
              <Save className="mr-2 size-4" />
              Export to JSON
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Help">
            <CommandItem onSelect={() => run("open-docs")}>
              <BookOpenText className="mr-2 size-4" />
              Docs
            </CommandItem>
            <CommandItem onSelect={() => run("open-shortcuts")}>
              <Keyboard className="mr-2 size-4" />
              Keyboard Shortcuts
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
