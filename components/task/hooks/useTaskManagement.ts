import { useState, useCallback, useRef } from "react"
import { v4 as uuidv4 } from "uuid"
import { TaskOrIdeaType } from "@/types/task"
import { ReasoningLogService } from "@/services/ai/reasoningLogService"

// Define the quadrant type locally
export type QuadrantType = "q1" | "q2" | "q3" | "q4"

export interface Task {
  id: string
  text: string
  quadrant: QuadrantType
  taskType?: TaskOrIdeaType
  completed: boolean
  needsReflection: boolean
  createdAt: number
  completedAt?: number
  updatedAt: number
  order?: number
}

export type NewTask = Omit<Task, "id" | "createdAt" | "updatedAt">

export function useTaskManagement() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [showConfetti, setShowConfetti] = useState(false)
  
  // Use a ref to store the internal update function
  const internalFunctions = useRef({
    updateTaskInternal: (id: string, updates: Partial<Task>): boolean => {
      try {
        // Debug logging for task updates
        console.log(`[DEBUG] updateTaskInternal - Updating task ${id} with:`, updates);
        
        setTasks(prevTasks => {
          const taskIndex = prevTasks.findIndex(task => task.id === id)
          if (taskIndex === -1) {
            console.log(`[DEBUG] updateTaskInternal - Task ${id} not found`);
            return prevTasks;
          }

          // Debug logging for the task before update
          console.log(`[DEBUG] updateTaskInternal - Task ${id} before update:`, {
            id: prevTasks[taskIndex].id,
            text: prevTasks[taskIndex].text.substring(0, 20),
            taskType: prevTasks[taskIndex].taskType
          });

          const updatedTasks = prevTasks.map((t, index) => {
            if (index === taskIndex) {
              const updatedTask = {
                ...t,
                ...updates,
                updatedAt: Date.now(),
              };
              
              // Debug logging for the task after update
              console.log(`[DEBUG] updateTaskInternal - Task ${id} after update:`, {
                id: updatedTask.id,
                text: updatedTask.text.substring(0, 20),
                quadrant: updatedTask.quadrant,
                taskType: updatedTask.taskType
              });
              
              return updatedTask;
            }
            return t;
          });

          return updatedTasks
        })
        return true
      } catch (error) {
        console.error("Error updating task:", error);
        return false;
      }
    }
  });

  // Set initial tasks
  const setInitialTasks = useCallback((initialTasks: Task[]) => {
    // Ensure all tasks have an order property
    const tasksWithOrder = initialTasks.map((task, index) => ({
      ...task,
      order: task.order !== undefined ? task.order : index
    }));
    
    // Sort tasks by order within each quadrant
    const sortedTasks = [...tasksWithOrder].sort((a, b) => {
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
      const now = Date.now();
      
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
          createdAt: now,
          updatedAt: now,
        };
        
        return [...prevTasks, task];
      });
      
      // Return a task with the same ID as the one added to state
      const createdTask: Task = {
        id: taskId, // Use the same ID
        ...newTask,
        order: 0, // This will be different in the state update, but it doesn't matter for the returned task
        createdAt: now,
        updatedAt: now,
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
      
      // First add the task normally with a temporary quadrant
      const task = addTask({
        text,
        quadrant: initialQuadrant,
        completed: false,
        needsReflection: false
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
        
        // Handle the result based on whether it's an idea or task
        if (result.isIdea) {
          console.log(`[DEBUG] Item ${task.id} identified as an idea`);
          
          // Update task type to 'idea' for proper handling in the TaskManager
          const updateSuccess = internalFunctions.current.updateTaskInternal(task.id, { 
            taskType: 'idea' as TaskOrIdeaType
          });
          
          if (!updateSuccess) {
            console.error(`[ERROR] Failed to mark ${task.id} as idea`);
          }

          // Return the task with isIdea flag for proper handling in TaskManager
          return { 
            task: { ...task, taskType: 'idea' as TaskOrIdeaType },
            isAnalyzing: false,
            isIdea: true,
            connectedToPriority: result.connectedToPriority || false
          };
        } else {
          // For non-ideas, update with quadrant and task type
          const targetQuadrant = result.suggestedQuadrant || initialQuadrant || 'q4';
          const taskType = result.taskType || 'work';
          
          console.log(`[DEBUG] Updating task ${task.id} with quadrant ${targetQuadrant} and type ${taskType}`);
          
          const updateSuccess = internalFunctions.current.updateTaskInternal(task.id, { 
            quadrant: targetQuadrant,
            taskType: taskType
          });
          
          if (!updateSuccess) {
            console.error(`[ERROR] Failed to update task ${task.id} with AI analysis results`);
          }
          
          // Store the reasoning log
          ReasoningLogService.storeLog({
            taskId: task.id,
            taskText: text,
            timestamp: Date.now(),
            suggestedQuadrant: result.suggestedQuadrant,
            taskType: result.taskType || 'work',
            reasoning: result.reasoning || 'No reasoning provided',
            alignmentScore: result.alignmentScore || 5,
            urgencyScore: result.urgencyScore || 5,
            importanceScore: result.importanceScore || 5
          });
          
          console.log(`[DEBUG] Stored reasoning log for task ${task.id}`);

          return { task, isAnalyzing: false, isIdea: false };
        }
        
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
    try {
      let taskExists = false;
      
      setTasks(prevTasks => {
        taskExists = prevTasks.some(task => task.id === id);
        return prevTasks.filter(task => task.id !== id);
      });
      
      return taskExists;
    } catch (error) {
      console.error("Error deleting task:", error);
      return false;
    }
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
          completed: !updatedTasks[taskIndex].completed,
          updatedAt: Date.now(),
          completedAt: !updatedTasks[taskIndex].completed ? Date.now() : undefined,
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
          updatedAt: Date.now()
        }));
        
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
