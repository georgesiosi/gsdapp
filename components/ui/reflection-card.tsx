"use client"

import { useState } from "react"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Task } from "@/types/task"
import { useToast } from "@/components/ui/use-toast"
import { Lightbulb, Loader2 } from "lucide-react"

interface ReflectionCardProps {
  task: Task
  onClose: () => void
  onReflectionComplete: (taskId: string, justification: string) => Promise<void>
}

const QUICK_JUSTIFICATIONS = [
  "It's a necessary prerequisite for my goal",
  "It reduces blockers for important tasks",
  "It maintains work-life balance",
]

export function ReflectionCard({ task, onClose, onReflectionComplete }: ReflectionCardProps) {
  const [justification, setJustification] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async () => {
    if (!justification.trim()) {
      toast({
        title: "Justification Required",
        description: "Please explain how this task relates to your goals",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      await onReflectionComplete(task.id, justification)
      toast({
        title: "Reflection Saved",
        description: "Thank you for reflecting on this task",
      })
      onClose()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save reflection",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-start gap-2">
          <Lightbulb className="h-5 w-5 text-primary mt-1" />
          <div>
            <h3 className="font-semibold">Quick Reflection</h3>
            <p className="text-sm text-muted-foreground">
              How does "{task.text}" support your current goal?
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          value={justification}
          onChange={(e) => setJustification(e.target.value)}
          placeholder="Enter your justification..."
          disabled={isSubmitting}
        />
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Quick options:</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_JUSTIFICATIONS.map((text) => (
              <Button
                key={text}
                variant="outline"
                size="sm"
                onClick={() => setJustification(text)}
                disabled={isSubmitting}
              >
                {text}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="ghost"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Skip for now
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing
            </>
          ) : (
            "Save Reflection"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
