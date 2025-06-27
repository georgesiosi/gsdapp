"use client"
import React from "react";
import { useState, useEffect, useMemo } from "react"
import { cn } from "@/lib/utils"
import { AIThinkingIndicator } from "@/components/ui/ai-thinking-indicator"
import { AIReasoningTooltip } from "@/components/ui/ai-reasoning-tooltip"
import { TaskTypeIndicator } from "@/components/ui/task-type-indicator"
import { InlineTaskEditor } from "@/components/ui/inline-task-editor"
import { QuadrantInfoTooltip } from "@/components/ui/quadrant-info-tooltip"
import { Task, QuadrantKeys } from "@/types/task"
import { Id } from "@/convex/_generated/dataModel";
import { DragEvent } from "react"
import { Edit2, CalendarDays } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { format } from "date-fns"

// Define the expected shape of a goal object from the query
type FrontendGoal = {
  _id: Id<"goals">;
  title: string;
  // Add other potential fields if needed for type safety
};

interface QuadrantProps {
  title: string
  quadrantId: QuadrantKeys
  tasks: Task[]
  onToggleTask: (id: string) => void
  onDeleteTask: (id: string) => void
  onMoveTask: (taskId: string, newQuadrant: QuadrantKeys) => void
  onEditTask: (taskId: string, newText: string) => void
  onReorderTasks: (quadrant: QuadrantKeys, sourceIndex: number, destinationIndex: number) => void
  onTaskClick?: (task: Task) => void
  className?: string
  isAIThinking?: boolean
  aiProcessingTaskId?: Id<"tasks"> | null;
  goals?: FrontendGoal[];
  highlightTaskId?: Id<"tasks"> | null;
}

function Quadrant({
  title,
  quadrantId,
  tasks,
  onToggleTask,
  onDeleteTask,
  onMoveTask,
  onEditTask,
  onReorderTasks,
  onTaskClick,
  className,
  isAIThinking,
  aiProcessingTaskId,
  goals,
  highlightTaskId,
}: QuadrantProps) {
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const highlightedTaskRef = React.useRef<HTMLLIElement | null>(null);

  // Ensure tasks is always an array
  const safeTasks = Array.isArray(tasks) ? tasks : [];

  // Sort tasks by status (active first) and then by order
  const sortedTasks = [...safeTasks].sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === 'active' ? -1 : 1;
    }
    return (a.order || 0) - (b.order || 0);
  });

  useEffect(() => {
    if (highlightedTaskRef.current) {
      highlightedTaskRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [highlightTaskId]); // Run when highlightTaskId changes

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
    <TooltipProvider>
      <div
        className={cn(
          "quadrant rounded-lg shadow-sm hover:shadow-md transition-all",
          className,
          quadrantId === 'q4' && isAIThinking && 'animate-q4-analyzing'
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
            <span className="text-xs text-muted-foreground/80">
              {tasks.length} {quadrantId === "q1" ? "tasks to do now" : quadrantId === "q2" ? "tasks to schedule" : quadrantId === "q3" ? "tasks to delegate" : "tasks to avoid"}
            </span>
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
              {sortedTasks.map((task, index) => {
                const isEditing = editingTaskId === task.id
                const isCompleted = task.status === "completed"
                const goalTitle = task.goalId ? goals?.find(g => g._id === task.goalId)?.title : undefined;
                const isHighlighted = task.id === highlightTaskId;

                return (
                  <li
                    key={task.id}
                    ref={isHighlighted ? highlightedTaskRef : null} // Assign ref if highlighted
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, task.id)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      "task-item group relative mb-2 cursor-pointer rounded-lg p-3 shadow-sm transition-all duration-150 ease-in-out",
                      "hover:shadow-md",
                      isCompleted 
                        ? "bg-green-50 text-green-700 line-through dark:bg-green-900/30 dark:text-green-400/70" 
                        : isHighlighted 
                          ? "bg-yellow-100 dark:bg-yellow-700/30 ring-2 ring-yellow-400 dark:ring-yellow-500" 
                          : "hover:bg-muted/50", // Default: no explicit bg, only hover effect
                      draggedTaskId === task.id ? "opacity-50" : "",
                      className
                    )}
                    onClick={() => onTaskClick && onTaskClick(task)}
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
                        <div className="flex items-center space-x-2 flex-grow min-w-0 mr-2">
                          {/* Task Text and Goal Link */}
                          <span
                            className={cn(
                              "task-text text-sm transition-colors",
                              task.status === 'completed' ? "line-through text-muted-foreground" : "text-foreground/90 group-hover:text-accent-foreground"
                            )}
                          >
                            {task.text}
                            {/* Show AI thinking indicator for the specific task being processed */}
                            {quadrantId === 'q4' && isAIThinking && aiProcessingTaskId && task.id === aiProcessingTaskId && (
                              <span className="text-xs text-yellow-600 dark:text-yellow-400 ml-2 animate-pulse">
                                (AI is thinking...)
                              </span>
                            )}
                          </span>
                          {/* Display Goal Title if linked */}
                          {task.goalId && goals && (
                            (() => {
                              console.log('[DEBUG] Task goalId:', task.goalId, 'typeof:', typeof task.goalId);
                              console.log('[DEBUG] Available goals:', goals);
                              const linkedGoal = goals.find(g => g._id.toString() === task.goalId?.toString());
                              if (!linkedGoal) {
                                console.log('[DEBUG] No matching goal found for task:', task.text, 'goalId:', task.goalId);
                                // Try a more lenient comparison
                                const lenientGoal = goals.find(g => 
                                  String(g._id).includes(String(task.goalId)) || 
                                  String(task.goalId).includes(String(g._id))
                                );
                                console.log('[DEBUG] Lenient match found?', !!lenientGoal, lenientGoal?._id);
                              }
                              return linkedGoal ? (
                                <span className="ml-2 text-xs text-indigo-500 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/50 px-1.5 py-0.5 rounded">
                                  🎯 {linkedGoal.title}
                                </span>
                              ) : null;
                            })()
                          )}
                        </div>

                        {/* Badges and Actions */}
                        <div className="flex items-center space-x-2 ml-auto flex-shrink-0">
                          <div className="task-actions">
                            <div className="task-action-hover">
                              <TaskTypeIndicator task={task} className="mr-1" />
                            </div>
                            <AIReasoningTooltip task={task} className="mr-1" />
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

                          {/* Due Date Tooltip Icon (Conditionally Rendered) */}
                          {task.dueDate && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <CalendarDays size={14} className="text-muted-foreground mr-1" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Due: {format(new Date(task.dueDate), "PPP")}</p>
                              </TooltipContent>
                            </Tooltip>
                          )}

                        </div>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}

interface EisenhowerMatrixProps {
  tasks: Task[]
  goals?: FrontendGoal[];
  onToggleTask: (id: string) => void
  onDeleteTask: (id: string) => void
  onMoveTask: (taskId: string, newQuadrant: QuadrantKeys) => void
  onEditTask: (taskId: string, newText: string) => void
  onReorderTasks: (quadrant: QuadrantKeys, sourceIndex: number, destinationIndex: number) => void
  onTaskClick?: (task: Task) => void
  isAIThinking?: boolean
  aiProcessingTaskId?: Id<"tasks"> | null;
  highlightTaskId?: Id<"tasks"> | null;
}

export function EisenhowerMatrix({
  tasks,
  goals,
  onToggleTask,
  onDeleteTask,
  onMoveTask,
  onEditTask,
  onReorderTasks,
  onTaskClick,
  isAIThinking,
  aiProcessingTaskId,
  highlightTaskId,
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
      {/* Change grid layout to be responsive */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Quadrant
          title="Urgent & Important"
          quadrantId="q1"
          tasks={tasksByQuadrant.q1}
          onToggleTask={onToggleTask}
          onDeleteTask={onDeleteTask}
          onMoveTask={onMoveTask}
          onEditTask={onEditTask}
          onReorderTasks={onReorderTasks}
          onTaskClick={onTaskClick}
          className="quadrant-urgent-important border-destructive/30"
          goals={goals}
          highlightTaskId={highlightTaskId}
        />
        <Quadrant
          title="Not Urgent but Important"
          quadrantId="q2"
          tasks={tasksByQuadrant.q2}
          onToggleTask={onToggleTask}
          onDeleteTask={onDeleteTask}
          onMoveTask={onMoveTask}
          onEditTask={onEditTask}
          onReorderTasks={onReorderTasks}
          onTaskClick={onTaskClick}
          className="quadrant-not-urgent-important border-blue-500/30"
          goals={goals}
          highlightTaskId={highlightTaskId}
        />
        <Quadrant
          title="Urgent but Not Important"
          quadrantId="q3"
          tasks={tasksByQuadrant.q3}
          onToggleTask={onToggleTask}
          onDeleteTask={onDeleteTask}
          onMoveTask={onMoveTask}
          onEditTask={onEditTask}
          onReorderTasks={onReorderTasks}
          onTaskClick={onTaskClick}
          className="quadrant-urgent-not-important border-yellow-500/30"
          goals={goals}
          highlightTaskId={highlightTaskId}
        />
        <Quadrant
          title="Not Urgent & Not Important"
          quadrantId="q4"
          tasks={tasksByQuadrant.q4}
          onToggleTask={onToggleTask}
          onDeleteTask={onDeleteTask}
          onMoveTask={onMoveTask}
          onEditTask={onEditTask}
          onReorderTasks={onReorderTasks}
          onTaskClick={onTaskClick}
          className="quadrant-not-urgent-not-important border-muted-foreground/30"
          goals={goals}
          isAIThinking={isAIThinking}
          aiProcessingTaskId={aiProcessingTaskId}
          highlightTaskId={highlightTaskId}
        />
      </div>
    </div>
  )
}
