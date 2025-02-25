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
  onCancel: () => void
  onSubmit: (taskId: string, justification: string) => Promise<any>
}

const QUICK_JUSTIFICATIONS = [
  "It's a necessary prerequisite for my goal",
  "It reduces blockers for important tasks",
  "It maintains work-life balance",
]

export function ReflectionCard({ task, onCancel, onSubmit }: ReflectionCardProps) {
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
      await onSubmit(task.id, justification)
      toast({
        title: "Reflection Saved",
        description: "Thank you for reflecting on this task",
      })
      onCancel()
    } catch {
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
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2 text-amber-500">
            <Lightbulb className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Task Reflection</h3>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            This task may not align with your goals. Please reflect on why it's important.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-1">Task</h4>
              <p className="text-sm p-2 bg-muted rounded-md">{task.text}</p>
            </div>
            
            <div>
              <h4 className="font-medium mb-1">Why is this task important?</h4>
              <Input
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Explain how this task relates to your goals..."
                className="w-full"
              />
            </div>
            
            <div>
              <h4 className="font-medium mb-1">Quick Responses</h4>
              <div className="flex flex-wrap gap-2">
                {QUICK_JUSTIFICATIONS.map((text) => (
                  <Button
                    key={text}
                    variant="outline"
                    size="sm"
                    onClick={() => setJustification(text)}
                    className="text-xs"
                  >
                    {text}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Reflection"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
