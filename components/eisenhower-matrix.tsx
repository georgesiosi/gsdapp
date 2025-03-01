"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ReflectionBadge } from "@/components/ui/reflection-badge"
import { AIThinkingIndicator } from "@/components/ui/ai-thinking-indicator"
import { AIReasoningTooltip } from "@/components/ui/ai-reasoning-tooltip"
import { TaskTypeIndicator } from "@/components/ui/task-type-indicator"
import { InlineTaskEditor } from "@/components/ui/inline-task-editor"
import { Task, QuadrantType } from "@/types/task"
import { DragEvent } from "react"
import { Edit2, MoveVertical } from "lucide-react"

interface QuadrantProps {
  title: string
  quadrantId: QuadrantType
  tasks: Task[]
  onToggleTask: (id: string) => void
  onDeleteTask: (id: string) => void
  onReflectionRequested?: (task: Task) => void
  onMoveTask: (taskId: string, newQuadrant: QuadrantType) => void
  onEditTask: (taskId: string, newText: string) => void
  onReorderTasks: (quadrant: QuadrantType, sourceIndex: number, destinationIndex: number) => void
  className?: string
  isAIThinking?: boolean
}

function Quadrant({ 
  title, 
  quadrantId, 
  tasks, 
  onToggleTask, 
  onDeleteTask, 
  onReflectionRequested, 
  onMoveTask, 
  onEditTask, 
  onReorderTasks,
  className, 
  isAIThinking 
}: QuadrantProps) {
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null)
  const [isDraggingForReorder, setIsDraggingForReorder] = useState(false)
  
  // Sort tasks by order
  const sortedTasks = [...tasks].sort((a, b) => (a.order || 0) - (b.order || 0));
  
  // Handle start of drag for reordering within quadrant
  const handleReorderDragStart = (e: DragEvent, taskId: string) => {
    e.stopPropagation();
    setDraggedTaskId(taskId);
    setIsDraggingForReorder(true);
    e.dataTransfer.setData('application/reorder', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };
  
  // Handle drag over for reordering
  const handleReorderDragOver = (e: DragEvent, taskId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (draggedTaskId === taskId || !isDraggingForReorder) return;
    
    setDragOverTaskId(taskId);
    e.dataTransfer.dropEffect = 'move';
  };
  
  // Handle drop for reordering
  const handleReorderDrop = (e: DragEvent, targetTaskId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isDraggingForReorder || !draggedTaskId) return;
    
    const sourceIndex = sortedTasks.findIndex(t => t.id === draggedTaskId);
    const targetIndex = sortedTasks.findIndex(t => t.id === targetTaskId);
    
    if (sourceIndex !== -1 && targetIndex !== -1 && sourceIndex !== targetIndex) {
      onReorderTasks(quadrantId, sourceIndex, targetIndex);
    }
    
    setDraggedTaskId(null);
    setDragOverTaskId(null);
    setIsDraggingForReorder(false);
  };
  
  // Handle drag end
  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverTaskId(null);
    setIsDraggingForReorder(false);
  };
  
  console.log('[Quadrant] Rendering with tasks:', tasks.length, 'needsReflection:', tasks.filter(t => t.needsReflection).length);
  return (
    <div 
      className={cn(
        "quadrant", 
        className,
        isAIThinking && "border-primary/40 shadow-sm transition-all duration-300"
      )}
      onDragOver={(e: DragEvent) => {
        // Only handle quadrant-level drag if not reordering
        if (!isDraggingForReorder) {
          e.preventDefault();
          e.currentTarget.classList.add('border-2', 'border-primary');
        }
      }}
      onDragLeave={(e: DragEvent) => {
        if (!isDraggingForReorder) {
          e.currentTarget.classList.remove('border-2', 'border-primary');
        }
      }}
      onDrop={(e: DragEvent) => {
        // Only handle quadrant-level drop if not reordering
        if (!isDraggingForReorder) {
          e.preventDefault();
          e.currentTarget.classList.remove('border-2', 'border-primary');
          const taskId = e.dataTransfer.getData('text/plain');
          if (taskId) {
            onMoveTask(taskId, quadrantId);
          }
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
        {sortedTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-6">
            <p className="text-xs text-muted-foreground">No tasks yet</p>
            <p className="text-xs text-muted-foreground mt-1">Drag tasks here or add new ones</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {sortedTasks.map((task) => (
              <li 
                key={task.id} 
                className={cn(
                  "task-item",
                  dragOverTaskId === task.id && "border-2 border-primary bg-primary/5"
                )}
                draggable={editingTaskId !== task.id}
                onDragStart={(e) => {
                  if (editingTaskId !== task.id) {
                    e.dataTransfer.setData('text/plain', task.id);
                  }
                }}
                onDragOver={(e) => handleReorderDragOver(e, task.id)}
                onDrop={(e) => handleReorderDrop(e, task.id)}
                onDragEnd={handleDragEnd}
              >
                {editingTaskId === task.id ? (
                  <InlineTaskEditor 
                    task={task}
                    onSave={(id, newText) => {
                      onEditTask(id, newText);
                      setEditingTaskId(null);
                    }}
                    onCancel={() => setEditingTaskId(null)}
                  />
                ) : (
                  <>
                    <div className="task-reorder-handle" 
                         draggable 
                         onDragStart={(e) => handleReorderDragStart(e, task.id)}>
                      <MoveVertical size={14} className="text-gray-400 cursor-move" />
                    </div>
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
                        onClick={() => setEditingTaskId(task.id)}
                        className="task-action-button edit-button mr-1"
                        aria-label="Edit task"
                      >
                        <Edit2 size={14} />
                      </button>
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
                  </>
                )}
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
  onEditTask: (taskId: string, newText: string) => void
  onReorderTasks: (quadrant: QuadrantType, sourceIndex: number, destinationIndex: number) => void
  isAIThinking?: boolean
}

export function EisenhowerMatrix({ 
  tasks, 
  onToggleTask, 
  onDeleteTask, 
  onReflectionRequested, 
  onMoveTask, 
  onEditTask,
  onReorderTasks,
  isAIThinking = false 
}: EisenhowerMatrixProps) {
  const q1Tasks = tasks.filter(task => task.quadrant === "q1");
  const q2Tasks = tasks.filter(task => task.quadrant === "q2");
  const q3Tasks = tasks.filter(task => task.quadrant === "q3");
  const q4Tasks = tasks.filter(task => task.quadrant === "q4");

  return (
    <div className="eisenhower-matrix">
      <div className="grid grid-cols-2 gap-4">
        <Quadrant
          title="Urgent & Important"
          quadrantId="q1"
          tasks={q1Tasks}
          onToggleTask={onToggleTask}
          onDeleteTask={onDeleteTask}
          onReflectionRequested={onReflectionRequested}
          onMoveTask={onMoveTask}
          onEditTask={onEditTask}
          onReorderTasks={onReorderTasks}
          className="bg-red-50 border-red-200"
          isAIThinking={isAIThinking}
        />
        <Quadrant
          title="Not Urgent but Important"
          quadrantId="q2"
          tasks={q2Tasks}
          onToggleTask={onToggleTask}
          onDeleteTask={onDeleteTask}
          onReflectionRequested={onReflectionRequested}
          onMoveTask={onMoveTask}
          onEditTask={onEditTask}
          onReorderTasks={onReorderTasks}
          className="bg-orange-50 border-orange-200"
          isAIThinking={isAIThinking}
        />
        <Quadrant
          title="Urgent but Not Important"
          quadrantId="q3"
          tasks={q3Tasks}
          onToggleTask={onToggleTask}
          onDeleteTask={onDeleteTask}
          onReflectionRequested={onReflectionRequested}
          onMoveTask={onMoveTask}
          onEditTask={onEditTask}
          onReorderTasks={onReorderTasks}
          className="bg-yellow-50 border-yellow-200"
          isAIThinking={isAIThinking}
        />
        <Quadrant
          title="Not Urgent & Not Important"
          quadrantId="q4"
          tasks={q4Tasks}
          onToggleTask={onToggleTask}
          onDeleteTask={onDeleteTask}
          onReflectionRequested={onReflectionRequested}
          onMoveTask={onMoveTask}
          onEditTask={onEditTask}
          onReorderTasks={onReorderTasks}
          className="bg-gray-50 border-gray-200"
          isAIThinking={isAIThinking}
        />
      </div>
    </div>
  )
}
