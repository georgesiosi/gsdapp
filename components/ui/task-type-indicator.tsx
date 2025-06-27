"use client"

import { useEffect, useState } from "react"
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { TaskType, Task } from "@/types/task"
import { useTaskManagement } from "@/components/task/hooks/useTaskManagement"

interface TaskTypeIndicatorProps {
  task: Task
  className?: string
}

export function TaskTypeIndicator({ task, className }: TaskTypeIndicatorProps) {
  const taskType = task.taskType || 'personal' // Default to personal if not set
  const { updateTask } = useTaskManagement()
  
  // Handle task type toggle
  const handleToggleTaskType = () => {
    const newTaskType: TaskType = taskType === 'personal' ? 'business' : 'personal'
    updateTask(task.id || task._id!, { taskType: newTaskType })
  }
  
  
  const getBackgroundColor = () => {
    if (taskType === "personal") return "bg-purple-500"
    if (taskType === "work" || taskType === "business") return "bg-green-500"
    return "bg-gray-300"
  }
  
  const getLabel = () => {
    if (taskType === "personal") return "P"
    if (taskType === "work" || taskType === "business") return "B" // Display "B" for work/business tasks
    return "?"
  }
  
  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <button 
            className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-white ${getBackgroundColor()} hover:opacity-90 ${className}`}
            onClick={handleToggleTaskType}
          >
            {getLabel()}
            <span className="sr-only">
              {taskType === "personal" ? "Personal task" : taskType === "work" ? "Work task" : taskType === "business" ? "Business task" : "Unknown task type"}
            </span>
          </button>
        </TooltipTrigger>
        <TooltipContent className="p-2" side="right">
          <div className="text-xs">
            {taskType === "personal" ? "Personal task" : taskType === "work" ? "Work/Business task" : taskType === "business" ? "Business task" : "Unknown task type"}
            <div className="text-xs text-muted-foreground mt-1">Click to change</div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
