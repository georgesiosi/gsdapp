"use client"

import { useState, useEffect } from "react"
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ReasoningLogService } from "@/services/ai/reasoningLogService"
import { TaskType } from "@/types/task"
import { useTaskManagement } from "@/components/task/hooks/useTaskManagement"

interface TaskTypeIndicatorProps {
  taskId: string
  className?: string
}

export function TaskTypeIndicator({ taskId, className }: TaskTypeIndicatorProps) {
  const [taskType, setTaskType] = useState<TaskType | undefined>(undefined)
  const { updateTask } = useTaskManagement()
  
  // Load task type on mount and when taskId changes
  useEffect(() => {
    const log = ReasoningLogService.getLogForTask(taskId)
    console.log(`[DEBUG] TaskTypeIndicator - Loading task type for task ${taskId}:`, log?.taskType);
    
    if (log && log.taskType) {
      setTaskType(log.taskType)
    } else {
      setTaskType(undefined)
    }
  }, [taskId])
  
  // Toggle task type between personal and work
  const toggleTaskType = () => {
    const newType: TaskType = taskType === "personal" ? "work" : "personal";
    setTaskType(newType);
    updateTask(taskId, { taskType: newType });
    
    // Update the reasoning log
    const log = ReasoningLogService.getLogForTask(taskId)
    console.log(`[DEBUG] TaskTypeIndicator - Current reasoning log:`, log);
    
    if (log) {
      const updatedLog = {
        ...log,
        taskType: newType
      };
      console.log(`[DEBUG] TaskTypeIndicator - Updating reasoning log to:`, updatedLog);
      ReasoningLogService.storeLog(updatedLog)
      console.log(`[DEBUG] TaskTypeIndicator - Updated reasoning log for task ${taskId} with type ${newType}`);
    } else {
      console.log(`[DEBUG] TaskTypeIndicator - No reasoning log found for task ${taskId}`);
    }
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
            onClick={toggleTaskType}
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
