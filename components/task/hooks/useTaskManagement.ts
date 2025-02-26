import { useState, useCallback } from "react"
import { v4 as uuidv4 } from "uuid"
import { Task as TaskType } from "@/types/task"

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

  // Set initial tasks from localStorage
  const setInitialTasks = useCallback((loadedTasks: Task[]) => {
    try {
      // Ensure all tasks have required properties
      const validatedTasks = loadedTasks.filter(task => {
        if (!task) return false;
        
        // Check that task has all required properties
        const hasRequiredProps = 
          typeof task.id === 'string' && 
          typeof task.text === 'string' && 
          typeof task.quadrant === 'string' && 
          typeof task.completed === 'boolean' && 
          typeof task.needsReflection === 'boolean' &&
          typeof task.createdAt === 'number' &&
          typeof task.updatedAt === 'number';
        
        // Check that quadrant is valid
        const hasValidQuadrant = ['q1', 'q2', 'q3', 'q4'].includes(task.quadrant);
        
        return hasRequiredProps && hasValidQuadrant;
      });

      // Set tasks, preserving original IDs and timestamps
      setTasks(validatedTasks);
    } catch (error) {
      console.error("Error setting initial tasks:", error);
      // Fallback to empty array if there's an error
      setTasks([]);
    }
  }, []);

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

  // Update a task
  const updateTask = useCallback((id: string, updates: Partial<Task>): boolean => {
    try {
      let taskExists = false;
      
      // First check if the task exists
      taskExists = tasks.some(task => task.id === id);
      
      if (taskExists) {
        setTasks(prevTasks => 
          prevTasks.map(task => 
            task.id === id ? { ...task, ...updates, updatedAt: Date.now() } : task
          )
        );
      }
      
      return taskExists;
    } catch (error) {
      console.error("Error updating task:", error);
      return false;
    }
  }, [tasks])

  // Delete a task
  const deleteTask = useCallback((id: string): boolean => {
    try {
      // First check if the task exists
      const taskExists = tasks.some(task => task.id === id);
      
      if (taskExists) {
        setTasks(prevTasks => prevTasks.filter(task => task.id !== id));
      }
      
      return taskExists;
    } catch (error) {
      console.error("Error deleting task:", error);
      return false;
    }
  }, [tasks])

  // Toggle a task's completed status
  const toggleTask = useCallback((id: string): boolean => {
    try {
      // First check if the task exists
      const taskExists = tasks.some(task => task.id === id);
      
      if (taskExists) {
        setTasks(prevTasks => 
          prevTasks.map(task => {
            if (task.id === id) {
              const completed = !task.completed;
              return {
                ...task,
                completed,
                completedAt: completed ? Date.now() : undefined,
                updatedAt: Date.now(),
              };
            }
            return task;
          })
        );
      }
      
      return taskExists;
    } catch (error) {
      console.error("Error toggling task:", error);
      return false;
    }
  }, [tasks])

  return {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    toggleTask,
    setInitialTasks,
  }
}
