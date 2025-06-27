"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useProfile } from "@/hooks/use-profile"
import { useTaskManagement } from "@/components/task/hooks/useTaskManagement"
import useLocalStorage from '@/hooks/useLocalStorage';
import type { Task, TaskStatus, QuadrantKeys, TaskType, NewTask } from "@/types/task"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Plus, MessageCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { exportTasksToCSV } from "@/lib/export-utils"
import { EisenhowerMatrix } from "@/components/eisenhower-matrix"
import { TaskModal } from "@/components/task-modal"
import { TaskCompletionConfetti } from "@/components/ui/task-completion-confetti"
import { VelocityMeters } from "@/components/velocity-meters"
import { EndDayScorecard } from "@/components/end-day-scorecard"
import { ChatDialog } from "@/components/ui/chat-dialog"
import { Id } from "../convex/_generated/dataModel"; // Import Id type
import { api } from "../convex/_generated/api"
import { useQuery } from "convex/react"

export const TaskManager: React.FC = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [aiProcessingTaskId, setAiProcessingTaskId] = useState<Id<"tasks"> | null>(null);
  const [aiReasoning, setAiReasoning] = useState<string>();
  const [targetQuadrant, setTargetQuadrant] = useState<QuadrantKeys>();
  const [aiError, setAiError] = useState(false);
  const [scorecardOpen, setScorecardOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [highlightedTaskId, setHighlightedTaskId] = useState<Id<"tasks"> | null>(null);

  const { 
    addTask, 
    addTaskWithAIAnalysis,
    updateTask, 
    deleteTask, 
    reorderTasks,
    showConfetti,
    hideConfetti
  } = useTaskManagement();


  // Fetch active goals to pass down for display
  const activeGoals = useQuery(api.goals.getActiveGoals);

  // Read sidebar visibility setting
  const [showSidebars] = useLocalStorage<boolean>('showEisenhowerSidebars', true);

  const handleTaskClick = (task: Task) => {
    router.push(`/tasks/${task.id}`);
  };

  // Shared quadrant names mapping - memoized to prevent unnecessary re-renders
  const quadrantNames = useMemo<Record<QuadrantKeys, string>>(() => ({
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
      // Update local taskList state immediately
      // Removed, as we are now using the tasks prop directly
    }
    
    // Show quadrant change notification
    if (detail.updates?.quadrant && typeof detail.updates.quadrant === 'string') {
      const quadrant = detail.updates.quadrant as QuadrantKeys;
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

  
  // Handle AI thinking state changes
  const handleAIThinkingChanged = useCallback((event: Event) => {
    const { detail } = event as CustomEvent;
    if (detail?.thinking !== undefined) {
      setIsAIThinking(detail.thinking);
      // Track which specific task is being processed
      if (detail.thinking && detail.taskId) {
        setAiProcessingTaskId(detail.taskId);
      } else if (!detail.thinking) {
        setAiProcessingTaskId(null);
      }
      if (detail.message) {
        toast({
          description: detail.message,
          className: 'bg-card text-card-foreground'
        });
      }
    } else {
      console.log('[DEBUG] Thinking state undefined in event detail');
    }
  }, [toast]);

  // Handle AI analysis errors
  const handleAIAnalysisError = useCallback((event: Event) => {
    const { detail } = event as CustomEvent;
    
    // Set AI error state to true
    setAiError(true);
    
    // Show error toast if there's a message
    if (detail?.message) {
      toast({
        title: 'AI Analysis Error',
        description: detail.message,
        variant: 'destructive'
      });
    }
    
    // Reset AI error state after 10 seconds
    setTimeout(() => setAiError(false), 10000);
    
    // Close modal and reset submitting state
    setTaskModalOpen(false);
  }, [toast, setTaskModalOpen]);

  // Handle AI analysis completion
  const handleAIAnalysisComplete = useCallback((event: Event) => {
    const customEvent = event as CustomEvent;
    const detail = customEvent.detail;

    if (detail && detail.taskId && detail.targetQuadrant && detail.taskType) {
      const { taskId, targetQuadrant, taskType, reasoning, message } = detail;

      // Update local taskList state immediately
      // Removed, as we are now using the tasks prop directly

      // Update modal-related state (though modal closes immediately after)
      if (reasoning) {
        setAiReasoning(reasoning);
      }
      setTargetQuadrant(targetQuadrant);

      // Show toast notification (optional, maybe redundant if UI updates instantly)
      if (message) {
         console.log('[DEBUG] AI Analysis complete message:', message);
         // toast({ description: message, className: 'bg-card text-card-foreground' }); // Uncomment if toast is desired
      }

      // Close the modal now that the task has been analyzed and moved
      console.log('[DEBUG] Closing modal after AI analysis complete');
      setTaskModalOpen(false);
    } else {
      console.log('[DEBUG] Missing required detail (taskId, targetQuadrant, taskType) in aiAnalysisComplete event');
      // Still close modal even if detail is incomplete to avoid getting stuck
      setTaskModalOpen(false);
    }
  }, [setTaskModalOpen]); // Removed toast dependency as it's commented out

  // Set up event listeners
  useEffect(() => {
    // Add event listeners
    window.addEventListener('taskUpdated', handleTaskUpdated);
    window.addEventListener('exportTasks', handleExport);
    window.addEventListener('aiThinkingChanged', handleAIThinkingChanged);
    window.addEventListener('aiAnalysisError', handleAIAnalysisError);
    window.addEventListener('aiAnalysisComplete', handleAIAnalysisComplete);
    
    // Cleanup event listeners
    return () => {
      window.removeEventListener('taskUpdated', handleTaskUpdated);
      window.removeEventListener('exportTasks', handleExport);
      window.removeEventListener('aiThinkingChanged', handleAIThinkingChanged);
      window.removeEventListener('aiAnalysisError', handleAIAnalysisError);
      window.removeEventListener('aiAnalysisComplete', handleAIAnalysisComplete);
    };
  }, [handleTaskUpdated, handleExport, handleAIThinkingChanged, handleAIAnalysisError, handleAIAnalysisComplete]);

  // Reset AI analysis state when modal closes
  useEffect(() => {
    if (!taskModalOpen) {
      setAiReasoning(undefined);
      setTargetQuadrant(undefined);
      setAiError(false);
    }
  }, [taskModalOpen]); // Include all event handlers in deps

  const handleUpdateTaskStatus = async (taskId: string, status: TaskStatus, goalId?: Id<"goals">) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    try {
      const updates = { status, completedAt: status === 'completed' ? new Date().toISOString() : undefined, goalId };
      await updateTask(taskId as Id<"tasks">, updates);
    } catch (error) {
      console.error('Error updating task status:', error);
      toast({
        description: 'Failed to update task status',
        variant: 'destructive'
      });
    }
  };

  const handleAddTask = useCallback(async (text: string, goalId?: Id<"goals">, dueDate?: string) => {
    if (!text.trim()) {
      toast({ title: "Error", description: "Task text cannot be empty.", variant: "destructive" });
      return;
    }

    // Always use AI analysis for auto-sorting - this is a core feature
    const shouldUseAI = true;
    
    let result: { success: boolean; taskId?: Id<"tasks">; error?: string; message?: string };

    if (shouldUseAI) {
      console.log("[TaskManager] Adding task with AI analysis...");
      // Ensure addTaskWithAIAnalysis is called with correct arguments
      // It expects: text: string, goalId?: Id<"goals">, dueDate?: string
      result = await addTaskWithAIAnalysis(text, goalId, dueDate);
    } else {
      console.log("[TaskManager] Adding task directly...");
      const taskData: NewTask = { 
        text, 
        quadrant: 'q4', // Default quadrant, backend will re-sort
        goalId: goalId, // Pass goalId (type should be compatible or handled in `addTask`)
        dueDate, 
        status: 'active',
        taskType: 'personal', // Default task type
        // userId is handled by the backend
        // createdAt and updatedAt are handled by the backend
      };
      result = await addTask(taskData);
    }

    if (result.success && result.taskId) {
      toast({ title: "Task Added", description: result.message || "New task has been successfully added." });
      setTaskModalOpen(false); // Close modal on success
      setHighlightedTaskId(result.taskId); // Highlight the new task
      // Clear highlight after a delay
      setTimeout(() => setHighlightedTaskId(null), 3000); // Clear after 3 seconds
    } else {
      toast({ title: "Error", description: result.error || "Failed to add task.", variant: "destructive" });
    }
  }, [addTask, addTaskWithAIAnalysis, toast]);

  const handleMoveTask = async (taskId: string, newQuadrant: QuadrantKeys) => {
    try {
      await updateTask(taskId as Id<"tasks">, { quadrant: newQuadrant });
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
      await deleteTask(taskId as Id<"tasks">);
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
      await updateTask(taskId as Id<"tasks">, { text });
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
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      handleUpdateTaskStatus(taskId, task.status === 'completed' ? 'active' : 'completed');
    }
  };

  // Fetch tasks using useQuery
  const rawTasks = useQuery(api.tasks.getTasks);

  // Map Convex tasks to local Task interface
  const tasks = useMemo(() => {
    return (rawTasks ?? []).map((task): Task => {
      return {
        ...task,
        id: task._id, // Map _id directly
        quadrant: task.quadrant as QuadrantKeys, // Cast quadrant
        taskType: task.taskType as TaskType | undefined, // Cast taskType
        status: task.status as TaskStatus, // Cast status
        goalId: task.goalId, // Map optional goalId directly
        // Ensure createdAt and updatedAt are strings if necessary (Convex _creationTime is number)
        createdAt: new Date(task._creationTime).toISOString(), // Example conversion if needed
        updatedAt: task.updatedAt, // Assuming updatedAt is already string or handled
      };
    });
  }, [rawTasks]);

  // Handle loading state
  if (rawTasks === undefined) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-muted-foreground">Loading tasks...</p>
      </div>
    );
  }

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

      <div className="mt-4 relative pb-10">
        <EisenhowerMatrix
          tasks={tasks
            .filter(t => t.status === 'active' || 
              (t.status === 'completed' && t.completedAt && 
               new Date(t.completedAt).toDateString() === new Date().toDateString()))}
          onToggleTask={handleToggleTask}
          onDeleteTask={handleDeleteTask}
          onMoveTask={handleMoveTask}
          onEditTask={handleEditTask}
          onReorderTasks={reorderTasks}
          onTaskClick={handleTaskClick}
          isAIThinking={isAIThinking}
          aiProcessingTaskId={aiProcessingTaskId} // Pass the specific task being processed
          goals={activeGoals} // Pass goals down
          highlightTaskId={highlightedTaskId} // Pass the ID of the task to highlight
        />
      </div>


      <TaskModal 
        open={taskModalOpen}
        onOpenChange={setTaskModalOpen}
        onAddTask={handleAddTask}
        aiReasoning={aiReasoning}
        targetQuadrant={targetQuadrant}
        aiError={aiError}
        availableGoals={activeGoals} // Pass fetched goals
      />
      
      <div className="mt-6 mb-2">
        <EndDayScorecard
          isOpen={scorecardOpen}
          onClose={() => setScorecardOpen(false)}
          tasks={tasks}
        />

        <ChatDialog
          open={chatOpen}
          onOpenChange={setChatOpen}
          tasks={tasks}
          userContext={useProfile.getState().getPersonalContext()}
        />
      </div>

      {/* Velocity Meters */}
      <div className="mt-6"> 
        <VelocityMeters 
          tasks={tasks.filter(t => t.status === 'active' || t.status === 'completed')} 
        />
      </div>
    </div>
  );
};
