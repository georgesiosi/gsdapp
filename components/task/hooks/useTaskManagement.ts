/**
 * Task Management Hook
 * 
 * Provides functionality for managing tasks with Convex backend integration
 * and AI-powered task analysis capabilities.
 */
import { useState, useMemo, useCallback } from "react";
import { useUser } from "@clerk/clerk-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel"; 
import type { Task, TaskStatus, QuadrantKeys, TaskType, NewTask } from "@/types/task"; 
import { useToast } from "@/components/ui/use-toast"; 

// --- Start: Local Definitions ---

// Simple function to ensure Convex tasks work with our unified Task interface
const ensureTaskCompatibility = (convexTask: any): Task => {
  return {
    ...convexTask,
    id: convexTask._id, // Map _id to id for UI compatibility
  };
};

// Function to determine task type based on text content
const determineTaskType = (taskText: string): TaskType => {
  const text = taskText.toLowerCase();
  
  // Business/work keywords
  const businessKeywords = [
    'business', 'company', 'work', 'meeting', 'client', 'customer', 'project', 
    'proposal', 'contract', 'invoice', 'revenue', 'marketing', 'sales', 
    'employee', 'team', 'deadline', 'presentation', 'report', 'budget',
    'strategy', 'launch', 'product', 'service', 'website', 'app'
  ];
  
  // Check if text contains business keywords
  if (businessKeywords.some(keyword => text.includes(keyword))) {
    return 'business';
  }
  
  // Default to personal
  return 'personal';
};

// Locally defined event types and interfaces for AI functionality
type AIEventDetail = {
  aiThinkingChanged: { thinking: boolean; message?: string; taskId?: Id<"tasks"> };
  aiAnalysisComplete: {
    taskId: string; // Added taskId
    message: string;
    result?: any; // Keep flexible for now
    targetQuadrant?: QuadrantKeys; // Use QuadrantKeys
    taskType?: TaskType; // Use TaskType
    reasoning?: string;
  };
  aiAnalysisError: { 
    error: string; 
    message: string;
    // taskId?: string; // Optional taskId based on previous lint errors/usage
  };
};

type AIEventType = keyof AIEventDetail;

// Locally defined helper function to dispatch events
const dispatchAIEvent = <T extends AIEventType>(eventType: T, detail: AIEventDetail[T]) => {
  console.log(`[DEBUG] Dispatching ${eventType} event with detail:`, detail);
  const event = new CustomEvent(eventType, { detail });
  window.dispatchEvent(event);
};

// Locally defined helper function to dispatch AI thinking state
const dispatchThinkingState = (thinking: boolean, message?: string, taskId?: Id<"tasks">) => {
  dispatchAIEvent('aiThinkingChanged', { thinking, message, taskId });
};

// Locally defined function to cast string ID to Convex ID
const toConvexId = (id: string): Id<"tasks"> => id as unknown as Id<"tasks">;

// Locally defined helper function to ensure goalId is correctly typed
const ensureGoalId = (goalId: string | Id<"goals"> | undefined): Id<"goals"> | undefined => {
  if (goalId === undefined) return undefined;
  if (typeof goalId === "string") return goalId as Id<"goals">;
  return goalId;
};

// --- End: Local Definitions ---


// Helper function for goal ID handling (assuming it exists or should be added)
// const ensureGoalId = (goalId: string | Id<"goals"> | undefined): Id<"goals"> | undefined => {
//   if (goalId === undefined) return undefined;
//   if (typeof goalId === "string") return goalId as Id<"goals">;
//   return goalId;
// };

export function useTaskManagement() {
  const { user } = useUser(); // Get user
  const userId = user?.id; // Get userId
  const [showConfetti, setShowConfetti] = useState(false);
  const { toast } = useToast(); // Get toast function
  
  // Define quadrant names locally for toast messages
  const quadrantNames = useMemo<Record<QuadrantKeys, string>>(() => ({
    q1: 'Urgent & Important',
    q2: 'Important, Not Urgent',
    q3: 'Urgent, Not Important',
    q4: 'Neither Urgent nor Important'
  }), []);

  // Convex queries and mutations
  const rawConvexTasks = useQuery(
    api.tasks.getTasks,
    userId ? undefined : "skip" // Skip if logged out
  );
  const addTaskMutation = useMutation(api.tasks.addTask);
  const updateTaskMutation = useMutation(api.tasks.updateTask);
  const deleteTaskMutation = useMutation(api.tasks.deleteTask);
  const reorderTasksMutation = useMutation(api.tasks.reorderTasks);

  // Memoize convex tasks to prevent unnecessary re-renders
  const convexTasks = useMemo(() => rawConvexTasks || [], [rawConvexTasks]);

  // Convert Convex tasks to UI tasks with simple compatibility mapping
  const tasks = useMemo(() => 
    convexTasks
      .map((task) => ensureTaskCompatibility(task))
      .sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity)), // Sort by order ascending
    [convexTasks]
  );

  /**
   * Add a new task to the database
   * @param taskData The data for the new task
   * @returns Object with success status, the new task's ID, and error information if applicable
   */
  const addTask = useCallback(async (taskData: NewTask): Promise<{ success: boolean; taskId?: Id<"tasks">; error?: string }> => {
    if (!userId) {
      console.error("Cannot add task: User not logged in");
      toast({
        title: "Error",
        description: "You must be logged in to add tasks.",
        variant: "destructive",
      });
      return { success: false, error: "User not logged in" };
    }

    try {
      let mutationTaskType: TaskType | undefined = 'personal'; // Default to 'personal'

      if (taskData.taskType) { // If taskType is provided
        if (taskData.taskType !== 'idea') {
          // If it's not 'idea', it must be a TaskType. TypeScript should narrow taskData.taskType to TaskType here.
          mutationTaskType = taskData.taskType;
        }
        // If taskData.taskType was 'idea', mutationTaskType remains 'personal' (the default from initialization).
      }
      // If taskData.taskType was undefined, mutationTaskType also remains 'personal'.

      const fullTaskData = {
        text: taskData.text,
        quadrant: taskData.quadrant,
        status: taskData.status || "active",
        taskType: mutationTaskType, // This is now TaskType | undefined ('personal' is TaskType)
        createdAt: taskData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        description: taskData.description, 
        goalId: ensureGoalId(taskData.goalId), // Use helper to ensure correct type
        dueDate: taskData.dueDate, // Pass dueDate
        order: taskData.order, // Pass order
      };
      
      console.log("[DEBUG] Calling addTaskMutation with data (taskType sanitized, optional fields explicitly passed):");
      const newTaskId = await addTaskMutation(fullTaskData);
      console.log("[DEBUG] addTaskMutation successful, new task ID:", newTaskId);

      return { success: true, taskId: newTaskId };
    } catch (error) {
      console.error("Error adding task:", error);
      toast({
        title: "Failed to add task",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to add task",
      };
    }
  }, [addTaskMutation, toast, userId]);

  /**
   * Add a new task with AI-powered analysis for quadrant and type suggestion
   * @param taskText The text of the task
   * @param goalId Optional ID of the goal this task is associated with
   * @param dueDate Optional due date for the task
   * @returns Promise resolving to an object with success status, taskId, error, and message
   */
  const addTaskWithAIAnalysis = useCallback(async (
    taskText: string,
    goalId?: Id<"goals">, // Ensure goalId is typed correctly
    dueDate?: string,
  ): Promise<{ success: boolean; taskId?: Id<"tasks">; error?: string; message?: string }> => {
    if (!userId) {
      console.error("Cannot add task with AI: User not logged in");
      toast({
        title: "Error",
        description: "You must be logged in to add tasks.",
        variant: "destructive",
      });
      return { success: false, error: "User not logged in" };
    }

    console.log(`[DEBUG] addTaskWithAIAnalysis called with text: "${taskText}", goalId: ${goalId}, dueDate: ${dueDate}`);

    let taskId: Id<"tasks"> | undefined = undefined; // Variable to store the task ID

    try {
      // Step 1: Create the task first (without quadrant, let AI decide or use default)
      // The backend will now handle intelligent sorting, so quadrant isn't strictly needed here for initial creation if AI will suggest.
      // However, to ensure the task is queryable by quadrant immediately if AI fails, let's default to Q4 or make it explicit.
      console.log("[DEBUG] Creating task with default values before AI analysis...");
      taskId = await addTaskMutation({
        text: taskText,
        status: "active",
        taskType: "personal", // Default, AI can override
        quadrant: "q4", // Default to Q4, backend sorting will adjust if needed or AI suggests differently
        goalId: ensureGoalId(goalId), // Use helper to ensure correct type
        dueDate: dueDate, // Pass dueDate
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      if (!taskId) {
        dispatchThinkingState(false, undefined, undefined);
        console.error("[DEBUG] Task creation failed before AI analysis.");
        toast({ title: "Error", description: "Failed to create task (pre-AI).", variant: "destructive" });
        return { success: false, error: "Task creation failed before AI analysis." };
      }
      console.log(`[DEBUG] Task created with ID: ${taskId}. Proceeding with AI analysis.`);
      
      // Start AI thinking state now that we have the task ID
      dispatchThinkingState(true, "Analyzing task...", taskId);

      // Step 2: Perform AI analysis by calling the Next.js API route
      let aiCategorizationResponse;
      try {
        const apiResponse = await fetch('/api/categorize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ task: taskText }),
        });

        if (!apiResponse.ok) {
          const errorData = await apiResponse.json();
          throw new Error(errorData.error || `API request failed with status ${apiResponse.status}`);
        }
        aiCategorizationResponse = await apiResponse.json();
      } catch (e) {
        console.error("[DEBUG] AI categorization API call failed:", e);
        dispatchThinkingState(false, undefined, undefined);
        toast({ title: "AI Error", description: e instanceof Error ? e.message : "Failed to categorize task with AI.", variant: "destructive" });
        // Task was created, but AI failed. Return success false but with taskId so UI can still potentially handle the task.
        return { success: false, taskId, error: e instanceof Error ? e.message : "AI categorization failed" };
      }

      const aiResponse = {
        suggestedQuadrant: aiCategorizationResponse.category as QuadrantKeys,
        suggestedTaskType: determineTaskType(taskText), // Determine task type from text
        reasoning: aiCategorizationResponse.reasoning || "Categorized by AI.",
      };

      // Step 3: Update the task with AI suggestions
      console.log(`[DEBUG] AI analysis complete for task ${taskId}. Response:`, aiResponse);
      await updateTaskMutation({
        id: taskId,
        quadrant: aiResponse.suggestedQuadrant,
        taskType: aiResponse.suggestedTaskType,
        aiReasoning: aiResponse.reasoning,
        updatedAt: new Date().toISOString(),
      });
      console.log(`[DEBUG] Task ${taskId} updated with AI suggestions.`);

      dispatchThinkingState(false, undefined, undefined);
      dispatchAIEvent('aiAnalysisComplete', {
        taskId: taskId.toString(),
        message: "AI analysis complete.",
        result: { category: aiResponse.suggestedQuadrant }, // Pass what we have
        targetQuadrant: aiResponse.suggestedQuadrant,
        taskType: undefined, // Not provided by this AI
        reasoning: aiResponse.reasoning, // Generic reasoning
      });
      toast({ title: "Task Added", description: "Task successfully added and analyzed by AI." });
      return { success: true, taskId, message: "Task added and analyzed by AI." };

    } catch (error) { // This outer catch handles errors from addTaskMutation or updateTaskMutation primarily
      dispatchThinkingState(false, undefined, undefined);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred during AI task processing.";
      console.error("[DEBUG] Error in addTaskWithAIAnalysis:", error);
      dispatchAIEvent('aiAnalysisError', { error: "AI_PROCESSING_ERROR", message: errorMessage });
      toast({ title: "AI Error", description: errorMessage, variant: "destructive" });
      // If task was created but AI failed, it still exists. Client might want to know the ID.
      return { success: false, taskId, error: errorMessage }; 
    }
  }, [addTaskMutation, updateTaskMutation, toast, quadrantNames, userId]);

  /**
   * Update an existing task in the database
   * @param id The ID of the task to update
   * @param updates The fields to update on the task
   * @returns Object with success status and error information if applicable
   */
  const updateTask = useCallback(async (taskId: Id<"tasks">, updates: {
    text?: string;
    quadrant?: QuadrantKeys;
    taskType?: TaskType;
    status?: TaskStatus;
    description?: string;
    goalId?: Id<"goals"> | undefined; // Explicitly include optional goalId
    dueDate?: string | null; // Add dueDate here
  }): Promise<{ success: boolean, error?: string }> => {
    console.log(`[DEBUG] updateTask hook called for ${taskId} with updates:`, updates);
    try {
      // Ensure dueDate is undefined if null
      const finalUpdates = {
        ...updates,
        dueDate: updates.dueDate === null ? undefined : updates.dueDate,
      };
      await updateTaskMutation({ id: taskId, ...finalUpdates }); // <-- Use finalUpdates
      console.log(`[DEBUG] Task ${taskId} updated successfully via hook.`);
      // Optionally trigger a manual refresh or rely on Convex reactivity
      // refreshTasks(); // Consider if needed
      return { success: true };
    } catch (error) {
      console.error(`Error updating task ${taskId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update task"
      };
    }
  }, [updateTaskMutation]);

  /**
   * Delete a task from the database
   * @param id The ID of the task to delete
   * @returns Object with success status and error information if applicable
   */
  const deleteTask = useCallback(async (id: string) => {
    if (!id) {
      console.error("Cannot delete task: Invalid task ID");
      return { success: false, error: "Invalid task ID" };
    }

    try {
      const result = await deleteTaskMutation({
        id: toConvexId(id),
      });

      // Clean up any stored reasoning logs for this task
      // ReasoningLogService.deleteLog(id);

      return {
        success: true,
        taskId: id,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error deleting task ${id}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete task",
        taskId: id
      };
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
  const reorderTasks = useCallback(async (quadrant: QuadrantKeys, sourceIndex: number, destinationIndex: number) => {
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
    updateTask, // Return the updated updateTask function
    deleteTask,
    toggleTask,
    reorderTasks,
    showConfetti,
    hideConfetti
  };
}
