"use client"

import { Coffee, Heart } from "lucide-react"

const SUPPORT_URL = "https://buymeacoffee.com/pablomiar"

export function AppFooter() {
  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-10 items-center justify-between px-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          Made with <Heart className="size-3 fill-red-500 text-red-500" /> by{" "}
          <a
            href="https://github.com/pma1999"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground underline-offset-4 hover:underline transition-colors"
          >
            pablomiar
          </a>
        </div>
        <a
          href={SUPPORT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 hover:text-foreground underline-offset-4 hover:underline transition-colors"
        >
          <Coffee className="size-3.5 text-amber-600 dark:text-amber-500" />
          Support
        </a>
      </div>
    </footer>
  )
}