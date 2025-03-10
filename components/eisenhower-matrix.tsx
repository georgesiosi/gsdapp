"use client"
import { useState, useEffect, useMemo } from "react"
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
  onTaskClick?: (task: Task) => void
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
  onTaskClick,
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
        "quadrant rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all", 
        className
      )}
      onDragOver={(e: DragEvent) => handleDragOver(e)}
      onDragLeave={(e: DragEvent) => {
        (e.currentTarget as HTMLElement).classList.remove('reorder-target', 'move-target');
      }}
      onDrop={(e: DragEvent) => handleDrop(e)}
    >
      <div className={cn(
        "flex items-center justify-between p-3 border-b",
        // Header background colors for each quadrant
        quadrantId === "q1" && "bg-destructive/10 dark:bg-destructive/20",
        quadrantId === "q2" && "bg-blue-500/10 dark:bg-blue-500/20",
        quadrantId === "q3" && "bg-yellow-500/10 dark:bg-yellow-500/20",
        quadrantId === "q4" && "bg-muted/50 dark:bg-muted/30"
      )}>
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-foreground">{title}</h3>
          <QuadrantInfoTooltip quadrantId={quadrantId} />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground/80">{tasks.length} {quadrantId === "q1" ? "tasks to do now" : quadrantId === "q2" ? "tasks to schedule" : quadrantId === "q3" ? "tasks to delegate" : "tasks to avoid"}</span>
            {quadrantId === "q4" && isAIThinking && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground/80">
                <AIThinkingIndicator isThinking={true} className="h-3 w-3" />
                <span className="text-[10px]">Processing tasks...</span>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className={cn(
        "quadrant-content p-2",
        // Base background colors for each quadrant
        quadrantId === "q1" && "bg-destructive/5 dark:bg-destructive/10",
        quadrantId === "q2" && "bg-blue-500/5 dark:bg-blue-500/10",
        quadrantId === "q3" && "bg-yellow-500/5 dark:bg-yellow-500/10",
        quadrantId === "q4" && "bg-muted dark:bg-muted/20"
      )}>
        {sortedTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-6">
            <p className="text-xs text-muted-foreground">No tasks yet</p>
            <p className="text-xs text-muted-foreground/80 mt-1">Drag tasks here or add new ones</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {sortedTasks.map((task) => (
              <li 
                key={task.id} 
                className={cn(
                  "task-item group p-2 rounded-md",
                  draggedTaskId === task.id && "opacity-50",
                  "cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors",
                  editingTaskId === task.id && "pointer-events-none"
                )}
                draggable={editingTaskId !== task.id}
                onDragStart={(e) => handleDragStart(e, task.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, task.id)}
                onDragEnd={handleDragEnd}
                onClick={(e) => {
                  // Ignore clicks if we're dragging
                  if (draggedTaskId) return

                  // Get the target element
                  const target = e.target as HTMLElement

                  // Ignore clicks on interactive elements
                  if (
                    target.closest('.task-checkbox') ||
                    target.closest('.task-action-button') ||
                    target.closest('.reflection-badge')
                  ) {
                    return
                  }

                  onTaskClick?.(task)
                }}
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
                      onChange={(e) => {
                        e.stopPropagation()
                        onToggleTask(task.id)
                      }}
                      className="task-checkbox rounded-sm"
                    />
                    <span 
                      className={cn(
                        "task-text text-sm transition-colors",
                        task.status === 'completed' ? "line-through text-muted-foreground" : "text-foreground/90 group-hover:text-accent-foreground"
                      )}
                    >
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
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingTaskId(task.id)
                        }}
                        className="task-action-button edit-button mr-1"
                        aria-label="Edit task"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteTask(task.id)
                        }}
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
  onTaskClick?: (task: Task) => void
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
  onTaskClick,
  isAIThinking
}: EisenhowerMatrixProps) {
  // Memoize tasks by quadrant to prevent unnecessary recalculations
  const tasksByQuadrant = useMemo(() => {
    console.log('[DEBUG] EisenhowerMatrix - Recalculating tasks by quadrant');
    return {
      q1: tasks.filter(t => t.quadrant === 'q1'),
      q2: tasks.filter(t => t.quadrant === 'q2'),
      q3: tasks.filter(t => t.quadrant === 'q3'),
      q4: tasks.filter(t => t.quadrant === 'q4')
    };
  }, [tasks]); // Only recalculate when tasks change
  
  // Listen for task updates and force re-renders
  useEffect(() => {
    const handleTaskUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.taskId) {
        console.log('[DEBUG] EisenhowerMatrix - Task updated:', customEvent.detail);
        // The tasksByQuadrant memo will automatically update when tasks prop changes
      }
    };
    
    window.addEventListener('taskUpdated', handleTaskUpdate);
    return () => window.removeEventListener('taskUpdated', handleTaskUpdate);
  }, []);

  return (
    <div className="eisenhower-matrix">
      <div className="grid grid-cols-2 gap-4">
        <Quadrant
          title="Urgent & Important"
          quadrantId="q1"
          tasks={tasksByQuadrant.q1}
          onToggleTask={onToggleTask}
          onDeleteTask={onDeleteTask}
          onReflectionRequested={onReflectionRequested}
          onMoveTask={onMoveTask}
          onEditTask={onEditTask}
          onReorderTasks={onReorderTasks}
          onTaskClick={onTaskClick}
          className="quadrant-urgent-important border-destructive/30"
        />
        <Quadrant
          title="Not Urgent but Important"
          quadrantId="q2"
          tasks={tasksByQuadrant.q2}
          onToggleTask={onToggleTask}
          onDeleteTask={onDeleteTask}
          onReflectionRequested={onReflectionRequested}
          onMoveTask={onMoveTask}
          onEditTask={onEditTask}
          onReorderTasks={onReorderTasks}
          onTaskClick={onTaskClick}
          className="quadrant-not-urgent-important border-blue-500/30"
        />
        <Quadrant
          title="Urgent but Not Important"
          quadrantId="q3"
          tasks={tasksByQuadrant.q3}
          onToggleTask={onToggleTask}
          onDeleteTask={onDeleteTask}
          onReflectionRequested={onReflectionRequested}
          onMoveTask={onMoveTask}
          onEditTask={onEditTask}
          onReorderTasks={onReorderTasks}
          onTaskClick={onTaskClick}
          className="quadrant-urgent-not-important border-yellow-500/30"
        />
        <Quadrant
          title="Not Urgent & Not Important"
          quadrantId="q4"
          tasks={tasksByQuadrant.q4}
          onToggleTask={onToggleTask}
          onDeleteTask={onDeleteTask}
          onReflectionRequested={onReflectionRequested}
          onMoveTask={onMoveTask}
          onEditTask={onEditTask}
          onReorderTasks={onReorderTasks}
          onTaskClick={onTaskClick}
          className="quadrant-not-urgent-not-important border-muted-foreground/30"
          isAIThinking={isAIThinking}
        />
      </div>
    </div>
  )
}
