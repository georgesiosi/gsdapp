import { useState, useCallback, useRef } from "react"
import { v4 as uuidv4 } from "uuid"
import { TaskOrIdeaType, TaskStatus } from "@/types/task"
// Removed ReasoningLogService import as it's not needed here

// Define the quadrant type locally
export type QuadrantType = "q1" | "q2" | "q3" | "q4"

export interface Task {
  id: string
  text: string
  quadrant: QuadrantType
  taskType?: TaskOrIdeaType
  completed: boolean
  needsReflection: boolean
  createdAt: string
  completedAt?: string
  updatedAt: string
  order?: number
  status: TaskStatus
  archivedAt?: string // Used to hide tasks from view (replaces deletedAt functionality)
}

export type NewTask = Omit<Task, "id" | "createdAt" | "updatedAt">

export function useTaskManagement() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [showConfetti, setShowConfetti] = useState(false)
  
  // Use a ref to store the internal update function
  const internalFunctions = useRef<{
    updateTaskInternal: (id: string, updates: Partial<Task>) => boolean;
    deleteTaskInternal: (id: string) => boolean;
  }>({
    deleteTaskInternal: (id: string): boolean => {
      try {
        console.log(`[DEBUG] deleteTaskInternal - Deleting task ${id}`);
        let taskExists = false;
        
        // First, delete the task from localStorage to ensure it's completely removed
        try {
          const savedTasks = localStorage.getItem("tasks");
          if (savedTasks) {
            const parsedTasks = JSON.parse(savedTasks);
            const filteredTasks = parsedTasks.filter((t: any) => t.id !== id);
            localStorage.setItem("tasks", JSON.stringify(filteredTasks));
            console.log(`[DEBUG] deleteTaskInternal - Removed task ${id} from localStorage, remaining tasks:`, filteredTasks.length);
          }
        } catch (storageError) {
          console.error(`[ERROR] deleteTaskInternal - Failed to remove task ${id} from localStorage:`, storageError);
        }
        
        // Then update the state to actually remove the task (not just archive it)
        setTasks(prevTasks => {
          const taskIndex = prevTasks.findIndex(task => task.id === id);
          if (taskIndex === -1) {
            console.log(`[DEBUG] deleteTaskInternal - Task ${id} not found in state`);
            return prevTasks;
          }
          
          taskExists = true;
          console.log(`[DEBUG] deleteTaskInternal - Removing task ${id} from state`);
          const filteredTasks = prevTasks.filter(task => task.id !== id);
          return filteredTasks;
        });
        
        return taskExists;
      } catch (error) {
        console.error(`[ERROR] deleteTaskInternal - Error deleting task ${id}:`, error);
        return false;
      }
    },
    updateTaskInternal: (id: string, updates: Partial<Task>): boolean => {
      try {
        // Debug logging for task updates
        console.log(`[DEBUG] updateTaskInternal - Updating task ${id} with:`, updates);
        
        let updateSuccessful = false;
        
        setTasks(prevTasks => {
          const taskIndex = prevTasks.findIndex(task => task.id === id)
          if (taskIndex === -1) {
            console.log(`[DEBUG] updateTaskInternal - Task ${id} not found`);
            return prevTasks;
          }

          // Create a new array to ensure React detects the change
          const updatedTasks = [...prevTasks];
          
          // Update the specific task
          updatedTasks[taskIndex] = {
            ...updatedTasks[taskIndex],
            ...updates,
            updatedAt: new Date().toISOString(),
          };
          
          // Debug logging for the task after update
          console.log(`[DEBUG] updateTaskInternal - Task ${id} after update:`, {
            id: updatedTasks[taskIndex].id,
            text: updatedTasks[taskIndex].text.substring(0, 20),
            quadrant: updatedTasks[taskIndex].quadrant,
            taskType: updatedTasks[taskIndex].taskType,
            completed: updatedTasks[taskIndex].completed
          });
          
          updateSuccessful = true;
          return updatedTasks;
        });
        
        return updateSuccessful;
      } catch (error) {
        console.error("Error updating task:", error);
        return false;
      }
    }
  });

  // Migrate task data to include new fields
  const migrateTask = (task: Partial<Task> & { completed?: boolean }): Task => {
    if (!task.id || !task.text || !task.quadrant) {
      throw new Error('Missing required task fields');
    }
    
    return {
      id: task.id,
      text: task.text,
      quadrant: task.quadrant,
      taskType: task.taskType || 'personal',
      completed: task.completed || false,
      needsReflection: task.needsReflection || false,
      createdAt: task.createdAt || new Date().toISOString(),
      completedAt: task.completedAt,
      updatedAt: task.updatedAt || new Date().toISOString(),
      order: task.order || 0,
      status: task.status || (task.completed ? 'completed' : 'active'),
      archivedAt: task.archivedAt
    };
  };

  // Set initial tasks
  const setInitialTasks = useCallback((initialTasks: Task[]) => {
    // Migrate and ensure all tasks have required properties
    const migratedTasks = initialTasks.map(task => migrateTask(task));
    
    // Sort tasks by order within each quadrant
    const sortedTasks = [...migratedTasks].sort((a, b) => {
      // First sort by quadrant
      if (a.quadrant !== b.quadrant) {
        return a.quadrant.localeCompare(b.quadrant);
      }
      // Then sort by order within quadrant
      return (a.order || 0) - (b.order || 0);
    });
    
    setTasks(sortedTasks);
  }, [])

  // Add a new task
  const addTask = useCallback((newTask: NewTask): Task | null => {
    try {
      // Generate a single UUID to be used for both the state update and the returned task
      const taskId = uuidv4();
      
      setTasks(prevTasks => {
        // Find the highest order in this quadrant
        const quadrantTasks = prevTasks.filter(t => t.quadrant === newTask.quadrant);
        const maxOrder = quadrantTasks.length > 0 
          ? Math.max(...quadrantTasks.map(t => t.order || 0)) 
          : -1;
        
        const task: Task = {
          id: taskId, // Use the pre-generated ID
          ...newTask,
          order: maxOrder + 1, // Place at the end of the quadrant
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: newTask.status || 'active', // Ensure status is set
        };
        
        return [...prevTasks, task];
      });
      
      // Return a task with the same ID as the one added to state
      const createdTask: Task = {
        id: taskId, // Use the same ID
        ...newTask,
        order: 0, // This will be different in the state update, but it doesn't matter for the returned task
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: newTask.status || 'active', // Ensure status is set
      };
      
      return createdTask;
    } catch (error) {
      console.error("Error adding task:", error);
      return null;
    }
  }, [])

  // Add a new task with AI analysis
  const addTaskWithAIAnalysis = useCallback(async (taskData: {
    text: string,
    quadrant?: QuadrantType,
    completed?: boolean,
    needsReflection?: boolean,
    status?: TaskStatus,
    taskType?: TaskType,
    createdAt?: number,
    updatedAt?: number
  }): Promise<{ task: Task | null, isAnalyzing: boolean }> => {
    try {
      console.log("[DEBUG] Starting AI analysis for task:", taskData.text.substring(0, 30));
      
      // Add the task with provided or default values
      const task = addTask({
        text: taskData.text,
        quadrant: taskData.quadrant || 'q4',
        completed: taskData.completed || false,
        needsReflection: taskData.needsReflection || false,
        status: taskData.status || 'active',
        taskType: taskData.taskType || 'personal',
        createdAt: taskData.createdAt || Date.now(),
        updatedAt: taskData.updatedAt || Date.now()
      });
      
      if (!task) {
        throw new Error("Failed to add task");
      }

      // Return immediately to show the task in Q4
      setTimeout(async () => {
        try {
          console.log("[DEBUG] Sending task to AI analysis API:", {
            text: taskData.text,
            quadrant: taskData.quadrant || 'q4'
          });
          
          const response = await fetch('/api/analyze-reflection', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            task: taskData.text,
            justification: '',
            goal: '',
            priority: '',
            currentQuadrant: taskData.quadrant || 'q4'
          }),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to analyze task: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log("[DEBUG] AI analysis result:", result);
        
        if (result.error) {
          throw new Error(`API returned error: ${result.error}`);
        }

        // If this is an idea and we're not coming from the Ideas Bank, add it to the Ideas Bank
        if (result.isIdea) {
          console.log("[DEBUG] Detected idea, moving to Ideas Bank:", taskData.text);
          
          // Add to Ideas Bank
          // Create and dispatch event to add to Ideas Bank
          const event = new CustomEvent('addToIdeasBank', {
            detail: {
              text: taskData.text,
              taskType: result.taskType || taskData.taskType || 'idea',
              connectedToPriority: result.connectedToPriority || false,
              createdAt: taskData.createdAt || Date.now(),
              updatedAt: taskData.updatedAt || Date.now()
            }
          });
          window.dispatchEvent(event);
          
          // Remove the task from the tasks list
          console.log('[DEBUG] Detected idea, removing from tasks list:', task.id);
          
          // Use the deleteTask function to properly remove the task
          // This will handle both localStorage and state updates
          internalFunctions.current.deleteTaskInternal(task.id);
          
          // Show a toast notification
          const toastEvent = new CustomEvent('showToast', {
            detail: {
              message: 'Added to Ideas Bank',
              type: 'success',
              action: {
                label: 'View',
                onClick: () => window.location.href = '/ideas-bank'
              }
            }
          });
          window.dispatchEvent(toastEvent);
          
          return { task: null, isAnalyzing: false };
        }
        
        // For tasks (or items from Ideas Bank), update with AI analysis
        const targetQuadrant = result.suggestedQuadrant || taskData.quadrant || 'q4';
        const taskType = result.taskType || taskData.taskType || 'personal';
        
        console.log(`[DEBUG] Moving task ${task.id} from Q4 to ${targetQuadrant}`);
        
        // Always update with the AI analysis results
        setTasks(prevTasks => {
          const taskIndex = prevTasks.findIndex(t => t.id === task.id);
          if (taskIndex === -1) return prevTasks;

          const updatedTasks = [...prevTasks];
          updatedTasks[taskIndex] = {
            ...updatedTasks[taskIndex],
            quadrant: targetQuadrant,
            taskType: taskType,
            updatedAt: Date.now()
          };

          console.log(`[DEBUG] Task ${task.id} updated with quadrant ${targetQuadrant} and type ${taskType}`);
          return updatedTasks;
        });
        } catch (analysisError) {
          console.error("Error analyzing task:", analysisError);
          // Keep the task in Q4 if analysis fails
        }
      }, 100); // Start analysis after a very short delay

      // Return immediately with the task in Q4
      return { task, isAnalyzing: true };
    } catch (error) {
      console.error("Error in addTaskWithAIAnalysis:", error);
      return { task: null, isAnalyzing: false };
    }
  }, [addTask]);

  // Update a task (exposed function)
  const updateTask = useCallback((id: string, updates: Partial<Task>): boolean => {
    return internalFunctions.current.updateTaskInternal(id, updates);
  }, []);

  // Delete a task
  const deleteTask = useCallback((id: string): boolean => {
    return internalFunctions.current.deleteTaskInternal(id);
  }, [])

  // Toggle task completion
  const toggleTask = useCallback((id: string): boolean => {
    try {
      let isQ1Task = false;
      let wasCompleted = false;
      
      // Check if this is a Q1 task that's being completed
      setTasks(prevTasks => {
        const taskIndex = prevTasks.findIndex(task => task.id === id)
        if (taskIndex === -1) return prevTasks
        
        const currentTask = prevTasks[taskIndex];
        isQ1Task = currentTask.quadrant === "q1";
        wasCompleted = currentTask.status === 'completed';
        
        const now = new Date().toISOString();
        const updatedTasks = [...prevTasks];
        updatedTasks[taskIndex] = {
          ...currentTask,
          status: wasCompleted ? 'active' : 'completed',
          completed: !wasCompleted,
          updatedAt: now,
          completedAt: wasCompleted ? undefined : now,
        };

        // Debug logging for task completion
        console.log(`[DEBUG] Toggling task ${id}:`, {
          wasCompleted,
          newStatus: updatedTasks[taskIndex].status,
          completedAt: updatedTasks[taskIndex].completedAt
        });

        return updatedTasks;
      });
      
      // Show confetti if a Q1 task is being marked as completed
      if (isQ1Task && !wasCompleted) {
        setShowConfetti(true);
      }
      
      return true;
    } catch (error) {
      console.error("Error toggling task:", error);
      return false;
    }
  }, [])

  // Reorder tasks within a quadrant
  const reorderTasks = useCallback((quadrant: QuadrantType, sourceIndex: number, destinationIndex: number): boolean => {
    try {
      setTasks(prevTasks => {
        // Get tasks in this quadrant, separated by status
        const activeTasks = prevTasks
          .filter(task => task.quadrant === quadrant && task.status === 'active')
          .sort((a, b) => (a.order || 0) - (b.order || 0));
        
        const completedTasks = prevTasks
          .filter(task => task.quadrant === quadrant && task.status === 'completed')
          .sort((a, b) => (a.order || 0) - (b.order || 0));

        // Determine which array we're working with based on the source index
        const isActiveTask = sourceIndex < activeTasks.length;
        const workingArray = isActiveTask ? activeTasks : completedTasks;
        const adjustedSourceIndex = isActiveTask ? sourceIndex : sourceIndex - activeTasks.length;
        const adjustedDestIndex = isActiveTask ? destinationIndex : destinationIndex - activeTasks.length;
        
        if (adjustedSourceIndex < 0 || adjustedSourceIndex >= workingArray.length || 
            adjustedDestIndex < 0 || adjustedDestIndex >= workingArray.length) {
          return prevTasks; // Invalid indices
        }
        
        // Remove the task from its current position
        const [movedTask] = workingArray.splice(adjustedSourceIndex, 1);
        
        // Insert the task at the new position
        workingArray.splice(adjustedDestIndex, 0, movedTask);
        
        // Update order values for the affected array
        const updatedArray = workingArray.map((task, index) => ({
          ...task,
          order: index,
          updatedAt: new Date().toISOString()
        }));

        // Combine everything back together
        const updatedQuadrantTasks = [
          ...updatedArray,
          ...(isActiveTask ? completedTasks : activeTasks)
        ];
        
        // Create a new tasks array with the updated quadrant tasks
        return prevTasks
          .filter(task => task.quadrant !== quadrant) // Keep tasks from other quadrants
          .concat(updatedQuadrantTasks); // Add updated quadrant tasks
      });
      
      return true;
    } catch (error) {
      console.error("Error reordering tasks:", error);
      return false;
    }
  }, []);

  // Reset confetti state
  const hideConfetti = useCallback(() => {
    setShowConfetti(false);
  }, []);

  return {
    tasks,
    addTask,
    addTaskWithAIAnalysis,
    updateTask,
    deleteTask,
    toggleTask,
    reorderTasks,
    setInitialTasks,
    showConfetti,
    hideConfetti
  }
}
