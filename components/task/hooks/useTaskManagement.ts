import { useState, useCallback, useRef } from "react"
import { v4 as uuidv4 } from "uuid"
import { Task as TaskType } from "@/types/task"
import { ReasoningLogService, AIReasoningLog } from "@/services/ai/reasoningLogService"

export type QuadrantType = "q1" | "q2" | "q3" | "q4"

export interface Task {
  id: string
  text: string
  quadrant: QuadrantType
  completed: boolean
  needsReflection: boolean
  createdAt: number
  completedAt?: number
  updatedAt: number
}

export type NewTask = Omit<Task, "id" | "createdAt" | "updatedAt">

export function useTaskManagement() {
  const [tasks, setTasks] = useState<Task[]>([])
  
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

  // Update a task (exposed function)
  const updateTask = useCallback((id: string, updates: Partial<Task>): boolean => {
    return internalFunctions.current.updateTaskInternal(id, updates);
  }, []);

  // Add a new task with AI analysis
  const addTaskWithAIAnalysis = useCallback(async (text: string, initialQuadrant: QuadrantType = "q4"): Promise<{task: Task | null, isAnalyzing: boolean}> => {
    try {
      // First create the task with initial quadrant
      const task = addTask({
        text,
        quadrant: initialQuadrant,
        completed: false,
        needsReflection: false,
      });
      
      if (!task) {
        return { task: null, isAnalyzing: false };
      }
      
      // Start AI analysis
      try {
        // Get user goal and priority from localStorage
        const userGoal = localStorage.getItem('userGoal') || '';
        const userPriority = localStorage.getItem('userPriority') || '';
        
        // Call the API to analyze the task
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
        
        // Update the task with the suggested quadrant
        if (result.suggestedQuadrant) {
          internalFunctions.current.updateTaskInternal(task.id, { 
            quadrant: result.suggestedQuadrant 
          });
          
          // Store the reasoning log
          ReasoningLogService.storeLog({
            taskId: task.id,
            taskText: text,
            timestamp: Date.now(),
            suggestedQuadrant: result.suggestedQuadrant,
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
      let taskExists = false;
      
      setTasks(prevTasks => {
        const taskIndex = prevTasks.findIndex(task => task.id === id);
        taskExists = taskIndex !== -1;
        
        if (!taskExists) return prevTasks;
        
        const updatedTasks = [...prevTasks];
        const task = updatedTasks[taskIndex];
        const completed = !task.completed;
        
        updatedTasks[taskIndex] = {
          ...task,
          completed,
          completedAt: completed ? Date.now() : undefined,
          updatedAt: Date.now(),
        };
        
        return updatedTasks;
      });
      
      return taskExists;
    } catch (error) {
      console.error("Error toggling task:", error);
      return false;
    }
  }, [])

  return {
    tasks,
    addTask,
    addTaskWithAIAnalysis,
    updateTask,
    deleteTask,
    toggleTask,
    setInitialTasks,
  }
}
