"use client"

import { useState } from "react"
import { Info } from "lucide-react"
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ReasoningLogService } from "@/services/ai/reasoningLogService"

interface AIReasoningTooltipProps {
  taskId: string
  className?: string
}

export function AIReasoningTooltip({ taskId, className }: AIReasoningTooltipProps) {
  const [reasoning, setReasoning] = useState<string | null>(null)
  const [scores, setScores] = useState<{
    alignment?: number
    urgency?: number
    importance?: number
  } | null>(null)
  
  // Load reasoning on hover
  const handleMouseEnter = () => {
    const log = ReasoningLogService.getLogForTask(taskId)
    if (log) {
      setReasoning(log.reasoning)
      setScores({
        alignment: log.alignmentScore,
        urgency: log.urgencyScore,
        importance: log.importanceScore
      })
    } else {
      setReasoning("No AI reasoning available for this task.")
      setScores(null)
    }
  }
  
  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild onMouseEnter={handleMouseEnter}>
          <button className={`inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 ${className}`}>
            <Info className="h-3 w-3" />
            <span className="sr-only">View AI reasoning</span>
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-sm p-4" side="right">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">AI Reasoning</h4>
            <p className="text-xs text-muted-foreground">{reasoning}</p>
            
            {scores && (
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border mt-2">
                {scores.alignment && (
                  <div className="text-center">
                    <div className="text-xs font-medium">Alignment</div>
                    <div className="text-sm">{scores.alignment}/10</div>
                  </div>
                )}
                {scores.urgency && (
                  <div className="text-center">
                    <div className="text-xs font-medium">Urgency</div>
                    <div className="text-sm">{scores.urgency}/10</div>
                  </div>
                )}
                {scores.importance && (
                  <div className="text-center">
                    <div className="text-xs font-medium">Importance</div>
                    <div className="text-sm">{scores.importance}/10</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
