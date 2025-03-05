import { TaskManager } from "@/components/task-manager"
import { GoalSetter } from "@/components/goal-setter"
import { SettingsMenu } from "@/components/settings-menu"

export default function HomePage() {
  return (
    <main className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold tracking-tight">GSDapp</h1>
        <SettingsMenu />
      </div>
      <div className="space-y-6">
        <GoalSetter />
        <TaskManager />
      </div>
    </main>
  )
}
