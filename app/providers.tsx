"use client"

import { ReactNode, useEffect } from "react"
import { Toaster } from "@/components/ui/toaster"

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  // Ensure light theme by removing 'dark' class if present
  useEffect(() => {
    document.documentElement.classList.remove('dark')
  }, [])

  return (
    <>
      {children}
      <Toaster />
    </>
  )
}
