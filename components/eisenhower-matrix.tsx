"use client"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { ReflectionBadge } from "@/components/ui/reflection-badge"
import { AIThinkingIndicator } from "@/components/ui/ai-thinking-indicator"
import { AIReasoningTooltip } from "@/components/ui/ai-reasoning-tooltip"
import { TaskTypeIndicator } from "@/components/ui/task-type-indicator"
import { InlineTaskEditor } from "@/components/ui/inline-task-editor"
import { QuadrantInfoTooltip } from "@/components/ui/quadrant-info-tooltip"
import { Task, QuadrantType } from "@/types/task"
import { DragEvent } from "react"
import { Edit2 } from "lucide-react"

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
  
  // Sort tasks by status (active first) and then by order
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === 'active' ? -1 : 1;
    }
    return (a.order || 0) - (b.order || 0);
  });
  
  // Drag and drop handlers
  const handleDragStart = (e: DragEvent, taskId: string) => {
    e.stopPropagation();
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('application/json', JSON.stringify({ taskId, sourceQuadrant: quadrantId }));
    e.dataTransfer.effectAllowed = 'move';
  };
  
  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const { sourceQuadrant } = JSON.parse(e.dataTransfer.getData('application/json'));
      e.currentTarget.classList.add(sourceQuadrant === quadrantId ? 'reorder-target' : 'move-target');
      e.dataTransfer.dropEffect = 'move';
    } catch {}
  };
  
  const handleDrop = (e: DragEvent, targetTaskId?: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const { taskId: draggedId, sourceQuadrant } = JSON.parse(e.dataTransfer.getData('application/json'));
      
      if (!draggedId) return;
      
      if (sourceQuadrant === quadrantId && targetTaskId) {
        const sourceIndex = sortedTasks.findIndex(t => t.id === draggedId);
        const targetIndex = sortedTasks.findIndex(t => t.id === targetTaskId);
        
        if (sourceIndex !== -1 && targetIndex !== -1 && sourceIndex !== targetIndex) {
          onReorderTasks(quadrantId, sourceIndex, targetIndex);
        }
      } else if (sourceQuadrant !== quadrantId) {
        onMoveTask(draggedId, quadrantId);
      }
    } catch (error) {
      console.error('Error handling drop:', error);
    }
    
    setDraggedTaskId(null);
    e.currentTarget.classList.remove('reorder-target', 'move-target');
  };
  
  const handleDragEnd = () => {
    setDraggedTaskId(null);
    document.querySelectorAll('.reorder-target, .move-target')
      .forEach(el => el.classList.remove('reorder-target', 'move-target'));
  };
  return (
    <div 
      className={cn(
        "quadrant", 
        className,
        isAIThinking && "ring-2 ring-primary/40 transition-all duration-300"
      )}
      onDragOver={(e: DragEvent) => handleDragOver(e)}
      onDragLeave={(e: DragEvent) => {
        (e.currentTarget as HTMLElement).classList.remove('reorder-target', 'move-target');
      }}
      onDrop={(e: DragEvent) => handleDrop(e)}
    >
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">{title}</h3>
          <QuadrantInfoTooltip quadrantId={quadrantId} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{tasks.length} {quadrantId === "q1" ? "tasks to do now" : quadrantId === "q2" ? "tasks to schedule" : quadrantId === "q3" ? "tasks to delegate" : "tasks to avoid"}</span>
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
                  draggedTaskId === task.id && "opacity-50"
                )}
                draggable={editingTaskId !== task.id}
                onDragStart={(e) => handleDragStart(e, task.id)}
                onDragOver={(e) => handleDragOver(e, task.id)}
                onDrop={(e) => handleDrop(e, task.id)}
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

                    <input
                      type="checkbox"
                      checked={task.status === 'completed'}
                      onChange={() => onToggleTask(task.id)}
                      className="task-checkbox"
                    />
                    <span className={cn(
                      "task-text",
                      task.status === 'completed' && "line-through text-muted-foreground"
                    )}>
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
          className="quadrant-urgent-important border-destructive/20"
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
          className="quadrant-not-urgent-important border-primary/20"
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
          className="quadrant-urgent-not-important border-yellow-500/20"
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
          className="quadrant-not-urgent-not-important border-muted-foreground/20"
          isAIThinking={isAIThinking}
        />
      </div>
    </div>
  )
}
