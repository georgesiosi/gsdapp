import { TaskManager } from "@/components/task-manager"
import { GoalSetter } from "@/components/goal-setter"

export default function HomePage() {
  return (
    <main className="container mx-auto px-4 py-6 max-w-6xl">
      <h1 className="text-2xl font-bold tracking-tight mb-4">Priority Matrix</h1>
      <div className="space-y-6">
        <GoalSetter />
        <TaskManager />
      </div>
    </main>
  )
}
