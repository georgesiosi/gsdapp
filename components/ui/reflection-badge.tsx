"use client"

import { Badge } from "./badge"
import { HelpCircle } from "lucide-react"
import React from "react"

interface ReflectionBadgeProps {
  onClick: (e: React.MouseEvent) => void;
  isThinking: boolean;
}

export function ReflectionBadge({ onClick, isThinking }: ReflectionBadgeProps) {
  console.log('[ReflectionBadge] Rendering with onClick handler');
  return (
    <Badge
      variant="outline"
      className={`ml-2 cursor-pointer hover:bg-secondary/60 transition-all flex items-center gap-1 px-2 py-0 text-xs border border-amber-300 text-amber-700 bg-amber-50 ${isThinking ? 'animate-pulse' : ''}`}
      onClick={onClick}
    >
      <HelpCircle className="h-3 w-3" />
      <span className="hidden sm:inline">{isThinking ? "Thinking..." : "Reflect"}</span>
    </Badge>
  )
}
