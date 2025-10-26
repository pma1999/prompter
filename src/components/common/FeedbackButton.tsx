"use client"

import { Button } from "@/components/ui/button"
import { MessageSquare } from "lucide-react"
import { emitCommand } from "@/lib/commandBus"

export function FeedbackButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => emitCommand("open-feedback")}
      className="gap-2"
    >
      <MessageSquare className="size-4" />
      Feedback
    </Button>
  )
}