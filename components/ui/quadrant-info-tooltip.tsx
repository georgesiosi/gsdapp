"use client"

import { Info } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState, useMemo, memo } from 'react'
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

const InfoIcon = memo(() => (
  <button type="button" className="inline-flex">
    <Info className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-help" />
  </button>
))
InfoIcon.displayName = 'InfoIcon'

const TooltipContentComponent = memo(({ 
  hasProfile, 
  isLoading, 
  error, 
  quadrantId, 
  quadrantAnalysis 
}: { 
  hasProfile: boolean;
  isLoading: boolean;
  error: string | null;
  quadrantId: QuadrantType;
  quadrantAnalysis?: {
    summary: string;
    bulletPoints: string[];
  };
}) => {
  if (!hasProfile) {
    return (
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
    )
  }
  
  if (isLoading) {
    return <p className="text-sm">Analyzing your personal context...</p>
  }
  
  if (error) {
    return (
      <div>
        <p className="text-sm">{defaultDescriptions[quadrantId]}</p>
        <p className="text-xs text-red-500">{error}</p>
      </div>
    )
  }
  
  if (quadrantAnalysis) {
    return (
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
    )
  }
  
  return <p className="text-sm">{defaultDescriptions[quadrantId]}</p>
})
TooltipContentComponent.displayName = 'TooltipContentComponent'

/**
 * A simple tooltip component that shows information about task quadrants.
 * Displays default descriptions or personalized content based on user profile.
 */
export const QuadrantInfoTooltip = memo(({ quadrantId }: QuadrantInfoTooltipProps) => {
  const { getPersonalContext } = useProfile()
  const [analysis, setAnalysis] = useState<PersonalContextAnalysis | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Compute this value once for the component render
  const personalContext = useMemo(() => getPersonalContext(), [getPersonalContext])
  const hasProfile = useMemo(() => Boolean(personalContext?.trim()), [personalContext])
  
  // Load analysis once on mount if profile exists
  useEffect(() => {
    let isMounted = true
    
    const loadAnalysis = async () => {
      // Skip if no personal context or we already have analysis
      if (!hasProfile) return
      
      // Check for cached analysis first
      const storedAnalysis = PersonalContextService.getStoredAnalysis()
      if (storedAnalysis && isMounted) {
        setAnalysis(storedAnalysis)
        return
      }
      
      // If no cached analysis, generate a new one
      if (isMounted) setIsLoading(true)
      
      try {
        // Pass the actual personal context from our memoized value
        const newAnalysis = await PersonalContextService.analyzePersonalContext(personalContext || "")
        if (isMounted) setAnalysis(newAnalysis)
      } catch (err) {
        if (isMounted) setError('Failed to load personalized recommendations')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }
    
    loadAnalysis()
    
    return () => {
      isMounted = false
    }
  }, [hasProfile, personalContext])
  
  const quadrantAnalysis = useMemo(() => analysis?.[quadrantId], [analysis, quadrantId])
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <InfoIcon />
        </TooltipTrigger>
        <TooltipContent className="max-w-[300px]">
          <TooltipContentComponent
            hasProfile={hasProfile}
            isLoading={isLoading}
            error={error}
            quadrantId={quadrantId}
            quadrantAnalysis={quadrantAnalysis}
          />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
})
QuadrantInfoTooltip.displayName = 'QuadrantInfoTooltip'
