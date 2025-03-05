"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface AIThinkingIndicatorProps {
  isThinking: boolean
  className?: string
}

export function AIThinkingIndicator({ isThinking, className }: AIThinkingIndicatorProps) {
  const [dots, setDots] = useState(".")
  
  // Animate the dots when thinking
  useEffect(() => {
    if (!isThinking) return
    
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === "...") return "."
        return prev + "."
      })
    }, 400)
    
    return () => clearInterval(interval)
  }, [isThinking])
  
  if (!isThinking) return null
  
  return (
    <div className={cn(
      "inline-flex items-center gap-1 text-xs font-medium text-blue-500 animate-pulse transition-opacity duration-300",
      className
    )}>
      <div className="relative w-3 h-3">
        <div className="absolute w-full h-full rounded-full bg-blue-500/20 animate-ping"></div>
        <div className="absolute w-full h-full rounded-full bg-blue-500/40"></div>
      </div>
      <span>AI thinking{dots}</span>
    </div>
  )
}
