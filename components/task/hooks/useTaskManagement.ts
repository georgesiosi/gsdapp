import { useState, useCallback, useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Task, QuadrantType, TaskStatus, TaskType, ConvexTask } from "@/types/task";

export type NewTask = {
  text: string;
  quadrant: QuadrantType;
  taskType?: TaskType;
  needsReflection?: boolean;
  status?: TaskStatus;
  description?: string;
};

// Helper function to convert ConvexTask to UI Task
const adaptConvexTask = (convexTask: ConvexTask): Task => {
  // Convert _creationTime to ISO string if createdAt/updatedAt not present (legacy tasks)
  const creationDate = new Date(convexTask._creationTime / 1000).toISOString();
  
  return {
    id: convexTask._id.toString(),
    text: convexTask.text,
    description: convexTask.description,
    quadrant: convexTask.quadrant,
    taskType: convexTask.taskType,
    status: convexTask.status,
    needsReflection: convexTask.needsReflection,
    reflection: convexTask.reflection,
    completedAt: convexTask.completedAt,
    order: convexTask.order,
    userId: convexTask.userId,
    _creationTime: convexTask._creationTime,
    createdAt: convexTask.createdAt || creationDate,
    updatedAt: convexTask.updatedAt || creationDate
  };
};

// Helper function to convert string ID to Convex ID
const toConvexId = (id: string): Id<"tasks"> => id as unknown as Id<"tasks">;

export function useTaskManagement() {
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Convex queries and mutations
  const rawConvexTasks = useQuery(api.tasks.getTasks);
  const addTaskMutation = useMutation(api.tasks.addTask);
  const updateTaskMutation = useMutation(api.tasks.updateTask);
  const deleteTaskMutation = useMutation(api.tasks.deleteTask);
  const reorderTasksMutation = useMutation(api.tasks.reorderTasks);

  // Memoize convex tasks to prevent unnecessary re-renders
  const convexTasks = useMemo(() => rawConvexTasks || [], [rawConvexTasks]);

  // Convert Convex tasks to UI tasks
  const tasks = useMemo(() => 
    convexTasks.map((task) => adaptConvexTask({
      ...task,
      quadrant: task.quadrant as QuadrantType,
      taskType: task.taskType as TaskType,
      status: task.status as TaskStatus,
    } as ConvexTask)),
    [convexTasks]
  );

  // Add a new task
  const addTask = useCallback(async (newTask: NewTask): Promise<string | null> => {
    try {
      const now = new Date().toISOString();
      const taskId = await addTaskMutation({
        text: newTask.text,
        quadrant: newTask.quadrant,
        taskType: newTask.taskType || 'personal',
        needsReflection: newTask.needsReflection || false,
        status: newTask.status || 'active',
        description: newTask.description,
        createdAt: now,
        updatedAt: now,
        order: 0 // Default order for new tasks
      } as ConvexTask);

      return taskId.toString();
    } catch (error) {
      console.error("Error adding task:", error);
      return null;
    }
  }, [addTaskMutation]);

  // Add a new task with AI analysis
  const addTaskWithAIAnalysis = useCallback(async (taskData: {
    text: string,
    quadrant?: QuadrantType,
    completed?: boolean,
    needsReflection?: boolean,
    status?: TaskStatus,
    taskType?: TaskType,
  }): Promise<{ task: Task | null, isAnalyzing: boolean }> => {
    try {
      // Add the task with provided or default values
      const taskId = await addTask({
        text: taskData.text,
        quadrant: taskData.quadrant || "q4",
        needsReflection: taskData.needsReflection || false,
        status: taskData.status || "active",
        taskType: taskData.taskType || "personal",
      });
      
      if (!taskId) {
        throw new Error("Failed to add task");
      }

      // Create a temporary task object
      const now = new Date().toISOString();
      const task: Task = {
        id: taskId,
        text: taskData.text,
        quadrant: taskData.quadrant || "q4",
        taskType: taskData.taskType || "personal",
        needsReflection: taskData.needsReflection || false,
        status: taskData.status || "active",
        userId: "", // Will be set by Convex
        _creationTime: Date.now(),
        createdAt: now,
        updatedAt: now,
        order: 0 // Default order for new tasks
      };

      // Return immediately to show the task in Q4
      setTimeout(async () => {
        // Get OpenAI API key from localStorage
        const openAIKey = localStorage.getItem('openai-api-key');
        
        if (!openAIKey) {
          const toast = (window as any).toast;
          if (toast) {
            toast.error(
              'Task added to Q4. AI analysis skipped: No OpenAI API key found. Add your API key in Settings to enable AI analysis.'
            );
          }
          return;
        }

        try {
          const response = await fetch("/api/analyze-reflection", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-openai-key": openAIKey,
            },
            body: JSON.stringify({
              task: taskData.text,
              justification: "",
              goal: "",
              priority: "",
              currentQuadrant: "q4" // Always start in Q4 during analysis
            }),
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to analyze task: ${response.status} ${response.statusText}\n${errorText}`);
          }
          
          const result = await response.json();
          
          if (result.error) {
            throw new Error(`API returned error: ${result.error}`);
          }

          // Update task with AI analysis results
          const targetQuadrant = result.suggestedQuadrant || "q4";
          const taskType = result.taskType || taskData.taskType || "personal";
          
          await updateTaskMutation({
            id: toConvexId(taskId),
            quadrant: targetQuadrant,
            taskType: taskType,
            reflection: result.reasoning ? {
              justification: result.reasoning,
              aiAnalysis: JSON.stringify(result),
              suggestedQuadrant: targetQuadrant,
              finalQuadrant: targetQuadrant,
              reflectedAt: new Date().toISOString(),
            } : undefined,
          });

          // Show success toast if quadrant changed
          if (targetQuadrant !== "q4") {
            const toast = (window as any).toast;
            if (toast) {
              toast.success(
                `Task analyzed and moved to ${targetQuadrant.toUpperCase()}: ${result.reasoning?.split('.')[0] || 'Based on AI analysis'}`
              );
            }
          }
        } catch (analysisError) {
          console.error("Error analyzing task:", analysisError);
          const toast = (window as any).toast;
          if (toast) {
            const errorMessage = analysisError instanceof Error ? analysisError.message : 'Unknown error';
            toast.error(
              `Task will remain in Q4. AI analysis failed: ${errorMessage}. Please check your API key and try again.`
            );
          }
        }
      }, 100);

      return { task, isAnalyzing: true };
    } catch (error) {
      console.error("Error in addTaskWithAIAnalysis:", error);
      return { task: null, isAnalyzing: false };
    }
  }, [addTask, updateTaskMutation]);

  // Update a task
  const updateTask = useCallback(async (id: string, updates: Partial<Omit<Task, "id" | "_creationTime" | "userId">>) => {
    try {
      await updateTaskMutation({
        id: toConvexId(id),
        ...updates,
      });
      return { success: true };
    } catch (error) {
      console.error("Error updating task:", error);
      return { success: false, error: "Failed to update task" };
    }
  }, [updateTaskMutation]);

  // Delete a task
  const deleteTask = useCallback(async (id: string) => {
    try {
      await deleteTaskMutation({
        id: toConvexId(id),
      });
      return { success: true };
    } catch (error) {
      console.error("Error deleting task:", error);
      return { success: false, error: "Failed to delete task" };
    }
  }, [deleteTaskMutation]);

  // Toggle task completion
  const toggleTask = useCallback(async (id: string) => {
    try {
      const task = convexTasks.find(t => t._id.toString() === id);
      if (!task) return { success: false, error: "Task not found" };
      
      const isQ1Task = task.quadrant === "q1";
      const wasCompleted = task.status === "completed";
      
      await updateTaskMutation({
        id: toConvexId(id),
        status: wasCompleted ? "active" : "completed",
        completedAt: wasCompleted ? undefined : new Date().toISOString(),
      });

      // Show confetti if a Q1 task is being marked as completed
      if (isQ1Task && !wasCompleted) {
        setShowConfetti(true);
      }
      
      return { success: true };
    } catch (error) {
      console.error("Error toggling task:", error);
      return { success: false, error: error instanceof Error ? error.message : "Unknown error occurred" };
    }
  }, [convexTasks, updateTaskMutation]);

  // Reorder tasks within a quadrant
  const reorderTasks = useCallback(async (quadrant: QuadrantType, sourceIndex: number, destinationIndex: number) => {
    try {
      await reorderTasksMutation({
        quadrant,
        sourceIndex,
        destinationIndex,
      });
      return { success: true };
    } catch (error) {
      console.error("Error reordering tasks:", error);
      return { success: false, error: error instanceof Error ? error.message : "Unknown error occurred" };
    }
  }, [reorderTasksMutation]);

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
    showConfetti,
    hideConfetti
  };
}
