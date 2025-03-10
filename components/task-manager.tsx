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
  const [aiReasoning, setAiReasoning] = useState<string>();
  const [targetQuadrant, setTargetQuadrant] = useState<string>();
  const [aiError, setAiError] = useState(false);
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
  
  // Handle AI thinking state changes
  const handleAIThinkingChanged = useCallback((event: Event) => {
    const { detail } = event as CustomEvent;
    console.log('[DEBUG] AI thinking changed event received:', detail);
    if (detail?.thinking !== undefined) {
      console.log('[DEBUG] Setting isAIThinking state to:', detail.thinking);
      setIsAIThinking(detail.thinking);
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
    console.log('[DEBUG] AI analysis error event received:', detail);
    
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
  }, [toast]);

  // Handle AI analysis completion
  const handleAIAnalysisComplete = useCallback((event: Event) => {
    // Extract the details from the event
    const customEvent = event as CustomEvent;
    const detail = customEvent.detail;
    
    console.log('[DEBUG] AI analysis complete raw event:', event);
    console.log('[DEBUG] AI analysis complete event detail:', detail);
    
    if (detail) {
      // Log all the properties we're interested in
      console.log('[DEBUG] Detail properties:', {
        message: detail.message,
        reasoning: detail.reasoning,
        targetQuadrant: detail.targetQuadrant,
        taskType: detail.taskType,
        result: detail.result
      });
      
      // Update state with AI analysis results
      if (detail.reasoning) {
        console.log('[DEBUG] Setting AI reasoning from event:', detail.reasoning);
        setAiReasoning(detail.reasoning);
      }
      
      if (detail.targetQuadrant) {
        console.log('[DEBUG] Setting target quadrant from event:', detail.targetQuadrant);
        setTargetQuadrant(detail.targetQuadrant);
      }
      
      // Show toast notification
      if (detail.message) {
        toast({
          title: 'AI Analysis Complete',
          description: detail.message,
          className: 'bg-card text-card-foreground'
        });
      }
    } else {
      console.log('[DEBUG] Missing detail in aiAnalysisComplete event');
    }
  }, [toast]);

  // Set up event listeners
  useEffect(() => {
    // Add event listeners
    window.addEventListener('taskUpdated', handleTaskUpdated);
    window.addEventListener('exportTasks', handleExport);
    window.addEventListener('addToIdeasBank', handleAddToIdeasBank);
    window.addEventListener('aiThinkingChanged', handleAIThinkingChanged);
    window.addEventListener('aiAnalysisError', handleAIAnalysisError);
    window.addEventListener('aiAnalysisComplete', handleAIAnalysisComplete);
    
    // Cleanup event listeners
    return () => {
      window.removeEventListener('taskUpdated', handleTaskUpdated);
      window.removeEventListener('exportTasks', handleExport);
      window.removeEventListener('addToIdeasBank', handleAddToIdeasBank);
      window.removeEventListener('aiThinkingChanged', handleAIThinkingChanged);
      window.removeEventListener('aiAnalysisError', handleAIAnalysisError);
      window.removeEventListener('aiAnalysisComplete', handleAIAnalysisComplete);
    };
  }, [handleTaskUpdated, handleExport, handleAddToIdeasBank, handleAIThinkingChanged, handleAIAnalysisError, handleAIAnalysisComplete]);

  // Reset AI analysis state when modal closes
  useEffect(() => {
    if (!taskModalOpen) {
      setAiReasoning(undefined);
      setTargetQuadrant(undefined);
      setAiError(false);
    }
  }, [taskModalOpen]); // Include all event handlers in deps

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
    
    console.log('[DEBUG handleAddTask] Starting task creation:', text);
    
    try {
      // Keep modal open while AI is thinking
      console.log('[DEBUG handleAddTask] Setting isAIThinking to true');
      setIsAIThinking(true);
      
      // We'll keep the modal open to show the AI analysis in progress
      console.log('[DEBUG handleAddTask] Calling addTaskWithAIAnalysis');
      const { task } = await addTaskWithAIAnalysis({
        text,
        quadrant: 'q4',
        status: 'active',
        taskType: 'personal',
        needsReflection: false
      });
      
      console.log('[DEBUG handleAddTask] Task creation result:', task);
      
      if (!task) {
        throw new Error('Failed to add task');
      }

      // Only close the modal when AI analysis is complete
      // The aiAnalysisComplete event handler will have already updated
      // the aiReasoning and targetQuadrant state values
      console.log('[DEBUG handleAddTask] Current AI reasoning:', aiReasoning);
      console.log('[DEBUG handleAddTask] Current target quadrant:', targetQuadrant);
      
      // Don't close the modal immediately - let user see the analysis first
      setTimeout(() => {
        console.log('[DEBUG handleAddTask] Closing modal after timeout');
        setTaskModalOpen(false);
      }, 1500); // Give user 1.5 seconds to see results

      // Show success message
      toast({
        description: 'Task added successfully',
        className: 'bg-card text-card-foreground'
      });
    } catch (error) {
      console.error('[DEBUG handleAddTask] Error adding task:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add task',
        variant: 'destructive'
      });
      // Close modal on error
      setTaskModalOpen(false);
    } finally {
      // Don't reset AI thinking state here - let the event handlers handle it
      console.log('[DEBUG handleAddTask] Task addition function completed');
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
        <ScorecardButton
          tasks={taskList.filter(t => t.status === 'active' || t.status === 'completed')}
          className="w-auto"
        />
      </div>

      <div className="mt-4 relative">
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
        aiReasoning={aiReasoning}
        targetQuadrant={targetQuadrant}
        aiError={aiError}
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
