"use client"

import { useState, useEffect } from "react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AIThinkingIndicator } from "@/components/ui/ai-thinking-indicator"
import { TaskCreationSuggestions } from "@/components/ui/task-creation-suggestions"
import { AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

interface TaskModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddTask: (text: string) => void
  aiReasoning?: string
  targetQuadrant?: string
  aiError?: boolean
}

export function TaskModal({ open, onOpenChange, onAddTask, aiReasoning, targetQuadrant, aiError = false }: TaskModalProps) {
  const [newTask, setNewTask] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Debug log props
  useEffect(() => {
    // Ensure all dependencies are included in a stable order
    const debugProps = {
      open,
      aiReasoning: aiReasoning || null,
      targetQuadrant: targetQuadrant || null,
      aiError
    };
    console.log('[DEBUG TaskModal] Props received:', debugProps);
  }, [open, aiReasoning, targetQuadrant, aiError]);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setNewTask("")
      setIsSubmitting(false)
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newTask.trim() && !isSubmitting) {
      setIsSubmitting(true)
      console.log('[DEBUG] Submitting task:', newTask.trim());
      onAddTask(newTask.trim()) // The quadrant will be determined by AI
      // Close modal immediately
      onOpenChange(false)
      setNewTask("")
      setIsSubmitting(false)
    }
  }

  // Handle keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Command+N (Mac) or Ctrl+N (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault() // Prevent default browser behavior
        onOpenChange(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
          {/* AI reasoning section removed as per user request */}
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Input
                  id="task"
                  placeholder="What needs to be done? (Start with 'idea:' to save to Ideas Bank)"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  autoFocus
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground">
                  💡 Prefix with "idea:" to save to Ideas Bank
                </p>
              </div>
              <TaskCreationSuggestions taskText={newTask} />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!newTask.trim() || isSubmitting}
            >
              {isSubmitting ? "Adding..." : aiError ? "Add Task (Q4)" : "Add Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
