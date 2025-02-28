"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Task, TaskType } from "@/types/task"
import { BarChart3, Info } from "lucide-react"
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface VelocityMeterProps {
  tasks: Task[]
  type: TaskType
  position: "left" | "right"
  className?: string
}

export function VelocityMeter({ 
  tasks, 
  type, 
  position, 
  className 
}: VelocityMeterProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isPulsing, setIsPulsing] = useState(false)
  const [prevCompletedCount, setPrevCompletedCount] = useState(0)
  
  // Filter tasks by type and get counts
  // Handle both undefined taskType (treat as personal) and explicit type
  const typeTasks = tasks.filter(task => {
    if (type === "personal") {
      return task.taskType === "personal" || task.taskType === undefined;
    }
    return task.taskType === type;
  });
  
  const totalTasks = typeTasks.length
  const completedTasks = typeTasks.filter(task => task.completed).length
  const pendingTasks = totalTasks - completedTasks
  
  // Check if a task was just completed and trigger pulse animation
  useEffect(() => {
    if (completedTasks > prevCompletedCount && prevCompletedCount > 0) {
      setIsPulsing(true)
      const timer = setTimeout(() => {
        setIsPulsing(false)
      }, 1000)
      return () => clearTimeout(timer)
    }
    setPrevCompletedCount(completedTasks)
  }, [completedTasks, prevCompletedCount])
  
  // Calculate percentages for visualization
  const completionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
  
  // Get tasks by quadrant
  const q1Tasks = typeTasks.filter(task => task.quadrant === "q1")
  const q2Tasks = typeTasks.filter(task => task.quadrant === "q2")
  const q3Tasks = typeTasks.filter(task => task.quadrant === "q3")
  const q4Tasks = typeTasks.filter(task => task.quadrant === "q4")
  
  // Calculate completion by quadrant
  const q1Completed = q1Tasks.filter(task => task.completed).length
  const q2Completed = q2Tasks.filter(task => task.completed).length
  const q3Completed = q3Tasks.filter(task => task.completed).length
  const q4Completed = q4Tasks.filter(task => task.completed).length
  
  // Get today's tasks and completed tasks
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const todayTasks = typeTasks.filter(task => {
    try {
      // Handle both string and number date formats
      let taskCreatedAt = task.createdAt;
      
      // Convert to number if it's a string that looks like a number
      if (typeof taskCreatedAt === 'string' && !isNaN(Number(taskCreatedAt))) {
        taskCreatedAt = Number(taskCreatedAt);
      }
      
      // Create date object
      const taskDate = new Date(taskCreatedAt);
      
      // Check if date is valid
      if (isNaN(taskDate.getTime())) {
        console.log(`[VelocityMeter] Invalid date for task ${task.id}:`, taskCreatedAt);
        return false;
      }
      
      taskDate.setHours(0, 0, 0, 0);
      
      // Safe logging without toISOString which can throw errors
      console.log(`[VelocityMeter] Task ${task.id} created at:`, taskCreatedAt);
      console.log(`[VelocityMeter] Task date timestamp:`, taskDate.getTime());
      console.log(`[VelocityMeter] Today timestamp:`, today.getTime());
      console.log(`[VelocityMeter] Is today's task:`, taskDate.getTime() === today.getTime());
      
      return taskDate.getTime() === today.getTime();
    } catch (error) {
      console.error(`[VelocityMeter] Error processing date for task ${task.id}:`, error);
      return false;
    }
  });
  
  // Debug logging
  console.log(`[VelocityMeter] Type: ${type}, Total tasks: ${totalTasks}, Completed: ${completedTasks}`);
  console.log(`[VelocityMeter] Today's tasks: ${todayTasks.length}`);
  
  const todayCompleted = todayTasks.filter(task => task.completed).length
  
  console.log(`[VelocityMeter] Today's completed: ${todayCompleted}`);
  
  // Determine color scheme based on task type
  const colorScheme = type === "personal" 
    ? { 
        primary: "bg-blue-500", 
        secondary: "bg-blue-300",
        muted: "bg-blue-100",
        text: "text-blue-700",
        hover: "hover:bg-blue-600"
      }
    : {
        primary: "bg-green-500",
        secondary: "bg-green-300",
        muted: "bg-green-100",
        text: "text-green-700",
        hover: "hover:bg-green-600"
      }
  
  return (
    <div 
      className={cn(
        "velocity-meter fixed top-0 bottom-0 w-5 flex flex-col items-center justify-end transition-all duration-300 z-50",
        position === "left" ? "left-0 rounded-r-md" : "right-0 rounded-l-md",
        isExpanded ? "w-16" : "hover:w-8",
        isPulsing && "pulse",
        colorScheme.muted,
        className
      )}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Meter fill */}
      <div 
        className={cn(
          "absolute bottom-0 w-full transition-all duration-500",
          colorScheme.primary
        )}
        style={{ 
          height: `${completionPercentage}%`,
          opacity: completedTasks > 0 ? 0.8 : 0.4
        }}
      />
      
      {/* Today's tasks indicator */}
      {todayTasks.length > 0 && (
        <div 
          className={cn(
            "absolute w-full py-1 flex items-center justify-center",
            colorScheme.secondary,
            isExpanded ? "px-2" : ""
          )}
          style={{ 
            bottom: `${completionPercentage}%`,
            height: `${(todayTasks.length / totalTasks) * 100}%`,
            minHeight: "20px",
            opacity: 0.8
          }}
        >
          {isExpanded && (
            <span className="text-xs font-bold text-white">
              {todayCompleted}/{todayTasks.length}
            </span>
          )}
        </div>
      )}
      
      {/* Info section at top */}
      <div className={cn(
        "absolute top-4 flex flex-col items-center",
        isExpanded ? "w-full px-2" : "w-full"
      )}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn(
                "rounded-full p-1 mb-1",
                colorScheme.primary,
                "cursor-pointer"
              )}>
                {isExpanded ? (
                  <BarChart3 size={14} className="text-white" />
                ) : (
                  <Info size={12} className="text-white" />
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent side={position === "left" ? "right" : "left"}>
              <p className="text-xs font-medium">{type === "personal" ? "Personal" : "Work"} Tasks</p>
              <p className="text-xs">Completed: {completedTasks}/{totalTasks}</p>
              <p className="text-xs">Today: {todayCompleted}/{todayTasks.length}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        {isExpanded && (
          <div className="text-center mt-2">
            <p className={cn("text-xs font-bold", colorScheme.text)}>
              {type === "personal" ? "Personal" : "Work"}
            </p>
            <p className="text-xs font-medium mt-1">
              {completedTasks}/{totalTasks}
            </p>
          </div>
        )}
      </div>
      
      {/* Quadrant indicators (only when expanded) */}
      {isExpanded && (
        <div className="absolute bottom-4 w-full px-2">
          <div className="space-y-2">
            <QuadrantIndicator 
              label="Q1" 
              total={q1Tasks.length} 
              completed={q1Completed} 
              colorScheme={colorScheme} 
            />
            <QuadrantIndicator 
              label="Q2" 
              total={q2Tasks.length} 
              completed={q2Completed} 
              colorScheme={colorScheme} 
            />
            <QuadrantIndicator 
              label="Q3" 
              total={q3Tasks.length} 
              completed={q3Completed} 
              colorScheme={colorScheme} 
            />
            <QuadrantIndicator 
              label="Q4" 
              total={q4Tasks.length} 
              completed={q4Completed} 
              colorScheme={colorScheme} 
            />
          </div>
        </div>
      )}
    </div>
  )
}

interface QuadrantIndicatorProps {
  label: string
  total: number
  completed: number
  colorScheme: {
    primary: string
    secondary: string
    muted: string
    text: string
    hover: string
  }
}

function QuadrantIndicator({ 
  label, 
  total, 
  completed, 
  colorScheme 
}: QuadrantIndicatorProps) {
  if (total === 0) return null
  
  const completionPercentage = (completed / total) * 100
  
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium">{label}</span>
      <div className="w-8 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={cn("h-full", colorScheme.primary)}
          style={{ width: `${completionPercentage}%` }}
        />
      </div>
    </div>
  )
}
