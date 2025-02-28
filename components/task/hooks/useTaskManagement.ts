import { useState, useCallback, useRef } from "react"
import { v4 as uuidv4 } from "uuid"
import { Task as TaskType, TaskType as TaskTypeEnum, QuadrantType } from "@/types/task"
import { ReasoningLogService, AIReasoningLog } from "@/services/ai/reasoningLogService"

export type QuadrantType = "q1" | "q2" | "q3" | "q4"

export interface Task {
  id: string
  text: string
  quadrant: QuadrantType
  taskType?: TaskTypeEnum
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

          const updatedTasks = [...prevTasks]
          updatedTasks[taskIndex] = {
            ...updatedTasks[taskIndex],
            ...updates,
            updatedAt: Date.now(),
          }
          
          // Debug logging for the task after update
          console.log(`[DEBUG] updateTaskInternal - Task ${id} after update:`, {
            id: updatedTasks[taskIndex].id,
            text: updatedTasks[taskIndex].text.substring(0, 20),
            taskType: updatedTasks[taskIndex].taskType
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
      setTasks(prevTasks => {
        // Find the highest order in this quadrant
        const quadrantTasks = prevTasks.filter(t => t.quadrant === newTask.quadrant);
        const maxOrder = quadrantTasks.length > 0 
          ? Math.max(...quadrantTasks.map(t => t.order || 0)) 
          : -1;
        
        const task: Task = {
          id: uuidv4(),
          ...newTask,
          order: maxOrder + 1, // Place at the end of the quadrant
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        
        return [...prevTasks, task];
      });
      
      // Return the newly created task
      // This is a bit of a hack since we can't easily get the created task from the state update
      const createdTask: Task = {
        id: uuidv4(),
        ...newTask,
        order: 0, // This will be overridden in the state update
        createdAt: Date.now(),
        updatedAt: Date.now(),
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
      // First add the task normally
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
          throw new Error('Failed to analyze task');
        }
        
        const result = await response.json();
        
        // Update the task with the suggested quadrant and taskType
        if (result.suggestedQuadrant) {
          internalFunctions.current.updateTaskInternal(task.id, { 
            quadrant: result.suggestedQuadrant,
            taskType: result.taskType
          });
          
          // Store the reasoning log
          ReasoningLogService.storeLog({
            taskId: task.id,
            taskText: text,
            timestamp: Date.now(),
            suggestedQuadrant: result.suggestedQuadrant,
            taskType: result.taskType,
            reasoning: result.reasoning || 'No reasoning provided',
            alignmentScore: result.alignmentScore,
            urgencyScore: result.urgencyScore,
            importanceScore: result.importanceScore
          });
        }
        
        return { task, isAnalyzing: false };
      } catch (analysisError) {
        console.error("Error analyzing task:", analysisError);
        // Return the task even if analysis failed
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
