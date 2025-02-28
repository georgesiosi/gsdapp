import { useState, useCallback, useRef } from "react"
import { v4 as uuidv4 } from "uuid"
import { Task as TaskType, TaskType as TaskTypeEnum } from "@/types/task"
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
}

export type NewTask = Omit<Task, "id" | "createdAt" | "updatedAt">

export function useTaskManagement() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [showConfetti, setShowConfetti] = useState(false)
  
  // Use a ref to store the internal update function
  const internalFunctions = useRef({
    updateTaskInternal: (id: string, updates: Partial<Task>): boolean => {
      try {
        setTasks(prevTasks => {
          const taskIndex = prevTasks.findIndex(task => task.id === id)
          if (taskIndex === -1) return prevTasks

          const updatedTasks = [...prevTasks]
          updatedTasks[taskIndex] = {
            ...updatedTasks[taskIndex],
            ...updates,
            updatedAt: Date.now(),
          }

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
    setTasks(initialTasks)
  }, [])

  // Add a new task
  const addTask = useCallback((newTask: NewTask): Task | null => {
    try {
      const task: Task = {
        id: uuidv4(),
        ...newTask,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      setTasks(prevTasks => [...prevTasks, task])
      return task
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
    setInitialTasks,
    showConfetti,
    hideConfetti
  }
}
