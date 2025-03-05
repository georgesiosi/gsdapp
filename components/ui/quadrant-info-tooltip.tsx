"use client"

import { Info } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useProfile } from '@/hooks/use-profile'
import { QuadrantType } from '@/types/task'
import { PersonalContextService, type PersonalContextAnalysis } from '@/services/ai/personalContextService'

interface QuadrantInfoTooltipProps {
  quadrantId: QuadrantType
}

const defaultDescriptions = {
  q1: "Urgent and important tasks that need immediate attention",
  q2: "Important but not urgent tasks that require planning",
  q3: "Urgent but less important tasks that could be delegated",
  q4: "Neither urgent nor important tasks to minimize or eliminate"
}

export function QuadrantInfoTooltip({ quadrantId }: QuadrantInfoTooltipProps) {
  const { getPersonalContext } = useProfile()
  const [analysis, setAnalysis] = useState<PersonalContextAnalysis | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadAnalysis = async () => {
      const personalContext = getPersonalContext()
      if (!personalContext?.trim()) {
        return
      }

      // First try to get stored analysis
      const storedAnalysis = PersonalContextService.getStoredAnalysis()
      if (storedAnalysis) {
        setAnalysis(storedAnalysis)
        return
      }

      // If no stored analysis, generate new one
      setIsLoading(true)
      setError(null)
      try {
        const newAnalysis = await PersonalContextService.analyzePersonalContext(personalContext)
        setAnalysis(newAnalysis)
      } catch (err) {
        console.error('Error loading personal context analysis:', err)
        setError('Failed to load personalized recommendations')
      } finally {
        setIsLoading(false)
      }
    }

    loadAnalysis()
  }, [getPersonalContext])

  const quadrantAnalysis = analysis?.[quadrantId]
  const hasProfile = Boolean(getPersonalContext()?.trim())

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-help" />
        </TooltipTrigger>
        <TooltipContent className="max-w-[300px]">
          {hasProfile ? (
            <div className="space-y-2">
              {isLoading ? (
                <p className="text-sm">Analyzing your personal context...</p>
              ) : error ? (
                <div>
                  <p className="text-sm">{defaultDescriptions[quadrantId]}</p>
                  <p className="text-xs text-red-500">{error}</p>
                </div>
              ) : quadrantAnalysis ? (
                <div>
                  <p className="text-sm font-medium">{quadrantAnalysis.summary}</p>
                  <ul className="mt-2 space-y-1">
                    {quadrantAnalysis.bulletPoints.map((point, index) => (
                      <li key={index} className="text-xs flex gap-2">
                        <span>•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-sm">{defaultDescriptions[quadrantId]}</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm">{defaultDescriptions[quadrantId]}</p>
              <div className="text-xs text-muted-foreground">
                <Link 
                  href="/settings/profile" 
                  className="text-primary hover:underline"
                >
                  Add your personal context
                </Link>
                {" "}to get customized task management advice.
              </div>
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
