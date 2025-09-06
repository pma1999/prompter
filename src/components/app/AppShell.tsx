"use client"

import { ReactNode } from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarShortcut, MenubarTrigger } from "@/components/ui/menubar";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { CommandMenu } from "@/components/common/CommandMenu";

export function AppShell({ left, center, right }: { left: ReactNode; center: ReactNode; right: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-dvh w-full">
        {/* Left Sidebar */}
        <aside className="hidden md:flex w-[280px] flex-col border-r bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/40">
          {left}
        </aside>
        {/* Main Content */}
        <SidebarInset className="flex-1">
          {/* Header */}
          <header className="sticky top-0 z-30 bg-background/80 backdrop-blur border-b">
            <div className="flex h-14 items-center px-4 gap-3">
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
                <Button variant="outline" size="sm" asChild>
                  <a href="https://ai.google.dev/gemini-api" target="_blank" rel="noreferrer">Open AI Studio</a>
                </Button>
              </div>
            </div>
          </header>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-4 p-4">
            <main className="min-h-[calc(100dvh-56px)]">{center}</main>
            <aside className="min-h-[calc(100dvh-56px)] border-l pl-4 hidden lg:block">{right}</aside>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
