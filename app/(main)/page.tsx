"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import useLocalStorage from "@/hooks/useLocalStorage"
import { TaskManager } from "@/components/task-manager"
import { GoalSetter } from "@/components/goal-setter"

export default function HomePage() {
  const { isLoaded, isSignedIn, user } = useUser()
  const userId = user?.id;
  const router = useRouter()
  const [isClient, setIsClient] = useState(false);
  const [showGoalsSectionSetting] = useLocalStorage<boolean>('showGoalsSection', true);

  useEffect(() => {
    setIsClient(true);
    // Only run this check after Clerk has loaded the user state
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in')
    }
  }, [isLoaded, isSignedIn, router])

  // If not loaded yet or not signed in, show a minimal loading state
  if (!isLoaded || !isSignedIn) {
    return (
      <main className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold tracking-tight">GSDapp</h1>
        </div>
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </main>
    )
  }

  // Show the full app UI once authenticated or in dev mode
  return (
    <div className="space-y-6">
      {/* Conditionally render GoalSetter based on setting and client mount */}
      {isClient && showGoalsSectionSetting && <GoalSetter />}
      {/* TaskManager now fetches its own data if needed, or refactor it */}
      <TaskManager />
    </div>
  )
}
