"use client"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ReflectionBadge } from "@/components/ui/reflection-badge"
import { AIThinkingIndicator } from "@/components/ui/ai-thinking-indicator"
import { AIReasoningTooltip } from "@/components/ui/ai-reasoning-tooltip"
import { TaskTypeIndicator } from "@/components/ui/task-type-indicator"
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
  isAIThinking?: boolean
}

function Quadrant({ title, quadrantId, tasks, onToggleTask, onDeleteTask, onReflectionRequested, onMoveTask, className, isAIThinking }: QuadrantProps) {
  console.log('[Quadrant] Rendering with tasks:', tasks.length, 'needsReflection:', tasks.filter(t => t.needsReflection).length);
  return (
    <div 
      className={cn(
        "quadrant", 
        className,
        isAIThinking && "border-primary/40 shadow-sm transition-all duration-300"
      )}
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
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-900">{title}</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{tasks.length} tasks</span>
          {isAIThinking && quadrantId === "q4" && (
            <AIThinkingIndicator isThinking={true} className="scale-75" />
          )}
        </div>
      </div>
      <div className="quadrant-content">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-6">
            <p className="text-xs text-muted-foreground">No tasks yet</p>
            <p className="text-xs text-muted-foreground mt-1">Drag tasks here or add new ones</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {tasks.map((task) => (
              <li 
                key={task.id} 
                className="task-item"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', task.id);
                }}
              >
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => onToggleTask(task.id)}
                  className="task-checkbox"
                />
                <span className={cn("task-text", task.completed && "completed")}>
                  {task.text}
                  {task.needsReflection && onReflectionRequested && (
                    <ReflectionBadge 
                      onClick={(e) => {
                        e.stopPropagation();
                        onReflectionRequested(task);
                      }}
                    />
                  )}
                </span>
                <div className="task-actions">
                  <div className="task-action-hover">
                    <TaskTypeIndicator taskId={task.id} className="mr-1" />
                  </div>
                  <AIReasoningTooltip taskId={task.id} className="mr-1" />
                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="task-action-button delete-button"
                    aria-label="Delete task"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18"></path>
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

interface EisenhowerMatrixProps {
  tasks: Task[]
  onToggleTask: (id: string) => void
  onDeleteTask: (id: string) => void
  onReflectionRequested?: (task: Task) => void
  onMoveTask: (taskId: string, newQuadrant: QuadrantType) => void
  isAIThinking?: boolean
}

export function EisenhowerMatrix({ tasks, onToggleTask, onDeleteTask, onReflectionRequested, onMoveTask, isAIThinking = false }: EisenhowerMatrixProps) {
  const getQuadrantTasks = (quadrant: Task["quadrant"]) => tasks.filter((task) => task.quadrant === quadrant)

  return (
    <div className="grid grid-cols-2 gap-4">
      <Quadrant
        title="Urgent & Important"
        quadrantId="q1"
        tasks={getQuadrantTasks("q1")}
        onToggleTask={onToggleTask}
        onDeleteTask={onDeleteTask}
        onReflectionRequested={onReflectionRequested}
        onMoveTask={onMoveTask}
        className="quadrant-urgent-important"
        isAIThinking={isAIThinking}
      />
      <Quadrant
        title="Important, Not Urgent"
        quadrantId="q2"
        tasks={getQuadrantTasks("q2")}
        onToggleTask={onToggleTask}
        onDeleteTask={onDeleteTask}
        onReflectionRequested={onReflectionRequested}
        onMoveTask={onMoveTask}
        className="quadrant-not-urgent-important"
        isAIThinking={isAIThinking}
      />
      <Quadrant
        title="Urgent, Not Important"
        quadrantId="q3"
        tasks={getQuadrantTasks("q3")}
        onToggleTask={onToggleTask}
        onDeleteTask={onDeleteTask}
        onReflectionRequested={onReflectionRequested}
        onMoveTask={onMoveTask}
        className="quadrant-urgent-not-important"
        isAIThinking={isAIThinking}
      />
      <Quadrant
        title="Not Urgent & Not Important"
        quadrantId="q4"
        tasks={getQuadrantTasks("q4")}
        onToggleTask={onToggleTask}
        onDeleteTask={onDeleteTask}
        onReflectionRequested={onReflectionRequested}
        onMoveTask={onMoveTask}
        className="quadrant-not-urgent-not-important"
        isAIThinking={isAIThinking}
      />
    </div>
  )
}
