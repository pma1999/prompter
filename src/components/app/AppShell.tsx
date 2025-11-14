"use client"

import { ReactNode } from "react";
import { Sidebar, SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarShortcut, MenubarTrigger } from "@/components/ui/menubar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { CommandMenu } from "@/components/common/CommandMenu";
import { ApiKeyManager } from "@/components/common/ApiKeyManager";
import { FeedbackButton } from "@/components/common/FeedbackButton";
import { FeedbackDialog } from "@/components/common/FeedbackDialog";
import { AppFooter } from "@/components/common/AppFooter";
import { MessageSquare } from "lucide-react";
import { subscribeCommands, emitCommand } from "@/lib/commandBus";
import { useEffect, useRef, useState } from "react";

export function AppShell({ left, center, right }: { left: ReactNode; center: ReactNode; right: ReactNode }) {
  const apiKeyButtonRef = useRef<HTMLButtonElement | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  useEffect(() => {
    return subscribeCommands((cmd) => {
      if (cmd === "connect-api-key") {
        apiKeyButtonRef.current?.click();
      }
      if (cmd === "open-feedback") {
        setFeedbackOpen(true);
      }
    });
  }, []);

  return (
    <>
      <SidebarProvider>
        <div className="flex min-h-dvh w-full">
          {/* Left Sidebar (responsive with mobile sheet) */}
          <Sidebar>
            {left}
          </Sidebar>
          {/* Main Content */}
          <SidebarInset className="flex-1">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-background/80 backdrop-blur border-b">
              {/* Desktop header */}
              <div className="hidden md:flex h-14 items-center px-4 gap-3">
                <div className="font-semibold tracking-tight">Prompt Perfection</div>
                <Separator orientation="vertical" className="mx-1 h-6" />
                <Menubar className="h-8">
                  <MenubarMenu>
                    <MenubarTrigger>File</MenubarTrigger>
                    <MenubarContent>
                      <MenubarItem>
                        New Session <MenubarShortcut>Ctrl+N</MenubarShortcut>
                      </MenubarItem>
                      <MenubarItem>
                        Import JSON <MenubarShortcut>Ctrl+I</MenubarShortcut>
                      </MenubarItem>
                      <MenubarItem>
                        Export JSON <MenubarShortcut>Ctrl+E</MenubarShortcut>
                      </MenubarItem>
                    </MenubarContent>
                  </MenubarMenu>
                  <MenubarMenu>
                    <MenubarTrigger>Help</MenubarTrigger>
                    <MenubarContent>
                      <MenubarItem>Docs</MenubarItem>
                      <MenubarItem>Keyboard Shortcuts</MenubarItem>
                    </MenubarContent>
                  </MenubarMenu>
                </Menubar>
                <div className="ml-auto flex items-center gap-2">
                  <CommandMenu />
                  <ThemeToggle />
                  <div>
                    <span className="hidden" />
                    <ApiKeyManager />
                  </div>
                  <FeedbackButton />
                  <Button variant="outline" size="sm" asChild>
                    <a href="https://ai.google.dev/gemini-api" target="_blank" rel="noreferrer">Open AI Studio</a>
                  </Button>
                </div>
              </div>
              {/* Mobile header */}
              <div className="md:hidden flex flex-col w-full gap-2 px-3 py-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <SidebarTrigger aria-label="Toggle sessions" />
                    <div className="font-semibold tracking-tight truncate">Prompt Perfection</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">More</Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>File</DropdownMenuLabel>
                        <DropdownMenuItem onSelect={() => emitCommand("new-session")}>New Session</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => emitCommand("import-session")}>Import JSON</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => emitCommand("export-session")}>Export JSON</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Help</DropdownMenuLabel>
                        <DropdownMenuItem onSelect={() => emitCommand("open-docs")}>Docs</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => emitCommand("open-shortcuts")}>Keyboard Shortcuts</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Settings</DropdownMenuLabel>
                        <DropdownMenuItem onSelect={() => emitCommand("connect-api-key")}>Connect API Key</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Feedback</DropdownMenuLabel>
                        <DropdownMenuItem onSelect={() => emitCommand("open-feedback")}>
                          <MessageSquare className="mr-2 size-4" />
                          Provide Feedback
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CommandMenu />
                  <ApiKeyManager />
                </div>
              </div>
            </header>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-4 p-3 sm:p-4">
              <main className="min-h-[calc(100dvh-56px)]">{center}</main>
              <aside className="min-h-[calc(100dvh-56px)] border-l pl-4 hidden lg:block">{right}</aside>
            </div>
            <AppFooter />
          </SidebarInset>
        </div>
      </SidebarProvider>
      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </>
  );
}
