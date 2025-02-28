import { TaskManager } from "@/components/task-manager"
import { GoalSetter } from "@/components/goal-setter"
import { Button } from "@/components/ui/button"
import { Brain } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <main className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Priority Matrix</h1>
        <Link href="/ai-logs">
          <Button variant="outline" size="sm" className="gap-2">
            <Brain className="h-4 w-4" />
            <span>AI Logs</span>
          </Button>
        </Link>
      </div>
      <div className="space-y-6">
        <GoalSetter />
        <TaskManager />
      </div>
    </main>
  )
}
