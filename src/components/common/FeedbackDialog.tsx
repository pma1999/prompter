"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { postFeedback } from "@/lib/api/feedback"
import { Coffee } from "lucide-react"

export function FeedbackDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [message, setMessage] = useState("")
  const [email, setEmail] = useState("")
  const [busy, setBusy] = useState(false)

  const resetForm = () => {
    setMessage("")
    setEmail("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (message.length < 10 || message.length > 2000) {
      toast.error("Message must be between 10 and 2000 characters.")
      return
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address.")
      return
    }

    setBusy(true)
    try {
      await postFeedback({ message: message.trim(), email: email.trim() || undefined })
      toast.success("Feedback sent! Thank you for helping us improve.")
      resetForm()
      onOpenChange(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to send feedback."
      toast.error(message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Send Feedback</DialogTitle>
          <DialogDescription>
            Your feedback helps us improve Prompt Perfection for everyone. Thank you!
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="message">Your feedback</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What do you think? Ideas, bugs, or praise—we'd love to hear it."
              rows={4}
              disabled={busy}
              required
            />
            <p className="text-xs text-muted-foreground">
              {message.length}/2000 characters
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Your email (optional)</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              disabled={busy}
            />
            <p className="text-xs text-muted-foreground">
              If you&apos;d like a response, leave your email.
            </p>
          </div>
          <DialogFooter className="flex-col gap-3 sm:flex-col">
            <Button type="submit" disabled={busy || message.length < 10} className="w-full">
              {busy ? "Sending..." : "Send Feedback"}
            </Button>
            <div className="border-t pt-3 text-center">
              <a
                href="https://buymeacoffee.com/pablomiar"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
              >
                <Coffee className="size-3.5 text-amber-600 dark:text-amber-500" />
                Enjoying Prompt Perfection? Support development →
              </a>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}