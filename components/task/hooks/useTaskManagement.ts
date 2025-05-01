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
import type { Task, TaskStatus, QuadrantKeys, TaskType, ConvexTask, TaskOrIdeaType, TaskReflection } from "@/types/task"; 
import { useToast } from "@/components/ui/use-toast"; 

// --- Start: Local Definitions ---

// Locally defined NewTask type based on usage
export type NewTask = {
  text: string;
  quadrant: QuadrantKeys;
  taskType?: TaskType;
  needsReflection?: boolean;
  status?: TaskStatus;
  description?: string;
  goalId?: Id<"goals">; // Add goalId
  createdAt?: string;
  updatedAt?: string;
};

// Locally defined function to adapt ConvexTask to Task
const adaptConvexTask = (convexTask: ConvexTask): Task => {
  return {
    ...convexTask,
    id: convexTask._id, // Keep as Id<"tasks">
    goalId: convexTask.goalId, // Keep as Id<"goals"> | undefined
    // Ensure quadrant, taskType, status are correctly typed if needed
    quadrant: convexTask.quadrant as QuadrantKeys,
    taskType: convexTask.taskType as TaskOrIdeaType, // Use TaskOrIdeaType if applicable
    status: convexTask.status as TaskStatus,
  };
};

// Locally defined event types and interfaces for AI functionality
type AIEventDetail = {
  aiThinkingChanged: { thinking: boolean; message?: string };
  aiAnalysisComplete: {
    taskId: string; // Added taskId
    message: string;
    result?: any; // Keep flexible for now
    targetQuadrant?: QuadrantKeys; // Use QuadrantKeys
    taskType?: TaskOrIdeaType; // Use TaskOrIdeaType
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
const dispatchThinkingState = (thinking: boolean, message?: string) => {
  dispatchAIEvent('aiThinkingChanged', { thinking, message });
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

  // Convert Convex tasks to UI tasks using local adapter
  const tasks = useMemo(() => 
    convexTasks.map((task) => adaptConvexTask(task as ConvexTask)), // Use local adaptConvexTask
    [convexTasks]
  );

  /**
   * Add a new task to the database
   * @param newTask The task data to add
   * @returns The ID of the newly created task, or null if creation failed
   */
  const addTask = useCallback(async (newTask: NewTask): Promise<string | null> => {
    // Destructure goalId from newTask
    const { goalId, ...restOfTask } = newTask;

    if (!newTask.text?.trim()) {
      console.warn("Cannot add task with empty text");
      return null;
    }

    try {
      // Include goalId in the mutation call if it exists
      const taskId = await addTaskMutation({ 
        ...restOfTask,
        ...(goalId && { goalId: ensureGoalId(goalId) }), // Conditionally add goalId
        status: newTask.status || 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      return taskId.toString();
    } catch (error) {
      console.error("Error adding task:", error);
      return null;
    }
  }, [addTaskMutation]);

  // Add a new task with AI analysis
  const addTaskWithAIAnalysis = useCallback(async (
    text: string, 
    initialQuadrant: QuadrantKeys = 'q4', // Default to Q4 if not provided
    goalId?: Id<"goals">, // Optional goal ID parameter
    dueDate?: string // Optional due date parameter
  ): Promise<{ task: Task | null, isAnalyzing: boolean }> => {
    
    // Avoid using .trim() directly on text
    console.log("[DEBUG] addTaskWithAIAnalysis called with text:", text, "typeof text:", typeof text);
    
    // Check if text is empty without using .trim()
    const isEmpty = !text || text === "" || (typeof text === 'string' && text.replace(/\s/g, '') === "");
    if (isEmpty) {
      toast({ title: "Error", description: "Task text cannot be empty.", variant: "destructive" });
      return { task: null, isAnalyzing: false };
    }

    if (!userId) {
      toast({ title: "Error", description: "You must be logged in to add tasks.", variant: "destructive" });
      return { task: null, isAnalyzing: false };
    }
    // if (!text?.trim()) { <-- Moved check up
    //   toast({ title: "Error", description: "Task text cannot be empty.", variant: "destructive" });
    //   return { task: null, isAnalyzing: false };
    // }

    let taskId: Id<"tasks"> | null = null;
    let newTask: Task | null = null;
    let isAnalyzing = false; // Initialize isAnalyzing

    try {
      const now = new Date().toISOString();
      const safeText = typeof text === 'string' ? text : String(text); // Convert to string safely
      
      console.log("[DEBUG] Calling addTaskMutation with text:", safeText); // <-- Add log 2
      
      // Create the task with basic properties
      const taskData = {
        text: safeText,
        quadrant: 'q4' as const, // Explicitly type as 'q4'
        status: 'active' as const, // Explicitly type as 'active'
        needsReflection: true, // Mark for AI analysis
        createdAt: now,
        updatedAt: now,
        ...(goalId ? { goalId } : {}), // Include goalId if provided
        ...(dueDate ? { dueDate } : {}) // Include dueDate if provided
      };
      
      console.log("[DEBUG] Creating task with data:", taskData, "goalId provided:", !!goalId);
      taskId = await addTaskMutation(taskData);

      if (!taskId) {
        throw new Error("Failed to create task ID.");
      }
      
      console.log("[DEBUG] Task created with ID:", taskId); // <-- Add log 3

      // Retrieve the newly created task data if needed immediately
      // This might be inefficient if adaptConvexTask isn't readily available or needed here
      // const createdConvexTask = await getTaskById(taskId); // Hypothetical query needed
      // if (createdConvexTask) {
      //   newTask = adaptConvexTask(createdConvexTask); 
      // } else {
      //   console.warn("Could not retrieve newly created task immediately.");
      //   // Fallback or handle as needed
      // }

      // --- Start AI Analysis ---
      isAnalyzing = true; 
      
      console.log("[DEBUG] Dispatching aiThinkingChanged(true)"); // <-- Add log 4
      dispatchThinkingState(true, "AI analyzing task placement..."); // Dispatch thinking state
      toast({ title: "Analyzing Task", description: "AI analyzing task placement..." });

      console.log("[DEBUG] Calling /api/analyze-reflection"); // <-- Add log 5
      
      // Get OpenAI API key from localStorage
      const apiKey = localStorage.getItem('openai-api-key');
      console.log("[DEBUG] API Key available?", !!apiKey, apiKey ? apiKey.substring(0, 5) + '...' : 'none');
      
      // Prepare request body with all context
      const requestBody = { 
        task: typeof text === 'string' ? text : String(text), // Convert to string safely
        justification: "", // No user justification for initial analysis
        goal: localStorage.getItem('userGoal') || '',
        priority: localStorage.getItem('userPriority') || '',
        currentQuadrant: 'q4', // Default quadrant
        personalContext: localStorage.getItem('personalContext') || ''
      };
      console.log("[DEBUG] Request body:", requestBody);
      
      let analysis;
      try {
        const response = await fetch("/api/analyze-reflection", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "x-openai-key": apiKey || ''
          },
          body: JSON.stringify(requestBody),
        });
        
        // Check response status immediately
        console.log("[DEBUG] Response status:", response.status, response.statusText);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: "Unknown fetch error" }));
          console.log("[DEBUG] API Error details:", errorData);
          throw new Error(`API Error (${response.status}): ${errorData.message || response.statusText}`);
        }

        // Clone the response for debugging (since response.json() can only be called once)
        const responseClone = response.clone();
        const responseText = await responseClone.text();
        console.log("[DEBUG] Raw response text:", responseText);
        
        try {
          analysis = await response.json();
          console.log("[DEBUG] AI Analysis Result:", analysis);
          
          // Validate required fields
          if (!analysis) {
            console.error("[DEBUG] Analysis is null or undefined");
            throw new Error("Analysis response is empty");
          }
          
          console.log("[DEBUG] Analysis has suggestedQuadrant:", !!analysis.suggestedQuadrant, analysis.suggestedQuadrant);
          console.log("[DEBUG] Analysis has taskType:", !!analysis.taskType, analysis.taskType);
          console.log("[DEBUG] Analysis has reasoning:", !!analysis.reasoning, analysis.reasoning?.substring(0, 50));
          
          // If we don't have a suggestedQuadrant, use a default
          if (!analysis.suggestedQuadrant) {
            console.warn("[DEBUG] No suggestedQuadrant in response, using default q4");
            analysis.suggestedQuadrant = 'q4';
          }
          
          // If we don't have a taskType, use a default
          if (!analysis.taskType) {
            console.warn("[DEBUG] No taskType in response, using default 'personal'");
            analysis.taskType = 'personal';
          }
          
          // If we don't have reasoning, add a default
          if (!analysis.reasoning) {
            console.warn("[DEBUG] No reasoning in response, using default message");
            analysis.reasoning = "AI analysis completed without detailed reasoning.";
          }
          
        } catch (parseError) {
          console.error("[DEBUG] Error parsing JSON response:", parseError);
          console.error("[DEBUG] Response text that failed to parse:", responseText);
          
          // Try to recover by parsing the text directly
          try {
            analysis = JSON.parse(responseText);
            console.log("[DEBUG] Successfully parsed response text manually");
          } catch (secondError) {
            console.error("[DEBUG] Failed to parse response text manually:", secondError);
            // Create a fallback analysis object
            analysis = {
              suggestedQuadrant: 'q4',
              taskType: 'personal',
              reasoning: "Failed to parse AI response. Using default values."
            };
          }
        }
      } catch (error) {
        // Handle the error with proper type checking
        const fetchError = error as Error;
        console.error("[DEBUG] Fetch error:", fetchError);
        // Create a fallback analysis object
        analysis = {
          suggestedQuadrant: 'q4',
          taskType: 'personal',
          reasoning: `API request failed: ${fetchError.message || 'Unknown error'}`
        };
      }

      // --- Update Task --- 
      const updateTime = new Date().toISOString();
      const validatedQuadrant = analysis.suggestedQuadrant as QuadrantKeys; // Validate/cast quadrant
      const validatedTaskType = analysis.taskType as TaskOrIdeaType; // Validate/cast task type
      const reasoning = analysis.reasoning || "AI analysis provided no reasoning.";
      
      // Store the reasoning log for the TaskTypeIndicator and AIReasoningTooltip components
      if (taskId) {
        const reasoningLog = {
          taskId: taskId.toString(),
          taskText: safeText,
          timestamp: Date.now(),
          suggestedQuadrant: validatedQuadrant || 'q4',
          taskType: validatedTaskType as "personal" | "work" | "business",
          reasoning: reasoning,
          alignmentScore: analysis.alignmentScore,
          urgencyScore: analysis.urgencyScore,
          importanceScore: analysis.importanceScore
        };
        
        // Import the ReasoningLogService
        const { ReasoningLogService } = require("@/services/ai/reasoningLogService");
        
        // Store the reasoning log
        ReasoningLogService.storeLog(reasoningLog);
        console.log("[DEBUG] Stored reasoning log:", reasoningLog);
      }

      console.log("[DEBUG] Calling updateTaskMutation for task ID:", taskId); // <-- Add log 8
      await updateTaskMutation({
        id: taskId,
        quadrant: validatedQuadrant || 'q4', // Default to Q4 if analysis fails
        taskType: validatedTaskType, 
        needsReflection: false, // Analysis complete
        reflection: {
          justification: "Initial AI analysis.", // Or use reasoning?
          aiAnalysis: reasoning,
          suggestedQuadrant: validatedQuadrant,
          finalQuadrant: validatedQuadrant || 'q4', // Store final placement
          reflectedAt: updateTime,
          content: typeof text === 'string' ? text : String(text) // Add original task content to reflection
        },
        updatedAt: updateTime
      });
      
      console.log("[DEBUG] Task updated successfully."); // <-- Add log 9

      // Create a basic task object to return with all necessary properties
      if (taskId) {
        newTask = {
          id: taskId, // Keep as Id<"tasks">
          text: safeText,
          quadrant: validatedQuadrant || 'q4',
          status: 'active',
          needsReflection: false,
          userId: userId || '', // Ensure userId is handled (assuming it's part of ConvexTask or available)
          _creationTime: Date.now(), // Assuming _creationTime is part of ConvexTask
          createdAt: updateTime,
          updatedAt: updateTime,
          taskType: validatedTaskType, // Include the task type from AI analysis
          goalId: goalId, // Keep as Id<"goals"> | undefined
          reflection: {  // Include the reflection with AI reasoning
            justification: "Initial AI analysis.",
            aiAnalysis: reasoning,
            suggestedQuadrant: validatedQuadrant,
            finalQuadrant: validatedQuadrant || 'q4',
            reflectedAt: updateTime,
            content: safeText
          }
        };
      }

      toast({ title: "Analysis Complete", description: `Task placed in ${validatedQuadrant || 'Q4'}. Reasoning: ${reasoning}` });
      
      // Dispatch completion event (ensure taskId is string)
      if (taskId) {
        dispatchAIEvent('aiAnalysisComplete', { 
          taskId: taskId.toString(), 
          message: "AI analysis completed successfully.",
          targetQuadrant: validatedQuadrant,
          taskType: validatedTaskType,
          reasoning: reasoning
        });
      }

    } catch (error) {
      console.error("Error in addTaskWithAIAnalysis:", error); // <-- Add log 10
      toast({ title: "Error", description: `Failed to add or analyze task: ${error instanceof Error ? error.message : String(error)}`, variant: "destructive" });
      
      // If task was created but analysis failed, maybe update it to reflect the error?
      if (taskId) {
        try {
          const taskIdStr = taskId.toString();
          await updateTaskMutation({
            id: taskId,
            needsReflection: true, // Keep reflection needed
            reflection: {
              ...(tasks.find(t => t.id === taskIdStr)?.reflection || {}), // Preserve existing reflection if any
              justification: "AI analysis failed.",
              aiAnalysis: `Error: ${error instanceof Error ? error.message : String(error)}`,
              finalQuadrant: 'q4', // Revert to Q4
              reflectedAt: new Date().toISOString(),
            },
            updatedAt: new Date().toISOString()
          });
        } catch (updateError) {
          console.error("Error updating task after analysis failure:", updateError);
        }
      }
      
      // Dispatch error event (ensure taskId is string if available)
      dispatchAIEvent('aiAnalysisError', { 
        error: error instanceof Error ? error.message : String(error), 
        message: "An error occurred during AI analysis.",
        // taskId: taskId?.toString() // Conditionally add taskId
      });

      newTask = null; // Ensure null is returned on error
      isAnalyzing = false; // Reset analyzing state

    } finally {
      if (isAnalyzing) { // Only dispatch if analysis was started
          console.log("[DEBUG] Dispatching aiThinkingChanged(false) in finally block"); // <-- Add log 11
          dispatchThinkingState(false); // Ensure thinking state is always turned off
      }
    }
    
    console.log("[DEBUG] addTaskWithAIAnalysis returning:", { task: newTask, isAnalyzing }); // <-- Add log 12
    // The returned 'task' might be null if retrieved task data wasn't assigned back to newTask
    // The caller might need to rely on the main 'tasks' state being updated by the Convex query
    return { task: newTask, isAnalyzing }; 
  }, [userId, addTaskMutation, updateTaskMutation, toast, tasks]); // Dependencies remain the same for now

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
    needsReflection?: boolean;
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
