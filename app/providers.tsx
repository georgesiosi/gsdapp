"use client"

import { ReactNode, useEffect } from "react"
import { ClerkProvider } from "@clerk/nextjs"
import { Toaster } from "@/components/ui/toaster"
import LegacyMigration from "@/components/auth/legacy-migration"

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  // Ensure light theme by removing 'dark' class if present
  useEffect(() => {
    document.documentElement.classList.remove('dark')
  }, [])

  return (
    <ClerkProvider>
      {children}
      <LegacyMigration />
      <Toaster />
    </ClerkProvider>
  )
}
