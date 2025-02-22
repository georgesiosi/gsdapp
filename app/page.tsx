import { TaskManager } from "@/components/task-manager"
import { GoalSetter } from "@/components/goal-setter"

export default function HomePage() {
  return (
    <main className="container mx-auto p-4 space-y-6">
      <h1 className="text-4xl font-bold tracking-tight">Priority Matrix</h1>
      <GoalSetter />
      <TaskManager />
    </main>
  )
}

