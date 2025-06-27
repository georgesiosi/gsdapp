"use client"

import { Info } from "lucide-react"
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { Task } from "@/types/task"

interface AIReasoningTooltipProps {
  task: Task
  className?: string
}

export function AIReasoningTooltip({ task, className }: AIReasoningTooltipProps) {
  const reasoning = task.aiReasoning || "No AI reasoning available for this task."
  
  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <button className={`inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 ${className}`}>
            <Info className="h-3 w-3" />
            <span className="sr-only">View AI reasoning</span>
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-sm p-4" side="right">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">AI Reasoning</h4>
            <p className="text-xs text-muted-foreground">{reasoning}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
