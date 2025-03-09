"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useProfile } from "@/hooks/use-profile"
import { useReflectionSystem } from "@/components/task/hooks/useReflectionSystem"
import { useTaskManagement } from "@/components/task/hooks/useTaskManagement"
import { useIdeasManagement } from "@/components/ideas/hooks/useIdeasManagement"
import type { Task, TaskStatus, QuadrantType, TaskType } from "@/types/task"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Plus, MessageCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { exportTasksToCSV } from "@/lib/export-utils"
import { EisenhowerMatrix } from "@/components/eisenhower-matrix"
import { TaskModal } from "@/components/task-modal"
import { ReflectionCard } from "@/components/ui/reflection-card"
import { TaskCompletionConfetti } from "@/components/ui/task-completion-confetti"
import { VelocityMeters } from "@/components/velocity-meters"
import { ScorecardButton } from "@/components/scorecard-button"
import { EndDayScorecard } from "@/components/end-day-scorecard"
import { ChatDialog } from "@/components/ui/chat-dialog"
import { Id } from "../convex/_generated/dataModel"
import { api } from "../convex/_generated/api"
import { useMutation } from "convex/react"

interface TaskManagerProps {
  tasks?: Task[];
}

// Helper function to convert string ID to Convex ID
const toConvexId = (id: string): Id<"tasks"> => id as unknown as Id<"tasks">;

export const TaskManager: React.FC<TaskManagerProps> = () => {
  const router = useRouter();
  const { toast } = useToast();
  const migrateDates = useMutation(api.tasks.migrateDates);
  const [taskList, setTaskList] = useState<Task[]>([]);

  const { 
    tasks: hookTasks, 
    addTask, 
    addTaskWithAIAnalysis,
    updateTask, 
    deleteTask, 
    reorderTasks,
    showConfetti,
    hideConfetti
  } = useTaskManagement();

  // Keep local state in sync with hook state and handle updates
  useEffect(() => {
    // Only update if the tasks have actually changed
    if (hookTasks) {
      // Deep comparison to prevent unnecessary updates
      const tasksChanged = JSON.stringify(hookTasks) !== JSON.stringify(taskList);
      if (tasksChanged) {
        setTaskList(hookTasks);
      }
    }
  }, [hookTasks, taskList]); // Include taskList to satisfy eslint, deep comparison prevents infinite loops

  // Import ideas management but disable for now while fixing Convex DB setup
  const { } = useIdeasManagement(); // Destructure nothing since we're not using ideas yet
  const { reflectingTask, startReflection, submitReflection, cancelReflection } = useReflectionSystem();

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [scorecardOpen, setScorecardOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const handleTaskClick = (task: Task) => {
    router.push(`/tasks/${task.id}`);
  };

  // Shared quadrant names mapping - memoized to prevent unnecessary re-renders
  const quadrantNames = useMemo<Record<QuadrantType, string>>(() => ({
    q1: 'Urgent & Important',
    q2: 'Important, Not Urgent',
    q3: 'Urgent, Not Important',
    q4: 'Neither Urgent nor Important'
  }), []); // Empty deps array since this never changes

  // Memoized task update handler
  const handleTaskUpdated = useCallback((event: Event) => {
    const { detail } = event as CustomEvent;
    if (!detail?.taskId) return;
    
    // Update UI immediately for pre-update events
    if (detail.source?.includes('pre')) {
      setTaskList(prevTasks => {
        const taskIndex = prevTasks.findIndex(t => t.id === detail.taskId);
        if (taskIndex === -1) return prevTasks;
        
        // Only update if the task data has actually changed
        const updatedTask = {
          ...prevTasks[taskIndex],
          ...detail.updates,
        };
        
        if (JSON.stringify(updatedTask) === JSON.stringify(prevTasks[taskIndex])) {
          return prevTasks;
        }
        
        const updatedTasks = [...prevTasks];
        updatedTasks[taskIndex] = updatedTask;
        return updatedTasks;
      });
    }
    
    // Show quadrant change notification
    if (detail.updates?.quadrant && typeof detail.updates.quadrant === 'string') {
      const quadrant = detail.updates.quadrant as QuadrantType;
      toast({
        title: "Task Moved",
        description: `Task moved to ${quadrantNames[quadrant]}`,
        className: "bg-card text-card-foreground"
      });
    }
  }, [toast, quadrantNames]);

  // Memoized export handler
  const handleExport = useCallback(() => {
    exportTasksToCSV();
    toast({
      title: "Tasks Exported",
      description: "Your tasks have been exported to CSV",
      className: "bg-card text-card-foreground",
    });
  }, [toast]);

  // Memoized ideas bank handler
  const handleAddToIdeasBank = useCallback((event: Event) => {
    if ((event as CustomEvent).detail?.text) {
      router.push("/ideas-bank");
      toast({
        title: "Redirecting",
        description: "Taking you to the Ideas Bank",
        duration: 3000,
        className: "bg-card text-card-foreground",
      });
    }
  }, [router, toast]);
  
  // Set up event listeners
  useEffect(() => {
    // Add event listeners
    window.addEventListener('taskUpdated', handleTaskUpdated);
    window.addEventListener('exportTasks', handleExport);
    window.addEventListener('addToIdeasBank', handleAddToIdeasBank);
    
    // Cleanup event listeners
    return () => {
      window.removeEventListener('taskUpdated', handleTaskUpdated);
      window.removeEventListener('exportTasks', handleExport);
      window.removeEventListener('addToIdeasBank', handleAddToIdeasBank);
    };
  }, [handleTaskUpdated, handleExport, handleAddToIdeasBank]); // Include all event handlers in deps

  const handleUpdateTaskStatus = async (taskId: string, status: TaskStatus) => {
    const task = taskList.find(t => t.id === taskId);
    if (!task) return;
    
    try {
      await updateTask(toConvexId(taskId), {
        status,
        completedAt: status === 'completed' ? new Date().toISOString() : undefined
      });
    } catch (error) {
      console.error('Error updating task status:', error);
      toast({
        description: 'Failed to update task status',
        variant: 'destructive'
      });
    }
  };

  const handleAddTask = async (text: string) => {
    if (!text.trim()) return;
    
    try {
      setTaskModalOpen(false);
      setIsAIThinking(true);
      
      const { task, isAnalyzing } = await addTaskWithAIAnalysis({
        text,
        quadrant: 'q4',
        status: 'active',
        taskType: 'personal',
        needsReflection: false
      });
      
      if (!task) {
        throw new Error('Failed to add task');
      }
      
      // isAnalyzing will be true if the AI analysis is running in the background
      setIsAIThinking(isAnalyzing);
    } catch (error) {
      console.error('Error adding task:', error);
      toast({
        description: error instanceof Error ? error.message : 'Failed to add task',
        variant: 'destructive'
      });
    } finally {
      setIsAIThinking(false);
    }
  };

  const handleMoveTask = async (taskId: string, newQuadrant: QuadrantType) => {
    try {
      await updateTask(toConvexId(taskId), { quadrant: newQuadrant });
      const quadrantName = quadrantNames[newQuadrant];
      
      toast({
        description: `Task moved to ${quadrantName}`
      });
    } catch (error) {
      console.error('Error moving task:', error);
      toast({
        description: 'Failed to move task',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(toConvexId(taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        description: 'Failed to delete task',
        variant: 'destructive'
      });
    }
  };

  const handleEditTask = async (taskId: string, text: string) => {
    try {
      await updateTask(toConvexId(taskId), { text });
    } catch (error) {
      console.error('Error editing task:', error);
      toast({
        description: 'Failed to edit task',
        variant: 'destructive'
      });
    }
  };

  // Wrapper for onToggleTask to match EisenhowerMatrix's expected signature
  const handleToggleTask = (taskId: string) => {
    const task = taskList.find(t => t.id === taskId);
    if (task) {
      handleUpdateTaskStatus(taskId, task.status === 'completed' ? 'active' : 'completed');
    }
  };

  return (
    <div>
      <TaskCompletionConfetti show={showConfetti} onComplete={hideConfetti} />

      <div id="floating-action-buttons" className="fixed bottom-4 right-8 flex flex-col gap-2" style={{ zIndex: 100 }}>
        <Button 
          variant="default" 
          onClick={() => setChatOpen(true)}
          className="rounded-full p-3 shadow-lg hover:shadow-2xl hover:scale-110 hover:-translate-y-1.5 hover:bg-primary/90 transition-all duration-300 ease-out active:scale-95 active:shadow-lg"
          aria-label="Open chat assistant"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
        <Button 
          variant="default" 
          onClick={() => setTaskModalOpen(true)}
          className="rounded-full p-3 shadow-lg hover:shadow-2xl hover:scale-110 hover:-translate-y-1.5 hover:bg-primary/90 transition-all duration-300 ease-out active:scale-95 active:shadow-lg"
          aria-label="Add new task"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      <div className="mb-4 flex justify-between items-center space-x-2">
        <Button
          variant="outline"
          onClick={async () => {
            try {
              const result = await migrateDates();
              toast({
                title: "Migration Complete",
                description: `Updated ${result.updatedCount} tasks with dates`,
              });
            } catch (error) {
              toast({
                title: "Migration Failed",
                description: "Failed to update task dates",
                variant: "destructive"
              });
            }
          }}
        >
          Fix Task Dates
        </Button>
        <ScorecardButton
          tasks={taskList.filter(t => t.status === 'active' || t.status === 'completed')}
          className="w-auto"
        />
      </div>

      <div className="mt-4">
        <EisenhowerMatrix
          tasks={taskList
            .filter(t => t.status === 'active' || 
              (t.status === 'completed' && t.completedAt && 
               new Date(t.completedAt).toDateString() === new Date().toDateString()))}
          onToggleTask={handleToggleTask}
          onDeleteTask={handleDeleteTask}
          onReflectionRequested={startReflection}
          onMoveTask={handleMoveTask}
          onEditTask={handleEditTask}
          onReorderTasks={reorderTasks}
          onTaskClick={handleTaskClick}
          isAIThinking={isAIThinking}
        />
      </div>

      {reflectingTask && (
        <ReflectionCard
          task={reflectingTask}
          onSubmit={submitReflection}
          onCancel={cancelReflection}
        />
      )}

      <TaskModal 
        open={taskModalOpen}
        onOpenChange={setTaskModalOpen}
        onAddTask={handleAddTask}
        isAIThinking={isAIThinking}
      />
      
      <div className="mt-6 mb-2">
        <EndDayScorecard
          isOpen={scorecardOpen}
          onClose={() => setScorecardOpen(false)}
          tasks={taskList}
        />

        <ChatDialog
          open={chatOpen}
          onOpenChange={setChatOpen}
          tasks={taskList}
          userContext={useProfile.getState().getPersonalContext()}
        />
      </div>

      {/* Velocity Meters */}
      <VelocityMeters 
        tasks={taskList.filter(t => t.status === 'active' || t.status === 'completed')} 
      />
    </div>
  );
}
