"use client"

import { ReactNode } from "react";
import { Sidebar, SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { ApiKeyManager } from "@/components/common/ApiKeyManager";
import { FeedbackButton } from "@/components/common/FeedbackButton";
import { FeedbackDialog } from "@/components/common/FeedbackDialog";
import { subscribeCommands, emitCommand } from "@/lib/commandBus";
import { useEffect, useRef, useState } from "react";
import { GrainOverlay } from "@/components/ui/GrainOverlay";

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
            <header className="sticky top-0 z-30 h-14 flex items-center justify-between px-4 lg:px-6 border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-foreground/80 md:hidden">
                  <SidebarTrigger />
                </div>
                <div className="font-display font-bold text-lg tracking-widest uppercase text-foreground/90">
                  <span className="text-primary mr-1">{"///"}</span>Prompter
                </div>
                <Separator orientation="vertical" className="h-4 bg-border/40 hidden md:block" />
                <nav className="hidden md:flex items-center gap-6 text-xs font-mono tracking-wider uppercase text-muted-foreground">
                  <button onClick={() => emitCommand('new-session')} className="hover:text-primary transition-colors">New</button>
                  <button onClick={() => emitCommand('import-session')} className="hover:text-primary transition-colors">Import</button>
                  <button onClick={() => emitCommand('export-session')} className="hover:text-primary transition-colors">Export</button>
                </nav>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden md:flex items-center gap-2">
                  <ApiKeyManager />
                  <FeedbackButton />
                  <ThemeToggle />
                </div>
                <div className="md:hidden">
                  {/* Mobile Menu simplified */}
                  <ThemeToggle />
                </div>
              </div>
            </header>

            {/* Content Grid - "Canvas" & "Inspection Deck" */}
            <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 h-full">
              {/* Center Canvas - Focus Area */}
              <main className="lg:col-span-7 xl:col-span-8 p-4 lg:p-8 overflow-y-auto no-scrollbar relative">
                <div className="max-w-3xl mx-auto space-y-8 pb-20">
                  {center}
                </div>
              </main>

              {/* Right Inspection Deck - Data Slates */}
              <aside className="hidden lg:block lg:col-span-5 xl:col-span-4 border-l border-border/40 bg-card/20 backdrop-blur-sm p-4 lg:p-6 overflow-y-auto no-scrollbar">
                <div className="space-y-6 sticky top-6">
                  {right}
                </div>
              </aside>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </>
  );
}
