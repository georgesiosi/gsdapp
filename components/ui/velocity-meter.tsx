"use client";

import { useState, useEffect, useMemo, memo, useCallback, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Task, TaskType } from "@/types/task";
import { BarChart3, Info } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { isTaskFromToday } from '@/utils/dateUtils';

interface VelocityMeterProps {
  tasks: Task[];
  type: TaskType;
  position: "left" | "right";
  className?: string;
}

// Memoized button component to prevent re-renders
const IconButton = memo(forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { icon: React.ReactNode }>(
  ({ icon, className, ...props }, ref) => (
    <button 
      ref={ref}
      className={className}
      {...props}
    >
      {icon}
    </button>
  )
));
IconButton.displayName = 'IconButton';

export const VelocityMeter = memo(({ 
  tasks, 
  type, 
  position, 
  className 
}: VelocityMeterProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const [prevCompletedCount, setPrevCompletedCount] = useState(0);

  // Filter tasks by type and get counts
  const typeTasks = useMemo(() => tasks.filter(task => {
    // Include task if:
    // 1. It was completed today, OR
    // 2. It's still active (regardless of when it was created)
    const isCompletedToday = task.status === 'completed' && task.completedAt && isTaskFromToday(task);
    const isActive = task.status === 'active';
    if (!isCompletedToday && !isActive) return false;
    
    // For personal meter, include tasks with taskType="personal" or undefined
    if (type === "personal") {
      return task.taskType === "personal" || task.taskType === undefined;
    }
    // For work meter, include tasks with taskType="work" or "business"
      return task.taskType === type || task.taskType === "business";
  }), [tasks, type]);
  
  // Get all active and completed tasks in the matrix (excluding archived/deleted)
  const nonArchivedTasks = useMemo(() => typeTasks.filter(task => 
    task.status === 'active' || task.status === 'completed'
  ), [typeTasks])
  
  const activeTasks = useMemo(() => 
    nonArchivedTasks.filter(task => task.status === 'active')
  , [nonArchivedTasks])
  
  const completedTasksArray = useMemo(() => 
    nonArchivedTasks.filter(task => task.status === 'completed')
  , [nonArchivedTasks])
  
  const completedTasksCount = completedTasksArray.length
  const totalTasks = activeTasks.length + completedTasksCount

  // Check if a task was just completed and trigger pulse animation
  useEffect(() => {
    if (completedTasksCount > prevCompletedCount && prevCompletedCount > 0) {
      setIsPulsing(true);
      const timer = setTimeout(() => {
        setIsPulsing(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
    setPrevCompletedCount(completedTasksCount);
  }, [completedTasksCount, prevCompletedCount]);
  
  // Memoized values for quadrant tasks to prevent excessive recalculations
  const { q1Tasks, q2Tasks, q3Tasks, q4Tasks } = useMemo(() => ({
    q1Tasks: nonArchivedTasks.filter(task => task.quadrant === "q1"),
    q2Tasks: nonArchivedTasks.filter(task => task.quadrant === "q2"),
    q3Tasks: nonArchivedTasks.filter(task => task.quadrant === "q3"),
    q4Tasks: nonArchivedTasks.filter(task => task.quadrant === "q4")
  }), [nonArchivedTasks])
  
  // Calculate completion by quadrant
  const { q1Completed, q2Completed, q3Completed, q4Completed } = useMemo(() => ({
    q1Completed: q1Tasks.filter(task => task.status === 'completed').length,
    q2Completed: q2Tasks.filter(task => task.status === 'completed').length,
    q3Completed: q3Tasks.filter(task => task.status === 'completed').length,
    q4Completed: q4Tasks.filter(task => task.status === 'completed').length
  }), [q1Tasks, q2Tasks, q3Tasks, q4Tasks])
  
  // Calculate percentages for visualization
  const completionPercentage = totalTasks > 0 ? (completedTasksCount / totalTasks) * 100 : 0
  
  // Determine color scheme based on task type
  const colorScheme = type === "personal" 
    ? { 
        primary: "bg-[hsl(var(--blue))]", 
        secondary: "bg-[hsl(var(--blue)/0.7)]",
        muted: "bg-[hsl(var(--blue)/0.2)]",
        text: "text-[hsl(var(--blue))]",
        hover: "hover:bg-[hsl(var(--blue)/0.9)]"
      }
    : {
        primary: "bg-green-500",
        secondary: "bg-green-300",
        muted: "bg-green-100",
        text: "text-green-700",
        hover: "hover:bg-green-600"
      };
  
  // Use stable callbacks for event handlers
  const handleMouseEnter = useCallback(() => {
    setIsExpanded(true);
  }, []);
  
  const handleMouseLeave = useCallback(() => {
    setIsExpanded(false);
  }, []);
  
  // Memoize the icon to prevent unnecessary re-renders
  const icon = useMemo(() => {
    return isExpanded 
      ? <BarChart3 size={14} className="text-white" />
      : <Info size={12} className="text-white info-icon" />
  }, [isExpanded]);

  return (
    <div 
      className={cn(
        "velocity-meter fixed top-0 bottom-0 w-5 flex flex-col items-center justify-end transition-all duration-300 z-10",
        position === "left" ? "left-0 rounded-r-md" : "right-0 rounded-l-md",
        isExpanded ? "w-16" : "hover:w-8",
        isPulsing && "pulse",
        colorScheme.muted,
        className
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Meter fill */}
      <div 
        className={cn(
          "absolute bottom-0 w-full transition-all duration-500",
          colorScheme.primary
        )}
        style={{ 
          height: `${completionPercentage}%`,
          opacity: completedTasksCount > 0 ? 0.8 : 0.4
        }}
      />
      
      {/* Info section at top */}
      <div className={cn(
        "absolute top-4 flex flex-col items-center",
        isExpanded ? "w-full px-2" : "w-full"
      )}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <IconButton 
                icon={icon}
                type="button"
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  "rounded-full p-1 mb-1 inline-flex items-center justify-center",
                  colorScheme.primary,
                  "cursor-pointer",
                  !isExpanded && "info-container"
                )}
                aria-label={`${type} tasks info`}
              />
            </TooltipTrigger>
            <TooltipContent side={position === "left" ? "right" : "left"}>
              <p className="text-xs font-medium">{type === "personal" ? "Personal" : "Work"} Tasks</p>
              <p className="text-xs">Tasks: {completedTasksCount}/{totalTasks}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        {isExpanded && (
          <div className="text-center mt-2">
            <p className={cn("text-xs font-bold", colorScheme.text)}>
              {type === "personal" ? "Personal" : "Work"}
            </p>
            <p className="text-xs font-medium mt-1">
              {completedTasksCount}/{totalTasks}
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
  );
});

VelocityMeter.displayName = 'VelocityMeter';

interface QuadrantIndicatorProps {
  label: string;
  total: number;
  completed: number;
  colorScheme: {
    primary: string;
    secondary: string;
    muted: string;
    text: string;
    hover: string;
  };
}

function QuadrantIndicator({ 
  label, 
  total, 
  completed, 
  colorScheme 
}: QuadrantIndicatorProps) {
  if (total === 0) return null;
  
  const completionPercentage = (completed / total) * 100;
  
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
  );
}
