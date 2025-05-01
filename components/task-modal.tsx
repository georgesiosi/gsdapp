"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox";
import { QuadrantKeys } from "@/types/task";
import { Task } from '@/types/task';
import { Textarea } from "@/components/ui/textarea";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { DatePicker } from "@/components/ui/date-picker";

interface TaskModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddTask: (text: string, goalId?: Id<"goals">, dueDate?: string) => void
  onDeleteTask?: (taskId: Id<"tasks">) => void
  aiReasoning?: string
  targetQuadrant?: string
  aiError?: boolean
  availableGoals?: { _id: Id<"goals">, title: string }[]
}

export function TaskModal({ open, onOpenChange, onAddTask, onDeleteTask, aiReasoning, targetQuadrant, aiError = false, availableGoals }: TaskModalProps) {
  const [newTask, setNewTask] = useState("")
  const [selectedGoalId, setSelectedGoalId] = useState<string>("none");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false)

  const activeGoals = useQuery(api.goals.getActiveGoals);
  const goals = availableGoals || activeGoals;

  useEffect(() => {
    const debugProps = {
      open,
      aiReasoning: aiReasoning || null,
      targetQuadrant: targetQuadrant || null,
      aiError
    };
    console.log('[DEBUG TaskModal] Props received:', debugProps);
  }, [open, aiReasoning, targetQuadrant, aiError]);

  useEffect(() => {
    if (open) {
      setNewTask("")
      setSelectedGoalId("none");
      setDueDate(undefined);
      setIsSubmitting(false)
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newTask.trim() && !isSubmitting) {
      setIsSubmitting(true)
      console.log('[DEBUG] Submitting task:', newTask.trim());
      const goalIdToSubmit = selectedGoalId === "none" ? undefined : selectedGoalId as Id<"goals">;
      const formattedDueDate = dueDate ? format(dueDate, 'yyyy-MM-dd') : undefined;
      onAddTask(newTask.trim(), goalIdToSubmit, formattedDueDate);
      onOpenChange(false)
      setNewTask("")
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault() 
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
              <div className="space-y-2">
                <Label htmlFor="goal-select">Link to Goal (Optional)</Label>
                <Select 
                  value={selectedGoalId}
                  onValueChange={setSelectedGoalId}
                  disabled={isSubmitting || !goals}
                >
                  <SelectTrigger id="goal-select">
                    <SelectValue placeholder="Select a goal..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {goals?.map((goal) => (
                      <SelectItem key={goal._id.toString()} value={goal._id.toString()}>
                        {goal.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="due-date">Due Date (Optional)</Label>
                <DatePicker date={dueDate} setDate={setDueDate} />
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
