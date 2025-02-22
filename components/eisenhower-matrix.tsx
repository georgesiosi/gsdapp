"use client"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface Task {
  id: string
  text: string
  quadrant: "q1" | "q2" | "q3" | "q4"
  completed: boolean
}

interface QuadrantProps {
  title: string
  tasks: Task[]
  onToggleTask: (id: string) => void
  onDeleteTask: (id: string) => void
  className?: string
}

function Quadrant({ title, tasks, onToggleTask, onDeleteTask, className }: QuadrantProps) {
  return (
    <Card className={cn("h-[300px] overflow-y-auto transition-colors", className)}>
      <CardHeader>
        <h3 className="font-semibold">{title}</h3>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {tasks.map((task) => (
            <li key={task.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => onToggleTask(task.id)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className={task.completed ? "line-through text-muted-foreground" : ""}>{task.text}</span>
              <Button variant="ghost" size="sm" onClick={() => onDeleteTask(task.id)} className="ml-auto h-6 w-6 p-0">
                ×
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

interface EisenhowerMatrixProps {
  tasks: Task[]
  onToggleTask: (id: string) => void
  onDeleteTask: (id: string) => void
}

export function EisenhowerMatrix({ tasks, onToggleTask, onDeleteTask }: EisenhowerMatrixProps) {
  const getQuadrantTasks = (quadrant: Task["quadrant"]) => tasks.filter((task) => task.quadrant === quadrant)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Quadrant
        title="Urgent & Important"
        tasks={getQuadrantTasks("q1")}
        onToggleTask={onToggleTask}
        onDeleteTask={onDeleteTask}
        className="bg-red-50 hover:bg-red-100/80 border-red-100"
      />
      <Quadrant
        title="Important, Not Urgent"
        tasks={getQuadrantTasks("q2")}
        onToggleTask={onToggleTask}
        onDeleteTask={onDeleteTask}
        className="bg-green-50 hover:bg-green-100/80 border-green-100"
      />
      <Quadrant
        title="Urgent, Not Important"
        tasks={getQuadrantTasks("q3")}
        onToggleTask={onToggleTask}
        onDeleteTask={onDeleteTask}
        className="bg-yellow-50 hover:bg-yellow-100/80 border-yellow-100"
      />
      <Quadrant
        title="Not Urgent & Not Important"
        tasks={getQuadrantTasks("q4")}
        onToggleTask={onToggleTask}
        onDeleteTask={onDeleteTask}
        className="bg-gray-50 hover:bg-gray-100/80 border-gray-100"
      />
    </div>
  )
}

