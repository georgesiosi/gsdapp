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

interface TaskModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddTask: (text: string) => void
  isAIThinking?: boolean
  aiReasoning?: string
  targetQuadrant?: string
}

export function TaskModal({ open, onOpenChange, onAddTask, isAIThinking = false, aiReasoning, targetQuadrant }: TaskModalProps) {
  const [newTask, setNewTask] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Debug log props
  useEffect(() => {
    console.log('[DEBUG TaskModal] Props received:', { 
      isOpen: open, 
      isAIThinking, 
      aiReasoning, 
      targetQuadrant 
    });
  }, [open, isAIThinking, aiReasoning, targetQuadrant]);

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
      // Note: We don't close the modal here - it will be closed after AI analysis
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
          <DialogTitle className="flex items-center gap-2">
            Add New Task
            {isAIThinking && <AIThinkingIndicator isThinking={isAIThinking} className="ml-2" />}
          </DialogTitle>
          {aiReasoning && (
            <div className="mt-2 text-sm text-muted-foreground">
              <p>AI Analysis: {aiReasoning}</p>
              {targetQuadrant && (
                <p className="mt-1">Suggested Quadrant: {targetQuadrant.toUpperCase()}</p>
              )}
            </div>
          )}
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
                  disabled={isSubmitting || isAIThinking}
                />
                <p className="text-xs text-muted-foreground">
                  {isAIThinking ? '🤔 AI is analyzing your task...' : '💡 Prefix with "idea:" to save to Ideas Bank'}
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
              {isAIThinking ? "Adding..." : "Add Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
