import { useState, useCallback, useRef, useEffect } from "react"
import { v4 as uuidv4 } from "uuid"
import { TaskType, QuadrantType, TaskStatus, Task } from "@/types/task"
import { getStorage, setStorage } from "@/lib/storage"

export type NewTask = {
  text: string;
  quadrant: QuadrantType;
  taskType?: TaskType;
  needsReflection?: boolean;
  status?: TaskStatus;
  createdAt?: string;
  updatedAt?: string;
}

export function useTaskManagement() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [showConfetti, setShowConfetti] = useState(false)
  
  // Load tasks from storage on mount
  useEffect(() => {
    const savedTasks = getStorage('TASKS') as Task[] | null
    if (savedTasks?.length) {
      setTasks(savedTasks)
    }
  }, [])
  
  // Use a ref to store the internal update function
  type TaskResult = { success: boolean; error?: string };

  // Internal functions for task operations
  const internalFunctions = useRef<{
    updateTaskInternal: (id: string, updates: Partial<Task>) => TaskResult;
    deleteTaskInternal: (id: string) => TaskResult;
  }>({
    deleteTaskInternal: (id: string): TaskResult => {
      try {
        setTasks(prevTasks => {
          const filteredTasks = prevTasks.filter(task => task.id !== id)
          setStorage('TASKS', filteredTasks)
          return filteredTasks
        })
        return { success: true }
      } catch (error) {
        console.error(`Error deleting task ${id}:`, error)
        return { success: false, error: 'Failed to delete task' }
      }
    },
    updateTaskInternal: (id: string, updates: Partial<Task>): TaskResult => {
      try {
        setTasks(prevTasks => {
          const taskIndex = prevTasks.findIndex(task => task.id === id)
          if (taskIndex === -1) return prevTasks
          
          const updatedTask = {
            ...prevTasks[taskIndex],
            ...updates,
            updatedAt: new Date().toISOString()
          }
          
          const updatedTasks = [...prevTasks]
          updatedTasks[taskIndex] = updatedTask
          
          // Update storage and notify listeners
          setStorage('TASKS', updatedTasks)
          window.dispatchEvent(new CustomEvent('taskUpdated', { 
            detail: { taskId: id, updates: updatedTask } 
          }))
          
          return updatedTasks
        })
        
        return { success: true }
      } catch (error) {
        console.error('Error updating task:', error)
        return { success: false, error: 'Failed to update task' }
      }
    }
  });

  // Ensure task has all required fields with defaults
  const migrateTask = (task: Partial<Task>): Task => {
    if (!task.id || !task.text || !task.quadrant) {
      throw new Error('Missing required task fields')
    }
    
    return {
      id: task.id,
      text: task.text,
      quadrant: task.quadrant,
      taskType: task.taskType || 'personal',
      needsReflection: task.needsReflection || false,
      createdAt: task.createdAt || new Date().toISOString(),
      completedAt: task.completedAt,
      updatedAt: task.updatedAt || new Date().toISOString(),
      order: task.order || 0,
      status: task.status || 'active',
      description: task.description
    }
  }

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
      const taskId = uuidv4();
      const now = new Date().toISOString();
      
      const baseTask: Omit<Task, 'order'> = {
        id: taskId,
        text: newTask.text,
        quadrant: newTask.quadrant,
        taskType: newTask.taskType ?? 'personal',
        needsReflection: newTask.needsReflection ?? false,
        status: newTask.status ?? 'active',
        createdAt: now,
        updatedAt: now,
      };
      
      setTasks(prevTasks => {
        // Find the highest order in this quadrant
        const quadrantTasks = prevTasks.filter(t => t.quadrant === newTask.quadrant);
        const maxOrder = quadrantTasks.length > 0 
          ? Math.max(...quadrantTasks.map(t => t.order ?? 0)) 
          : -1;
        
        const newTask: Task = { ...baseTask, order: maxOrder + 1 };
        return [...prevTasks, newTask];
      });
      
      const task: Task = {
        ...baseTask,
        order: 0
      };
      return task;
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
    createdAt?: string,
    updatedAt?: string
  }): Promise<{ task: Task | null, isAnalyzing: boolean }> => {
    try {

      
      // Add the task with provided or default values
      const task = addTask({
        text: taskData.text,
        quadrant: taskData.quadrant || 'q4',
        needsReflection: taskData.needsReflection || false,
        status: taskData.status || 'active',
        taskType: taskData.taskType || 'personal',
        createdAt: taskData.createdAt || new Date().toISOString(),
        updatedAt: taskData.updatedAt || new Date().toISOString()
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
            updatedAt: new Date().toISOString()
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
  const updateTask = useCallback((id: string, updates: Partial<Task>): TaskResult => {
    return internalFunctions.current.updateTaskInternal(id, updates);
  }, []);

  // Delete a task
  const deleteTask = useCallback((id: string): TaskResult => {
    return internalFunctions.current.deleteTaskInternal(id);
  }, [])

  // Toggle task completion
  const toggleTask = useCallback((id: string): { success: boolean; error?: string } => {
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
          updatedAt: now,
          completedAt: wasCompleted ? undefined : now
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
      
      return { success: true };
    } catch (error) {
      console.error("Error toggling task:", error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  }, [])

  // Reorder tasks within a quadrant
  const reorderTasks = useCallback((quadrant: QuadrantType, sourceIndex: number, destinationIndex: number): TaskResult => {
    try {
      setTasks(prevTasks => {
        // Get tasks in this quadrant
        const quadrantTasks = prevTasks
          .filter(task => task.quadrant === quadrant)
          .sort((a, b) => (a.order || 0) - (b.order || 0));

        if (sourceIndex < 0 || sourceIndex >= quadrantTasks.length || 
            destinationIndex < 0 || destinationIndex >= quadrantTasks.length) {
          return prevTasks; // Invalid indices
        }
        
        // Remove the task from its current position
        const [movedTask] = quadrantTasks.splice(sourceIndex, 1);
        
        // Insert the task at the new position
        quadrantTasks.splice(destinationIndex, 0, movedTask);
        
        // Update order values for all tasks in the quadrant
        const updatedQuadrantTasks = quadrantTasks.map((task, index) => ({
          ...task,
          order: index,
          updatedAt: new Date().toISOString()
        }));
        
        // Create a new tasks array with the updated quadrant tasks
        return prevTasks
          .filter(task => task.quadrant !== quadrant) // Keep tasks from other quadrants
          .concat(updatedQuadrantTasks); // Add updated quadrant tasks
      });
      
      return { success: true };
    } catch (error) {
      console.error("Error reordering tasks:", error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
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
