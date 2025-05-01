"use client"

import { useParams, useRouter } from "next/navigation"
import { useTaskManagement } from "@/components/task/hooks/useTaskManagement"
import { useCallback, useEffect, useState } from "react"
import { Task, TaskStatus, QuadrantKeys, TaskOrIdeaType } from "@/types/task"; 
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
import { LinkIcon, TrashIcon, CalendarIcon, SaveIcon, EditIcon, CheckIcon, RefreshCwIcon, BanIcon, ArrowLeftIcon, Loader2, Lightbulb, ArrowLeft } from "lucide-react" 
import { DatePicker } from "@/components/ui/date-picker"
import { format } from 'date-fns';
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';

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
  const [quadrant, setQuadrant] = useState<QuadrantKeys>('q4')
  const [isSaving, setIsSaving] = useState(false)
  const [dueDate, setDueDate] = useState<Date | null>(null)

  // Fetch all goals
  const allGoals = useQuery(api.goals.getAllGoals);
  // Find the specific goal in the frontend
  const goal = task?.goalId && allGoals ? allGoals.find(g => g._id === task.goalId) : undefined;

  // Load task data
  useEffect(() => {
    const currentTask = tasks.find(t => t.id === taskId)
    if (currentTask) {
      setTask(currentTask)
      setTitle(currentTask.text)
      setDescription(currentTask.description || '')
      setStatus(currentTask.status)
      setQuadrant(currentTask.quadrant)
      setDueDate(currentTask.dueDate ? new Date(currentTask.dueDate) : null)
    } else if (tasks.length > 0 && taskId) { // Check taskId exists before redirecting
      // Only redirect if tasks are loaded and the specific task isn't found
      const taskExists = tasks.some(t => t.id === taskId)
      if (!taskExists) {
        toast({
          title: "Task not found",
          description: "This task may have been deleted or does not exist.",
          variant: "destructive",
        })
        router.push('/')
      }
    }
  }, [taskId, tasks, router, toast])

  // Save handler - accepts optional new date for immediate saving scenarios
  const handleSave = useCallback(async (newDueDate?: Date | null) => {
    if (!task?.id) return

    // Determine the due date to save: use the passed argument if available, else use state
    // If newDueDate is explicitly passed as null, use null. If undefined, use state.
    const dateToSave = newDueDate !== undefined ? newDueDate : dueDate;

    setIsSaving(true)
    try {
      const result = await updateTask(task.id, {
        text: title.trim(),
        description: description.trim(),
        status,
        quadrant,
        // Format the determined date for saving
        dueDate: dateToSave ? format(dateToSave, 'yyyy-MM-dd') : null,
      })

      if (!result.success) {
        toast({
          title: "Failed to save changes",
          description: result.error || "Please try again",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error saving task:", error);
      toast({
        title: "Failed to save changes",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    }
    setIsSaving(false)
  }, [
    task?.id, 
    title, 
    description, 
    status, 
    quadrant, 
    dueDate, // Keep state dueDate in dependencies for saves triggered by other fields
    updateTask, 
    toast
  ])

  // Convert to Idea handler
  const handleConvertToIdea = useCallback(async () => {
    if (!task?.id) return

    window.dispatchEvent(new CustomEvent('addToIdeasBank', {
      detail: { 
        text: title.trim(),
        description: description.trim(),
        taskType: 'idea',
        sourceTask: task.id
      }
    }))

    try {
      const result = await deleteTask(task.id)
      if (result.success) {
        router.push('/')
      } else {
        toast({
          title: "Failed to convert task",
          description: result.error || "Please try again",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error converting task:", error);
      toast({
        title: "Failed to convert task",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    }
  }, [task?.id, title, description, deleteTask, router, toast])

  // Delete handler
  const handleDelete = useCallback(async () => {
    if (!task?.id) return

    try {
      const result = await deleteTask(task.id)
      if (result.success) {
        router.push('/')
      } else {
        toast({
          title: "Failed to delete task",
          description: result.error || "Please try again",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      toast({
        title: "Failed to delete task",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    }
  }, [task?.id, deleteTask, router, toast])

  // Keydown handler for shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement) {
      return; // Don't trigger shortcuts if typing in input/textarea
    }

    switch (e.key) {
      case 'Escape': router.push('/'); break
      case 'i': handleConvertToIdea(); break
      case 'Delete': handleDelete(); break
    }
  }, [router, handleConvertToIdea, handleDelete])

  // Helper function to format dates
  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), "MMM d, yyyy p");
    } catch (error) {
      console.error("Error formatting date:", dateString, error);
      return 'Invalid Date';
    }
  };

  // Type-safe handlers for Select components
  const handleStatusChange = (value: string) => {
    setStatus(value as TaskStatus);
  };

  const handleQuadrantChange = (value: string) => {
    setQuadrant(value as QuadrantKeys);
  };

  if (!task) {
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-10rem)]">
        <Loader2 className="h-16 w-16 animate-spin text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Loading task details...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      {/* Header: Back Button & Action Buttons */}
      <div className="flex justify-between items-center mb-4 md:mb-6">
        <Link href="/tasks" title="Back to Task List">
          <Button variant="outline" size="icon"> 
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
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
            <TrashIcon className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Task Title */}
      <div className="mb-4 md:mb-6">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => title.trim() !== task.text && handleSave()}
          className="text-2xl font-semibold bg-transparent shadow-none px-0 h-auto py-1 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          placeholder="Task title"
        />
      </div>

      {/* Main Content Area (Two Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        {/* Left Column (Description - takes up 2/3 width on medium screens) */}
        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="task-description">Description</Label>
          <Textarea
            id="task-description"
            className="min-h-[200px] text-base border-0 shadow-none bg-transparent px-0 py-1 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder="Add a detailed description..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isSaving}
          />
        </div>

        {/* Right Column (Metadata - takes up 1/3 width) */}
        <div className="space-y-6">
          {/* Group 1: Core Attributes */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="task-status">Status</Label>
              <Select value={status} onValueChange={handleStatusChange} disabled={isSaving} >
                <SelectTrigger id="task-status">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="task-quadrant">Quadrant</Label>
              <Select value={quadrant} onValueChange={handleQuadrantChange} disabled={isSaving}>
                <SelectTrigger id="task-quadrant">
                  <SelectValue placeholder="Select Quadrant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="q1">Urgent & Important</SelectItem>
                  <SelectItem value="q2">Important, Not Urgent</SelectItem>
                  <SelectItem value="q3">Urgent, Not Important</SelectItem>
                  <SelectItem value="q4">Not Urgent or Important</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="task-due-date">Due Date</Label>
              <DatePicker
                date={dueDate === null ? undefined : dueDate}
                setDate={(date: Date | undefined) => {
                  const newDate = date || null;
                  setDueDate(newDate) // Update state as well
                  // Pass the new date directly to handleSave
                  handleSave(newDate) 
                }}
              />
            </div>
          </div>

          <Separator />

          {/* Group 2: Classification */}
          <div className="space-y-4">
            <div>
              <Label>Task Type</Label>
              <div className="mt-1">
                <Badge variant={task.taskType === 'personal' ? 'default' : task.taskType === 'work' ? 'secondary' : 'outline'} className="text-sm py-1 px-3">
                  {task.taskType ? task.taskType.charAt(0).toUpperCase() + task.taskType.slice(1) : 'Unspecified'}
                </Badge>
              </div>
            </div>
            <div>
              <Label>Attached Goal</Label>
              <div className="mt-1 min-h-[36px] flex items-center"> {/* Ensures consistent height */} 
                {task?.goalId ? (
                  goal ? (
                    <Link href={`/goals/${goal._id}`} className="block" title={`View goal: ${goal.title}`}>
                      <Badge variant="secondary" className="text-sm py-1 px-3 hover:bg-accent cursor-pointer truncate">
                        <LinkIcon className="h-3 w-3 mr-1.5" />
                        {goal.title}
                      </Badge>
                    </Link>
                  ) : allGoals ? (
                    <Badge variant="outline" className="text-sm py-1 px-3 text-muted-foreground">Goal not found</Badge> // Goal ID exists but not found in query result
                  ) : (
                    <Badge variant="outline" className="text-sm py-1 px-3">Loading goal...</Badge> // Goals are still loading
                  )
                ) : (
                  <Badge variant="outline" className="text-sm py-1 px-3 text-muted-foreground">None</Badge>
                )}
              </div>
            </div>
          </div>

          {/* Group 3: Reflection - Conditionally Render Separator*/} 
          {task.reflection && <Separator />} 
          {task.reflection && (
            <div className="space-y-2">
               <Label>Reflection</Label>
                <Card className="mt-1">
                  <CardHeader>
                    <CardTitle className="text-lg">Reflection Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    {task.reflection.justification && (
                      <div>
                        <p className="font-medium text-muted-foreground">Justification:</p>
                        <p>{task.reflection.justification}</p>
                      </div>
                    )}
                    {task.reflection.aiAnalysis && (
                      <div>
                        <p className="font-medium text-muted-foreground">AI Analysis:</p>
                        <p className="whitespace-pre-wrap">{task.reflection.aiAnalysis}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      {task.reflection.suggestedQuadrant && (
                        <div>
                          <p className="font-medium text-muted-foreground">Suggested Quadrant:</p>
                          <Badge variant="outline">{task.reflection.suggestedQuadrant.toUpperCase()}</Badge>
                        </div>
                      )}
                       {task.reflection.finalQuadrant && (
                        <div>
                          <p className="font-medium text-muted-foreground">Final Quadrant:</p>
                           <Badge variant="secondary">{task.reflection.finalQuadrant.toUpperCase()}</Badge>
                        </div>
                      )}
                    </div>
                    {task.reflection.feedback && (
                      <div>
                        <p className="font-medium text-muted-foreground">Feedback:</p>
                        <p>{task.reflection.feedback}</p>
                      </div>
                    )}
                    {task.reflection.content && (
                      <div>
                        <p className="font-medium text-muted-foreground">Reflection Content:</p>
                        <p className="whitespace-pre-wrap">{task.reflection.content}</p>
                      </div>
                    )}
                     <div>
                       <p className="font-medium text-muted-foreground">Reflected At:</p>
                       <p>{format(new Date(task.reflection.reflectedAt), "PPP p")}</p>
                     </div>
                  </CardContent>
                </Card>
             </div>
          )}

          {/* Group 4: Timestamps */} 
          <div className="space-y-1 text-xs text-muted-foreground pt-2">
            <Separator className="mb-2"/>
            <p>Created: {formatDate(task.createdAt)}</p>
            <p>Updated: {formatDate(task.updatedAt)}</p>
            {task.completedAt && <p>Completed: {formatDate(task.completedAt)}</p>}
          </div>

        </div>
      </div>
    </div>
  )
}
