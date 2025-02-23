"use client"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { ReflectionBadge } from "@/components/ui/reflection-badge"
import { Task, QuadrantType } from "@/types/task"
import { DragEvent } from "react"



interface QuadrantProps {
  title: string
  quadrantId: QuadrantType
  tasks: Task[]
  onToggleTask: (id: string) => void
  onDeleteTask: (id: string) => void
  onReflectionRequested?: (task: Task) => void
  onMoveTask: (taskId: string, newQuadrant: QuadrantType) => void
  className?: string
}

function Quadrant({ title, quadrantId, tasks, onToggleTask, onDeleteTask, onReflectionRequested, onMoveTask, className }: QuadrantProps) {
  console.log('[Quadrant] Rendering with tasks:', tasks.length, 'needsReflection:', tasks.filter(t => t.needsReflection).length);
  return (
    <Card 
      className={cn("h-[300px] overflow-y-auto transition-colors", className)}
      onDragOver={(e: DragEvent) => {
        e.preventDefault();
        e.currentTarget.classList.add('border-2', 'border-primary');
      }}
      onDragLeave={(e: DragEvent) => {
        e.currentTarget.classList.remove('border-2', 'border-primary');
      }}
      onDrop={(e: DragEvent) => {
        e.preventDefault();
        e.currentTarget.classList.remove('border-2', 'border-primary');
        const taskId = e.dataTransfer.getData('text/plain');
        if (taskId) {
          onMoveTask(taskId, quadrantId);
        }
      }}
    >
      <CardHeader>
        <h3 className="font-semibold">{title}</h3>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {tasks.map((task) => (
            <li 
              key={task.id} 
              className="flex items-center gap-2 cursor-move"
              draggable
              onDragStart={(e: DragEvent) => {
                e.dataTransfer.setData('text/plain', task.id);
              }}
            >
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => onToggleTask(task.id)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <div className="flex-1 flex items-center gap-2">
                <span className={task.completed ? "line-through text-muted-foreground" : ""}>{task.text}</span>
                {task.needsReflection && onReflectionRequested && (
                  <ReflectionBadge onClick={() => onReflectionRequested(task)} />
                )}
              </div>
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
  onReflectionRequested?: (task: Task) => void
  onMoveTask: (taskId: string, newQuadrant: QuadrantType) => void
}

export function EisenhowerMatrix({ tasks, onToggleTask, onDeleteTask, onReflectionRequested, onMoveTask }: EisenhowerMatrixProps) {
  const getQuadrantTasks = (quadrant: Task["quadrant"]) => tasks.filter((task) => task.quadrant === quadrant)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Quadrant
        title="Urgent & Important"
        quadrantId="q1"
        tasks={getQuadrantTasks("q1")}
        onToggleTask={onToggleTask}
        onDeleteTask={onDeleteTask}
        onReflectionRequested={onReflectionRequested}
        onMoveTask={onMoveTask}
        className="bg-red-50 hover:bg-red-100/80 border-red-100"
      />
      <Quadrant
        title="Important, Not Urgent"
        quadrantId="q2"
        tasks={getQuadrantTasks("q2")}
        onToggleTask={onToggleTask}
        onDeleteTask={onDeleteTask}
        onReflectionRequested={onReflectionRequested}
        onMoveTask={onMoveTask}
        className="bg-green-50 hover:bg-green-100/80 border-green-100"
      />
      <Quadrant
        title="Urgent, Not Important"
        quadrantId="q3"
        tasks={getQuadrantTasks("q3")}
        onToggleTask={onToggleTask}
        onDeleteTask={onDeleteTask}
        onReflectionRequested={onReflectionRequested}
        onMoveTask={onMoveTask}
        className="bg-yellow-50 hover:bg-yellow-100/80 border-yellow-100"
      />
      <Quadrant
        title="Not Urgent & Not Important"
        quadrantId="q4"
        tasks={getQuadrantTasks("q4")}
        onToggleTask={onToggleTask}
        onDeleteTask={onDeleteTask}
        onReflectionRequested={onReflectionRequested}
        onMoveTask={onMoveTask}
        className="bg-gray-50 hover:bg-gray-100/80 border-gray-100"
      />
    </div>
  )
}
