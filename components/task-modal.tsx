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
  isAIThinking?: boolean
  aiReasoning?: string
  targetQuadrant?: string
  aiError?: boolean
}

export function TaskModal({ open, onOpenChange, onAddTask, isAIThinking = false, aiReasoning, targetQuadrant, aiError = false }: TaskModalProps) {
  const [newTask, setNewTask] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Debug log props
  useEffect(() => {
    console.log('[DEBUG TaskModal] Props received:', { 
      isOpen: open, 
      isAIThinking, 
      aiReasoning, 
      targetQuadrant,
      aiError
    });
  }, [open, isAIThinking, aiReasoning, targetQuadrant, aiError]);

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
            {aiError && !isAIThinking && (
              <div className="inline-flex items-center gap-1 text-xs font-medium text-yellow-500 ml-2">
                <AlertTriangle className="h-4 w-4" />
                <span>AI Unavailable</span>
              </div>
            )}
          </DialogTitle>
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
                  disabled={isSubmitting || isAIThinking}
                />
                <p className={cn(
                  "text-xs",
                  isAIThinking ? "text-blue-500" : 
                  aiError ? "text-yellow-500" : 
                  "text-muted-foreground"
                )}>
                  {isAIThinking ? '🤔 AI is analyzing your task...' : 
                   aiError ? '⚠️ AI analysis unavailable - task will be added to Q4' : 
                   '💡 Prefix with "idea:" to save to Ideas Bank'}
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
              {isAIThinking ? "Adding..." : aiError ? "Add Task (Q4)" : "Add Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
