"use client"

import { ReactNode } from "react";
import { Sidebar, SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { ApiKeyManager } from "@/components/common/ApiKeyManager";
import { FeedbackButton } from "@/components/common/FeedbackButton";
import { FeedbackDialog } from "@/components/common/FeedbackDialog";
import { subscribeCommands, emitCommand } from "@/lib/commandBus";
import { useEffect, useState } from "react";
import { GrainOverlay } from "@/components/ui/GrainOverlay";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical, Plus, Download, Upload, Key, MessageSquare, BookOpen, Keyboard } from "lucide-react";

export function AppShell({ left, center, right }: { left: ReactNode; center: ReactNode; right: ReactNode }) {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [apiKeyOpen, setApiKeyOpen] = useState(false);

  useEffect(() => {
    return subscribeCommands((cmd) => {
      if (cmd === "connect-api-key") {
        setApiKeyOpen(true);
      }
      if (cmd === "open-feedback") {
        setFeedbackOpen(true);
      }
    });
  }, []);

  return (
    <>
      <GrainOverlay />
      <SidebarProvider>
        <div className="flex min-h-dvh w-full overflow-hidden bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
          {/* Left Sidebar - "Tool Belt" */}
          <Sidebar className="border-r border-border/40 bg-card/50 backdrop-blur-md">
            {left}
          </Sidebar>

          {/* Main Content Area */}
          <SidebarInset className="flex-1 flex flex-col relative overflow-hidden">
            {/* Header - "Command Bar" */}
            <header className="sticky top-0 z-30 h-12 sm:h-14 flex items-center justify-between px-2 sm:px-4 lg:px-6 border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 safe-top">
              <div className="flex items-center gap-2 sm:gap-4">
                {/* Mobile sidebar trigger */}
                <div className="flex items-center gap-2 text-foreground/80 md:hidden">
                  <SidebarTrigger className="touch-target-sm" />
                </div>

                {/* Logo */}
                <div className="font-display font-bold text-sm sm:text-lg tracking-widest uppercase text-foreground/90">
                  <span className="text-primary mr-1">{"///"}</span>
                  <span className="hidden xs:inline">Prompter</span>
                  <span className="xs:hidden">P</span>
                </div>

                {/* Desktop navigation */}
                <Separator orientation="vertical" className="h-4 bg-border/40 hidden md:block" />
                <nav className="hidden md:flex items-center gap-4 lg:gap-6 text-xs font-mono tracking-wider uppercase text-muted-foreground">
                  <button
                    onClick={() => emitCommand('new-session')}
                    className="hover:text-primary transition-colors touch-target-sm flex items-center gap-1.5"
                  >
                    <Plus className="size-3.5" />
                    New
                  </button>
                  <button
                    onClick={() => emitCommand('import-session')}
                    className="hover:text-primary transition-colors touch-target-sm flex items-center gap-1.5"
                  >
                    <Download className="size-3.5" />
                    Import
                  </button>
                  <button
                    onClick={() => emitCommand('export-session')}
                    className="hover:text-primary transition-colors touch-target-sm flex items-center gap-1.5"
                  >
                    <Upload className="size-3.5" />
                    Export
                  </button>
                </nav>
              </div>

              <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
                {/* Desktop actions */}
                <div className="hidden md:flex items-center gap-2">
                  <ApiKeyManager />
                  <FeedbackButton />
                  <ThemeToggle />
                </div>

                {/* Mobile actions - dropdown menu */}
                <div className="flex md:hidden items-center gap-1">
                  <ThemeToggle />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-9 touch-target-sm">
                        <MoreVertical className="size-5" />
                        <span className="sr-only">More options</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => emitCommand('new-session')} className="gap-2">
                        <Plus className="size-4" />
                        New Session
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => emitCommand('import-session')} className="gap-2">
                        <Download className="size-4" />
                        Import Session
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => emitCommand('export-session')} className="gap-2">
                        <Upload className="size-4" />
                        Export Session
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setApiKeyOpen(true)} className="gap-2">
                        <Key className="size-4" />
                        API Key
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setFeedbackOpen(true)} className="gap-2">
                        <MessageSquare className="size-4" />
                        Feedback
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => emitCommand('open-docs')} className="gap-2">
                        <BookOpen className="size-4" />
                        Documentation
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => emitCommand('open-shortcuts')} className="gap-2">
                        <Keyboard className="size-4" />
                        Shortcuts
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </header>

            {/* Content Grid - "Canvas" & "Inspection Deck" */}
            <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 h-full">
              {/* Center Canvas - Focus Area */}
              <main className="lg:col-span-7 xl:col-span-8 p-3 sm:p-4 md:p-6 lg:p-8 overflow-y-auto no-scrollbar scroll-smooth-touch relative">
                <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8 pb-24 sm:pb-28 safe-bottom">
                  {center}
                </div>
              </main>

              {/* Right Inspection Deck - Data Slates (desktop only) */}
              <aside className="hidden lg:block lg:col-span-5 xl:col-span-4 border-l border-border/40 bg-card/20 backdrop-blur-sm p-4 lg:p-6 overflow-y-auto no-scrollbar custom-scrollbar">
                <div className="space-y-6 sticky top-6">
                  {right}
                </div>
              </aside>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>

      {/* Dialogs - rendered at root level for proper stacking */}
      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
      <ApiKeyManager open={apiKeyOpen} onOpenChange={setApiKeyOpen} hideButton />
    </>
  );
}
