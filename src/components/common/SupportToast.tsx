"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Coffee, X } from "lucide-react"
import { dismissSupport, snoozeSupport, neverShowAgain, shouldOfferNeverShowAgain, recordToastShown } from "@/lib/supportTracking"

const SUPPORT_URL = "https://buymeacoffee.com/pablomiar"

interface SupportToastProps {
  onClose: () => void
  milestone?: number
}

export function SupportToast({ onClose, milestone }: SupportToastProps) {
  const [isPaused, setIsPaused] = useState(false)
  const [showNeverOption, setShowNeverOption] = useState(false)

  useEffect(() => {
    // Record that toast was shown
    recordToastShown()
    
    // Check if we should show "don't show again" option
    setShowNeverOption(shouldOfferNeverShowAgain())

    // Auto-dismiss after 8 seconds (unless hovered)
    let timer: NodeJS.Timeout | null = null
    
    const startTimer = () => {
      timer = setTimeout(() => {
        if (!isPaused) {
          handleNotNow()
        }
      }, 8000)
    }

    if (!isPaused) {
      startTimer()
    }

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [isPaused])

  const handleSupport = () => {
    window.open(SUPPORT_URL, "_blank", "noopener,noreferrer")
    onClose()
  }

  const handleNotNow = () => {
    dismissSupport()
    onClose()
  }

  const handleSnooze = () => {
    snoozeSupport()
    onClose()
  }

  const handleNeverShow = () => {
    neverShowAgain()
    onClose()
  }

  const getMessage = () => {
    if (milestone && milestone >= 25) {
      return {
        title: "✨ Another great prompt!",
        subtitle: "You're a power user! Consider supporting"
      }
    }
    return {
      title: "✨ Perfected prompt ready!",
      subtitle: "Love this tool? Support its growth"
    }
  }

  const message = getMessage()

  return (
    <div
      className="fixed bottom-4 right-4 z-50 w-full max-w-sm animate-in slide-in-from-bottom-2 duration-300"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="bg-card border border-border rounded-lg shadow-lg p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="font-medium text-sm mb-1">{message.title}</p>
            <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1.5">
              <Coffee className="size-3.5 text-amber-600 dark:text-amber-500" />
              {message.subtitle}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={handleSupport}
                className="bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-500 dark:hover:bg-amber-600"
              >
                <Coffee className="size-3.5 mr-1.5" />
                Buy Me a Coffee
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNotNow}
              >
                Not now
              </Button>
            </div>
            {showNeverOption && (
              <div className="mt-2 pt-2 border-t border-border">
                <button
                  onClick={handleNeverShow}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
                >
                  Don't show again
                </button>
                <span className="text-xs text-muted-foreground mx-2">•</span>
                <button
                  onClick={handleSnooze}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
                >
                  Remind me in 7 days
                </button>
              </div>
            )}
          </div>
          <button
            onClick={handleNotNow}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}