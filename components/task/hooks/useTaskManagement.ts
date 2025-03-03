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
        let taskExists = false;
        
        setTasks(prevTasks => {
          const taskIndex = prevTasks.findIndex(task => task.id === id);
          if (taskIndex === -1) return prevTasks;
          
          taskExists = true;
          const updatedTasks = [...prevTasks];
          updatedTasks[taskIndex] = {
            ...updatedTasks[taskIndex],
            archivedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          return updatedTasks;
        });
        
        return taskExists;
      } catch (error) {
        console.error("Error archiving task:", error);
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
  const addTaskWithAIAnalysis = useCallback(async (text: string, initialQuadrant: QuadrantType = "q4", userGoal: string = "", userPriority: string = ""): Promise<{ task: Task | null, isAnalyzing: boolean }> => {
    try {
      console.log("[DEBUG] Starting AI analysis for task:", text.substring(0, 30));
      
      // Always add the task to Q4 first for visual feedback
      const task = addTask({
        text,
        quadrant: 'q4', // Always start in Q4
        completed: false,
        needsReflection: false,
        status: 'active'
      });
      
      if (!task) {
        throw new Error("Failed to add task");
      }
      
      // Then analyze it with AI
      try {
        console.log("[DEBUG] Sending task to AI analysis API:", {
          text,
          initialQuadrant,
          userGoal,
          userPriority
        });
        
        // Add a slight delay to ensure the task is visible in Q4
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const response = await fetch('/api/analyze-reflection', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            task: text,
            justification: '',
            goal: userGoal,
            priority: userPriority,
            currentQuadrant: initialQuadrant
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
        if (result.isIdea && initialQuadrant !== 'q4') {
          // Delete the temporary task using internal function
          internalFunctions.current.deleteTaskInternal(task.id);
          
          // Add to Ideas Bank
          const event = new CustomEvent('addToIdeasBank', {
            detail: {
              text: text,
              taskType: result.taskType || 'idea',
              connectedToPriority: result.connectedToPriority || false
            }
          });
          window.dispatchEvent(event);
          
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
        const targetQuadrant = result.suggestedQuadrant || initialQuadrant || 'q4';
        const taskType = result.taskType || 'work';
        
        console.log(`[DEBUG] Moving task ${task.id} from Q4 to ${targetQuadrant}`);
        
        // Always update with the AI analysis results
        const updateSuccess = internalFunctions.current.updateTaskInternal(task.id, { 
          quadrant: targetQuadrant,
          taskType: taskType
        });
        
        if (!updateSuccess) {
          console.error(`[ERROR] Failed to update task ${task.id} with AI analysis results`);
        }
        
        if (!updateSuccess) {
          console.error(`[ERROR] Failed to update task ${task.id} with AI analysis results`);
        }
        
        // Log the task update for debugging
        console.log(`[DEBUG] Task ${task.id} updated with quadrant ${targetQuadrant} and type ${taskType}`);
        return { task, isAnalyzing: false };
        
      } catch (analysisError) {
        console.error("Error analyzing task:", analysisError);
        // Return the task even if analysis failed, but keep it in the initial quadrant
        return { task, isAnalyzing: false };
      }
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
        
        isQ1Task = prevTasks[taskIndex].quadrant === "q1";
        wasCompleted = prevTasks[taskIndex].completed;
        
        const updatedTasks = [...prevTasks]
        updatedTasks[taskIndex] = {
          ...updatedTasks[taskIndex],
          status: updatedTasks[taskIndex].status === 'completed' ? 'active' : 'completed',
          completed: updatedTasks[taskIndex].status === 'completed' ? false : true,
          updatedAt: new Date().toISOString(),
          completedAt: updatedTasks[taskIndex].status === 'completed' ? undefined : new Date().toISOString(),
        }

        return updatedTasks
      })
      
      // Show confetti if a Q1 task is being marked as completed
      if (isQ1Task && !wasCompleted) {
        setShowConfetti(true);
      }
      
      return true
    } catch (error) {
      console.error("Error toggling task:", error)
      return false
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
