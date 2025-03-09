"use client"

import { useParams, useRouter } from "next/navigation"
import { useTaskManagement } from "@/components/task/hooks/useTaskManagement"
import { useCallback, useEffect, useState } from "react"
import { Task, TaskStatus, QuadrantType } from "@/types/task"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, Trash, Lightbulb } from "lucide-react"

export default function TaskDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const taskId = params.taskId as string
  const { tasks, updateTask, deleteTask } = useTaskManagement()
  
  const [task, setTask] = useState<Task | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<TaskStatus>('active')
  const [quadrant, setQuadrant] = useState<QuadrantType>('q4')
  const [isSaving, setIsSaving] = useState(false)

  // Load task data
  useEffect(() => {
    const currentTask = tasks.find(t => t.id === taskId)
    if (currentTask) {
      setTask(currentTask)
      setTitle(currentTask.text)
      setDescription(currentTask.description || '')
      setStatus(currentTask.status)
      setQuadrant(currentTask.quadrant)
    } else if (tasks.length > 0) {
      toast({
        title: "Task not found",
        description: "This task may have been deleted or does not exist",
        variant: "destructive",
      })
      router.push('/')
    }
  }, [taskId, tasks, router, toast])

  const handleSave = useCallback(() => {
    if (!task?.id) return
    
    setIsSaving(true)
    const result = updateTask(task.id, {
      text: title.trim(),
      description: description.trim(),
      status,
      quadrant,
    })
    
    if (!result.success) {
      toast({
        title: "Failed to save changes",
        description: "Please try again",
        variant: "destructive",
      })
    }
    setIsSaving(false)
  }, [task?.id, title, description, status, quadrant, updateTask, toast])

  const handleConvertToIdea = useCallback(() => {
    if (!task?.id) return
    
    window.dispatchEvent(new CustomEvent('addToIdeasBank', {
      detail: { 
        text: title.trim(),
        description: description.trim(),
        taskType: 'idea',
        sourceTask: task.id
      }
    }))

    const result = deleteTask(task.id)
    if (result.success) {
      router.push('/')
    } else {
      toast({
        title: "Failed to convert task",
        description: "Please try again",
        variant: "destructive",
      })
    }
  }, [task?.id, title, description, deleteTask, router, toast])

  const handleDelete = useCallback(() => {
    if (!task?.id) return
    
    const result = deleteTask(task.id)
    if (result.success) {
      router.push('/')
    } else {
      toast({
        title: "Failed to delete task",
        description: "Please try again",
        variant: "destructive",
      })
    }
  }, [task?.id, deleteTask, router, toast])

  // Simple keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return
      
      switch (e.key) {
        case 'Escape': router.push('/'); break
        case 'i': handleConvertToIdea(); break
        case 'Delete': handleDelete(); break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [router, handleConvertToIdea, handleDelete])

  if (!task) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-32">
          <div className="text-muted-foreground">Loading task details...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            className="gap-2"
            onClick={() => router.push('/')}
            title="Press 'Esc' to go back"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-4">
            {isSaving && <span className="text-sm text-muted-foreground">Saving...</span>}
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleConvertToIdea}
              disabled={isSaving}
              title="Press 'i' to move to Ideas Bank"
            >
              <Lightbulb className="h-4 w-4" />
              Move to Ideas
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="gap-2"
              onClick={handleDelete}
              disabled={isSaving}
              title="Press 'Delete' to remove task"
            >
              <Trash className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        {/* Task Title */}
        <div className="space-y-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => title.trim() !== task.text && handleSave()}
            className="text-2xl font-bold"
            placeholder="Task title"
          />
        </div>

        {/* Task Details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <h2 className="text-sm font-medium">Status</h2>
            <Select value={status} onValueChange={(value: TaskStatus) => {
              setStatus(value)
              handleSave()
            }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <h2 className="text-sm font-medium">Quadrant</h2>
            <Select value={quadrant} onValueChange={(value: QuadrantType) => {
              setQuadrant(value)
              handleSave()
            }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="q1">Urgent & Important</SelectItem>
                <SelectItem value="q2">Important, Not Urgent</SelectItem>
                <SelectItem value="q3">Urgent, Not Important</SelectItem>
                <SelectItem value="q4">Not Urgent or Important</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Task Description */}
        <div className="space-y-2">
          <h2 className="text-sm font-medium">Description</h2>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => description.trim() !== (task.description || '') && handleSave()}
            placeholder="Add more details about this task..."
            className="min-h-[200px]"
          />
        </div>

        {/* Metadata */}
        <div className="text-sm text-muted-foreground">
          Created on {new Date(task.createdAt).toLocaleDateString()}
          {task.completedAt && (
            <> · Completed on {new Date(task.completedAt).toLocaleDateString()}</>
          )}
        </div>
      </div>
    </div>
  )
}
