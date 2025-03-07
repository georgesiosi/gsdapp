"use client"

import { useEffect, useState } from "react"
import { useProfile } from "@/hooks/use-profile"
import { ReasoningLogService } from "@/services/ai/reasoningLogService"
import { useReflectionSystem } from "@/components/task/hooks/useReflectionSystem"
import { useTaskManagement } from "@/components/task/hooks/useTaskManagement"
import { useIdeasManagement } from "@/components/ideas/hooks/useIdeasManagement"
import type { TaskOrIdeaType, Task, TaskStatus, TaskType, QuadrantType } from "@/types/task"
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
import IdeaPriorityDialog from "@/components/ideas/idea-priority-dialog"
import { ScorecardButton } from "@/components/scorecard-button"
import { EndDayScorecard } from "@/components/end-day-scorecard"
import { ChatDialog } from "@/components/ui/chat-dialog"
import { getStorage, setStorage } from "@/lib/storage"

interface Task {
  id: string;
  text: string;
  completed: boolean;
  needsReflection?: boolean;
  status?: TaskStatus;
  taskType?: TaskType;
  createdAt?: number;
  updatedAt?: number;
}

interface TaskManagerProps {
  tasks: Task[];
}

const TaskManager: React.FC<TaskManagerProps> = ({ tasks }) => {
  const router = useRouter();
  const { toast } = useToast();
  const { 
    tasks: taskList, 
    addTask, 
    addTaskWithAIAnalysis, 
    updateTask, 
    deleteTask, 
    toggleTask, 
    reorderTasks,
    setInitialTasks,
    showConfetti,
    hideConfetti
  } = useTaskManagement()
  const { addIdea, ideas, setInitialIdeas } = useIdeasManagement()
  const { reflectingTask, startReflection, submitReflection, cancelReflection } = useReflectionSystem()

  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [isAIThinking, setIsAIThinking] = useState(false)
  const [ideaDialogOpen, setIdeaDialogOpen] = useState(false)
  const [currentIdea, setCurrentIdea] = useState({ text: "", taskType: "personal" as TaskType, connectedToPriority: false });

  // Flag to track if tasks are being loaded from localStorage
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [isLoadingIdeas, setIsLoadingIdeas] = useState(true);
  const [scorecardOpen, setScorecardOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  // Load tasks from localStorage using storage utility
  useEffect(() => {
    const loadTasks = () => {
      try {
        // Use our storage utility instead of direct localStorage access
        const parsedTasks = getStorage('TASKS');
        
        if (parsedTasks) {
          // Debug logging for loaded tasks
          console.log("[DEBUG] Loading tasks from storage:", parsedTasks);
          console.log("[DEBUG] Task types from storage:", parsedTasks.map((t: any) => ({ id: t.id, text: t.text.substring(0, 20), type: t.taskType })));
          
          // Check if any tasks have work or business type
          const workTasks = parsedTasks.filter((t: any) => t.taskType === "work" || t.taskType === "business");
          console.log("[DEBUG] Work/Business tasks in storage:", workTasks.map((t: any) => ({ id: t.id, text: t.text.substring(0, 20), type: t.taskType })));
          
          // Convert all dates to ISO strings for consistent handling
          const formattedTasks = parsedTasks.map((task: any) => ({
            ...task,
            createdAt: typeof task.createdAt === 'string' ? 
              task.createdAt : new Date(task.createdAt).toISOString(),
            updatedAt: typeof task.updatedAt === 'string' ? 
              task.updatedAt : new Date(task.updatedAt).toISOString(),
            completedAt: task.completedAt ? 
              (typeof task.completedAt === 'string' ? 
                task.completedAt : new Date(task.completedAt).toISOString()) : 
              undefined
          }));
          
          // Debug logging for formatted tasks
          console.log("[DEBUG] Formatted tasks after loading:", formattedTasks);
          console.log("[DEBUG] Task types after formatting:", formattedTasks.map((t: any) => ({ id: t.id, text: t.text.substring(0, 20), type: t.taskType })));
          
          // Check if any tasks have work or business type after formatting
          const formattedWorkTasks = formattedTasks.filter((t: any) => t.taskType === "work" || t.taskType === "business");
          console.log("[DEBUG] Work/Business tasks after formatting:", formattedWorkTasks.map((t: any) => ({ id: t.id, text: t.text.substring(0, 20), type: t.taskType })));
          
          setInitialTasks(formattedTasks);
        }
        setIsLoadingTasks(false);
      } catch (error) {
        console.error("Error loading tasks from storage:", error);
        setIsLoadingTasks(false);
      }
    };
    
    loadTasks();
  }, [setInitialTasks]);

  // Load ideas from storage using our storage utility
  useEffect(() => {
    const loadIdeas = () => {
      try {
        // Use our storage utility instead of direct localStorage access
        const parsedIdeas = getStorage('IDEAS');
        if (parsedIdeas) {
          // Debug logging for loaded ideas
          console.log("[DEBUG] Loading ideas from storage:", parsedIdeas);
          
          // Convert all dates to ISO strings for consistent handling
          const formattedIdeas = parsedIdeas.map((idea: any) => ({
            ...idea,
            createdAt: typeof idea.createdAt === 'string' ? 
              idea.createdAt : new Date(idea.createdAt).toISOString(),
            updatedAt: typeof idea.updatedAt === 'string' ? 
              idea.updatedAt : new Date(idea.updatedAt).toISOString()
          }));
          
          setInitialIdeas(formattedIdeas);
        }
        setIsLoadingIdeas(false);
      } catch (error) {
        console.error("Error loading ideas from storage:", error);
        setIsLoadingIdeas(false);
      }
    };
    
    loadIdeas();
  }, [setInitialIdeas]);

  // Save tasks to storage whenever they change
  useEffect(() => {
    if (taskList.length > 0) {
      try {
        // Debug logging for tasks before saving
        console.log("[DEBUG] Saving tasks to storage:", taskList);
        console.log("[DEBUG] Task status:", taskList.map(t => ({
          id: t.id,
          text: t.text.substring(0, 20),
          status: t.status,
          completedAt: t.completedAt
        })));
        
        // Ensure all tasks have proper date fields before saving
        const tasksToSave = taskList.map(task => ({
          ...task,
          createdAt: task.createdAt || new Date().toISOString(),
          updatedAt: task.updatedAt || new Date().toISOString(),
          completedAt: task.status === 'completed' ? (task.completedAt || new Date().toISOString()) : undefined
        }));
        
        setStorage('TASKS', tasksToSave);
        
        // Verify what was saved
        const savedTasks = getStorage('TASKS');
        if (savedTasks) {
          console.log("[DEBUG] Verified saved tasks:", savedTasks.length);
          console.log("[DEBUG] Verified task status:", savedTasks.map((t: any) => ({
            id: t.id,
            text: t.text.substring(0, 20),
            status: t.status,
            completedAt: t.completedAt
          })));
        }
      } catch (error) {
        console.error("Error saving tasks to storage:", error);
        toast({
          title: "Error Saving Tasks",
          description: "There was a problem saving your tasks. Changes may not persist.",
          variant: "destructive",
        });
      }
    }
  }, [taskList, toast]);

  // Save ideas to storage whenever they change
  useEffect(() => {
    if (!isLoadingIdeas && ideas.length > 0) {
      try {
        setStorage('IDEAS', ideas);
        console.log("[DEBUG] Saved ideas to storage:", ideas.length);
      } catch (error) {
        console.error("Error saving ideas to storage:", error);
        toast({
          title: "Error Saving Ideas",
          description: "There was a problem saving your ideas. Changes may not persist.",
          variant: "destructive",
        });
      }
    }
  }, [ideas, isLoadingIdeas, toast]);
  
  // Function removed after debugging was complete

  // Set up event listeners
  useEffect(() => {
    // Export tasks event listener
    const handleExport = () => {
      exportTasksToCSV();
      toast({
        title: "Tasks Exported",
        description: "Your tasks have been exported to CSV",
      });
    };
    
    // Ideas Bank event listener - listen for addToIdeasBank events from useTaskManagement
    const handleAddToIdeasBank = (event: Event) => {
      const customEvent = event as CustomEvent;
      
      if (customEvent.detail && customEvent.detail.text) {
        const idea = addIdea({
          text: customEvent.detail.text,
          taskType: customEvent.detail.taskType || 'idea',
          connectedToPriority: customEvent.detail.connectedToPriority || false
        });
        
        if (idea) {
          toast({
            title: "Idea Added",
            description: (
              <div>
                Added to Ideas Bank.{" "}
                <button 
                  onClick={() => router.push("/ideas-bank")} 
                  className="font-medium underline hover:text-primary"
                >
                  View Ideas Bank
                </button>
              </div>
            ),
            duration: 5000,
          });
        }
      }
    };
    
    window.addEventListener('exportTasks', handleExport);
    window.addEventListener('addToIdeasBank', handleAddToIdeasBank);
    
    return () => {
      window.removeEventListener('exportTasks', handleExport);
      window.removeEventListener('addToIdeasBank', handleAddToIdeasBank);
    };
  }, [addIdea, router, toast]);



  const handleUpdateTaskStatus = (taskId: string, status: TaskStatus) => {
    // Find all tasks in the same quadrant
    const task = taskList.find(t => t.id === taskId);
    if (!task) return;
    
    const quadrantTasks = taskList.filter(t => t.quadrant === task.quadrant);
    
    // Calculate new order based on status
    let newOrder = 0; // Default value
    if (status === 'completed') {
      // If completing task, put it at the end
      const maxOrder = Math.max(...quadrantTasks.map(t => t.order || 0));
      newOrder = maxOrder + 1;
    } else if (status === 'active') {
      // If uncompleting task, put it at the start of active tasks
      const activeTasks = quadrantTasks.filter(t => t.status === 'active');
      const minActiveOrder = activeTasks.length > 0 
        ? Math.min(...activeTasks.map(t => t.order || 0))
        : 0;
      newOrder = minActiveOrder - 1;
    }

    const timestamp = new Date().toISOString();
    const updates: Partial<Task> = {
      status,
      ...(status === 'completed' && { completedAt: timestamp }),
      updatedAt: timestamp,
      order: newOrder
    };

    updateTask(taskId, updates);
  };

  const handleAddTask = async (text: string, quadrant: string) => {
    if (!text.trim()) return;
    
    try {
      // First add the task to Q4
      const task = addTask({
        text,
        quadrant: 'q4', // Always start in Q4
        needsReflection: false,
        status: 'active',
        taskType: 'personal' // Default type until AI analysis
      });
      
      if (!task) {
        throw new Error("Failed to add task");
      }
      
      setTaskModalOpen(false);
      
      // Then analyze with AI
      setIsAIThinking(true);
      
      try {
        const response = await fetch('/api/analyze-reflection', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            task: text,
            justification: '',
            goal: '',
            priority: '',
            currentQuadrant: 'q4',
            personalContext: useProfile.getState().getPersonalContext()
          }),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to analyze input: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log("[DEBUG] AI analysis result:", result);
        
        // Validate the AI response
        if (!result || typeof result.isIdea !== 'boolean') {
          throw new Error('Invalid AI analysis response');
        }
        
        if (result.isIdea) {
          console.log("[DEBUG] Detected idea:", text);
          // If it's an idea, move it to the ideas bank via event system
          
          // First delete the task
          deleteTask(task.id);
          
          // Then dispatch the event to add to Ideas Bank
          const event = new CustomEvent('addToIdeasBank', {
            detail: {
              text,
              taskType: result.taskType || 'idea', 
              connectedToPriority: result.connectedToPriority || false
            }
          });
          console.log("[DEBUG] Dispatching addToIdeasBank event:", event.detail);
          window.dispatchEvent(event);
        } else {
          // Update the task with AI analysis
          const targetQuadrant = result.suggestedQuadrant || quadrant;
          const taskType = result.taskType || 'work';
          
          console.log("[DEBUG] Updating task with AI analysis:", {
            id: task.id,
            quadrant: targetQuadrant,
            taskType: taskType
          });
          
          updateTask(task.id, {
            quadrant: targetQuadrant,
            taskType: taskType
          });
          
          // Store the reasoning log
          try {
            ReasoningLogService.storeLog({
              taskId: task.id,
              taskText: text,
              timestamp: Date.now(),
              suggestedQuadrant: targetQuadrant,
              taskType: taskType,
              reasoning: result.reasoning || 'No reasoning provided',
              alignmentScore: result.alignmentScore || 5,
              urgencyScore: result.urgencyScore || 5,
              importanceScore: result.importanceScore || 5
            });
          } catch (logError) {
            console.error('Error storing reasoning log:', logError);
          }
        }
      } catch (analysisError) {
        console.error("Error analyzing task:", analysisError);
        // Task stays in Q4 if analysis fails
        toast({
          title: "Analysis Failed",
          description: "Task added to Q4. AI analysis failed.",
          variant: "destructive",
        });
      }
      
      setIsAIThinking(false);
    } catch (error) {
      console.error("Error in handleAddTask:", error);
      setIsAIThinking(false);
      toast({
        title: "Error Adding Task",
        description: "There was a problem adding your task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleMoveTask = (taskId: string, newQuadrant: QuadrantType) => {
    const task = taskList.find(t => t.id === taskId);
    if (!task) return;

    // Update the task's quadrant
    updateTask(taskId, { quadrant: newQuadrant });

    // Show a toast notification
    toast({
      title: "Task Moved",
      description: `Task moved to ${newQuadrant === 'q1' ? 'Urgent & Important' :
                    newQuadrant === 'q2' ? 'Important, Not Urgent' :
                    newQuadrant === 'q3' ? 'Urgent, Not Important' :
                    'Neither Urgent nor Important'}`
    });
  }

  const handleSendToIdeasBank = () => {
    console.log('[DEBUG] handleSendToIdeasBank called with:', {
      text: currentIdea.text.substring(0, 30),
      taskType: currentIdea.taskType,
      connectedToPriority: currentIdea.connectedToPriority
    });
    
    // Add the idea to the Ideas Bank
    try {
      const idea = addIdea({
        text: currentIdea.text,
        taskType: currentIdea.taskType,
        connectedToPriority: currentIdea.connectedToPriority
      });
      
      console.log('[DEBUG] addIdea returned:', idea ? idea.id : 'null');
      
      if (idea) {
        setIdeaDialogOpen(false);
        setTaskModalOpen(false);
        
        // Show a toast notification with a link to the Ideas Bank
        toast({
          title: "Idea Added",
          description: (
            <div>
              Added to Ideas Bank.{" "}
              <button 
                onClick={() => router.push("/ideas-bank")} 
                className="font-medium underline hover:text-primary"
              >
                View Ideas Bank
              </button>
            </div>
          ),
          duration: 5000,
        });
      } else {
        console.error('[ERROR] addIdea returned null');
        toast({
          title: "Error Adding Idea",
          description: "There was a problem adding your idea. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('[ERROR] Error in handleSendToIdeasBank:', error);
      toast({
        title: "Error Adding Idea",
        description: "There was a problem adding your idea. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleConvertToTask = async () => {
    // Convert the idea to a task
    const { task } = await addTaskWithAIAnalysis(currentIdea.text);
    
    if (task) {
      setIdeaDialogOpen(false);
      setTaskModalOpen(false);
      toast({
        title: "Task Added",
        description: "Your idea has been converted to a task and categorized by AI.",
      });
    }
  };

  return (
    <div>
      {/* Confetti animation for completing urgent & important tasks */}
      <TaskCompletionConfetti show={showConfetti} onComplete={hideConfetti} />
      
      {/* Idea priority dialog */}
      <IdeaPriorityDialog
        isOpen={ideaDialogOpen}
        ideaText={currentIdea.text}
        onClose={() => setIdeaDialogOpen(false)}
        onSendToIdeasBank={handleSendToIdeasBank}
        onConvertToTask={handleConvertToTask}
      />
      
      {/* Export tasks event listener is set up in a useEffect at the component level */}

      {/* Floating Action Buttons */}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2">
        <Button 
          variant="default" 
          onClick={() => setChatOpen(true)}
          className="rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-200"
          aria-label="Open chat assistant"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
        <Button 
          variant="default" 
          onClick={() => setTaskModalOpen(true)}
          className="rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-200"
          aria-label="Add new task"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      {/* Task Actions Section */}
      <div className="mb-4 flex justify-end space-x-2">
        {/* Test button removed after debugging was complete */}
        <ScorecardButton
          onClick={() => setScorecardOpen(true)}
          tasks={taskList.filter(t => t.status === 'active' || t.status === 'completed')}
          className="w-auto"
        />
      </div>

      <div className="mt-4">
        <EisenhowerMatrix
          tasks={taskList
            .filter(t => {
              // Show active tasks and tasks completed today
              if (t.status === 'active') return true;
              if (t.status === 'completed' && t.completedAt) {
                const completedDate = new Date(t.completedAt);
                const today = new Date();
                return completedDate.toDateString() === today.toDateString();
              }
              return false;
            })
            .map(task => ({
            ...task,
            createdAt: String(task.createdAt),
            updatedAt: String(task.updatedAt),
            completedAt: task.completedAt ? String(task.completedAt) : undefined
          }))}
          onToggleTask={(id) => {
            const task = taskList.find(t => t.id === id);
            if (!task) return;
            handleUpdateTaskStatus(id, task.status === 'completed' ? 'active' : 'completed');
          }}
          onDeleteTask={deleteTask}
          onReflectionRequested={startReflection}
          onMoveTask={handleMoveTask}
          onEditTask={(taskId, newText) => {
            updateTask(taskId, { text: newText });
            toast({
              title: "Task Updated",
              description: "Your task has been updated successfully.",
            });
          }}
          onReorderTasks={reorderTasks}
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
      
      {/* Velocity Meters */}
      <div className="mt-6 mb-2">
        
        {/* Velocity Meters for personal and work tasks */}
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

        <VelocityMeters 
          tasks={taskList.filter(t => t.status === 'active' || t.status === 'completed').map(task => {
            return {
              ...task,
              createdAt: String(task.createdAt),
              updatedAt: String(task.updatedAt),
              completedAt: task.completedAt ? String(task.completedAt) : undefined
            };
          })} 
        />
      </div>
    </div>
  )
}
