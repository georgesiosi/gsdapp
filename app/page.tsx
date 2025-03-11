"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { TaskManager } from "../components/task-manager"
import { GoalSetter } from "../components/goal-setter"
import { SettingsMenu } from "../components/settings-menu"

export default function HomePage() {
  const { isLoaded, isSignedIn } = useUser()
  const router = useRouter()

  // Check authentication and redirect if needed
  useEffect(() => {
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
    <main className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold tracking-tight">GSDapp</h1>
        <SettingsMenu key="settings-menu" />
      </div>
      <div className="space-y-6">
        <GoalSetter />
        <TaskManager />
      </div>
    </main>
  )
}
