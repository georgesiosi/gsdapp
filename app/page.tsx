"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { useQuery } from 'convex/react'; 
import { api } from '../convex/_generated/api'; 
import { Task, QuadrantKeys, TaskOrIdeaType, TaskStatus, TaskReflection } from '../types/task'; 
import { TaskManager } from "../components/task-manager"
import { GoalSetter } from "../components/goal-setter"
import { DashboardLayout } from "../components/dashboard-layout"
import useLocalStorage from "../hooks/useLocalStorage" 

export default function HomePage() {
  const { isLoaded, isSignedIn, user } = useUser()
  const userId = user?.id;
  const [showEisenhowerSidebars] = useLocalStorage<boolean>('showEisenhowerSidebars', true);
  const router = useRouter()

  // Fetch tasks here
  const rawTaskList = useQuery(
    api.tasks.getTasks,
    userId ? undefined : "skip" // Skip if logged out
  );
  const taskList: Task[] = useMemo(() => {
    return (rawTaskList ?? []).map((task) => ({
      ...task,
      id: task._id, // Map _id to id
      quadrant: task.quadrant as QuadrantKeys, // Cast quadrant
      taskType: task.taskType as TaskOrIdeaType, // Cast taskType
      status: task.status as TaskStatus, // Cast status
      needsReflection: task.needsReflection ?? false, // Provide default value
      reflection: task.reflection ? {
        ...task.reflection,
        suggestedQuadrant: task.reflection.suggestedQuadrant as QuadrantKeys | undefined,
        // Assert finalQuadrant exists and cast, as TaskReflection requires it
        finalQuadrant: task.reflection.finalQuadrant as QuadrantKeys 
      } : undefined,
      // Add any other necessary mappings here if Task type differs more
    }));
  }, [rawTaskList]);

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
    // Pass taskList to DashboardLayout
    <DashboardLayout tasks={taskList}>
      {/* Container and padding are now handled by DashboardLayout */}
      <div className="space-y-6">
        <GoalSetter />
        {/* Pass taskList to TaskManager */}
        <TaskManager tasks={taskList} /> 
      </div>
    </DashboardLayout>
  )
}
