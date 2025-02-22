"use client"

import { Badge } from "./badge"
import { HelpCircle } from "lucide-react"

interface ReflectionBadgeProps {
  onClick: () => void
}

export function ReflectionBadge({ onClick }: ReflectionBadgeProps) {
  console.log('[ReflectionBadge] Rendering with onClick handler');
  return (
    <Badge
      variant="secondary"
      className="ml-2 cursor-pointer hover:bg-secondary/80 transition-colors flex items-center gap-1"
      onClick={onClick}
    >
      <HelpCircle className="h-3 w-3" />
      Needs Reflection
    </Badge>
  )
}
