/**
 * Task Management Hook
 * 
 * Provides functionality for managing tasks with Convex backend integration
 * and AI-powered task analysis capabilities.
 */
import { useState, useCallback, useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Task, QuadrantType, TaskStatus, TaskType, ConvexTask } from "@/types/task";
import { ReasoningLogService } from "@/services/ai/reasoningLogService";

// Define event types and interfaces for AI functionality
type AIEventDetail = {
  aiThinkingChanged: { thinking: boolean; message?: string };
  aiAnalysisComplete: { 
    message: string;
    result?: any;
    targetQuadrant?: string;
    taskType?: string;
    reasoning?: string;
  };
  aiAnalysisError: { error: string; message: string };
};

type AIEventType = keyof AIEventDetail;

// Helper function to dispatch events
const dispatchAIEvent = <T extends AIEventType>(eventType: T, detail: AIEventDetail[T]) => {
  console.log(`[DEBUG] Dispatching ${eventType} event with detail:`, detail);
  const event = new CustomEvent(eventType, { detail });
  window.dispatchEvent(event);
};

// Helper function to dispatch AI thinking state
const dispatchThinkingState = (thinking: boolean, message?: string) => {
  dispatchAIEvent('aiThinkingChanged', { thinking, message });
};

export type NewTask = {
  text: string;
  quadrant: QuadrantType;
  taskType?: TaskType;
  needsReflection?: boolean;
  status?: TaskStatus;
  description?: string;
};

/**
 * Converts a Convex task to the UI Task format.
 * Handles legacy tasks by deriving timestamps when needed.
 */
const adaptConvexTask = (convexTask: ConvexTask): Task => {
  // Convert _creationTime to ISO string if createdAt/updatedAt not present (legacy tasks)
  const creationDate = new Date(convexTask._creationTime / 1000).toISOString();
  
  return {
    id: convexTask._id.toString(),
    text: convexTask.text || '', // Ensure text is never undefined
    description: convexTask.description,
    quadrant: convexTask.quadrant,
    taskType: convexTask.taskType,
    status: convexTask.status,
    needsReflection: Boolean(convexTask.needsReflection), // Ensure boolean type
    reflection: convexTask.reflection,
    completedAt: convexTask.completedAt,
    order: convexTask.order ?? 0, // Provide default order if undefined
    userId: convexTask.userId,
    _creationTime: convexTask._creationTime,
    createdAt: convexTask.createdAt || creationDate,
    updatedAt: convexTask.updatedAt || creationDate
  };
};

/**
 * Converts a string ID to a Convex ID type.
 * @param id The string ID to convert
 * @returns The converted Convex ID
 */
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

  /**
   * Add a new task to the database
   * @param newTask The task data to add
   * @returns The ID of the newly created task, or null if creation failed
   */
  const addTask = useCallback(async (newTask: NewTask): Promise<string | null> => {
    if (!newTask.text?.trim()) {
      console.warn("Cannot add task with empty text");
      return null;
    }

    try {
      const now = new Date().toISOString();
      const taskId = await addTaskMutation({
        // Required fields
        text: newTask.text.trim(),
        quadrant: newTask.quadrant,
        
        // Optional fields with defaults
        taskType: newTask.taskType ?? 'personal',
        needsReflection: newTask.needsReflection ?? false,
        status: newTask.status ?? 'active',
        description: newTask.description?.trim(),
        
        // Timestamps
        createdAt: now,
        updatedAt: now
      });

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

      // Return immediately to show the task in Q4 and start AI analysis
      const analyzeTask = async (retryCount = 0, maxRetries = 3) => {
        // Calculate exponential backoff delay
        const backoffDelay = retryCount > 0 ? Math.min(1000 * Math.pow(2, retryCount - 1), 10000) : 0;
        
        if (retryCount > 0) {
          // Wait for backoff delay before retrying
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
          
          dispatchThinkingState(true, `Retrying AI analysis (attempt ${retryCount + 1} of ${maxRetries + 1})...`);
        }
        // Don't retry more than maxRetries times
        if (retryCount >= maxRetries) {
          dispatchAIEvent('aiAnalysisError', { 
            error: 'Max retries exceeded',
            message: `Failed to analyze task after ${maxRetries + 1} attempts. The task will remain in Q4. Please try again later or check your settings.` 
          });
          return;
        }
        
        // Track start time for this attempt
        const startTime = Date.now();
        // Get OpenAI API key and sync preference from localStorage
        const openAIKey = localStorage.getItem('openai-api-key');
        const userPrefs = localStorage.getItem('user-preferences');
        let syncApiKey = false;
        
        try {
          if (userPrefs) {
            const prefs = JSON.parse(userPrefs);
            syncApiKey = prefs.syncApiKey || false;
          }
        } catch (e) {
          console.warn("Failed to parse user preferences:", e);
        }
        
        if (!openAIKey) {
          dispatchAIEvent('aiAnalysisError', { 
            error: 'No OpenAI API key found',
            message: `Task added to Q4. AI analysis skipped: No OpenAI API key found. ${syncApiKey ? 'Please set up your API key in Settings.' : 'Add your API key in Settings to enable AI analysis.'}`
          });
          return;
        }
        
        // Validate API key format
        if (!openAIKey.startsWith('sk-')) {
          dispatchAIEvent('aiAnalysisError', { 
            error: 'Invalid API key format',
            message: 'Task added to Q4. AI analysis skipped: Invalid API key format. API keys should start with "sk-".' 
          });
          return;
        }

        // Notify that AI is starting analysis
        dispatchAIEvent('aiThinkingChanged', { 
          thinking: true,
          message: 'Analyzing task with AI...' 
        });

        try {
          // Get user preferences for analysis
          const userPrefs = localStorage.getItem('user-preferences');
          let goal = "";
          let priority = "";
          let personalContext = "";
          
          if (userPrefs) {
            try {
              const prefs = JSON.parse(userPrefs);
              goal = prefs.goal || "";
              priority = prefs.priority || "";
              
              // Build a comprehensive personal context
              const contexts = [];
              if (goal) contexts.push(`Working towards: ${goal}`);
              if (priority) contexts.push(`Current priority: ${priority}`);
              if (prefs.taskSettings?.focusAreas) {
                contexts.push(`Focus areas: ${prefs.taskSettings.focusAreas.join(', ')}`);
              }
              personalContext = contexts.join('. ');
            } catch (e) {
              console.warn("Failed to parse user preferences:", e);
              dispatchAIEvent('aiAnalysisError', { 
                error: e instanceof Error ? e.message : 'Failed to parse preferences',
                message: 'Warning: Could not load user preferences. AI analysis may be less accurate.' 
              });
            }
          }

          // Set up timeout for fetch request
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout
          
          let response: Response;
          try {
            response = await fetch("/api/analyze-reflection", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-openai-key": openAIKey,
              },
              signal: controller.signal,
              body: JSON.stringify({
              task: taskData.text,
              justification: "",
              goal,
              priority,
              currentQuadrant: "q4", // Always start in Q4 during analysis
              personalContext: personalContext || undefined
            }),
          });
          
          // Handle rate limiting and retries
          if (response.status === 429) {
            const retryAfter = response.headers.get('retry-after') || '5';
            const waitTime = parseInt(retryAfter, 10) * 1000;
            
            dispatchAIEvent('aiAnalysisError', { 
              error: 'Rate limit exceeded',
              message: `Rate limit exceeded. Retrying in ${Math.ceil(waitTime/1000)} seconds...` 
            });
            
            await new Promise(resolve => setTimeout(resolve, waitTime));
            const elapsedTime = Date.now() - startTime;
            console.log(`AI analysis attempt ${retryCount + 1} failed after ${elapsedTime}ms. Retrying...`);
            return analyzeTask(retryCount + 1, maxRetries);
          }
          } catch (error: unknown) {
            // Handle network errors and timeouts
            const networkError = error as Error;
            const isTimeout = networkError instanceof Error && networkError.name === 'AbortError';
            const elapsedTime = Date.now() - startTime;
            
            console.error(
              `AI analysis network error after ${elapsedTime}ms:`,
              networkError,
              `Retry count: ${retryCount}`
            );
            
            dispatchAIEvent('aiAnalysisError', { 
              error: networkError instanceof Error ? networkError.message : 'Unknown error',
              message: isTimeout 
                ? 'AI analysis timed out. Please try again.'
                : 'Network error during AI analysis. Please check your connection.'
            });
            
            // Retry on network errors
            return analyzeTask(retryCount + 1, maxRetries);
          } finally {
            clearTimeout(timeout);
          }
          
          // Handle other errors
          if (!response.ok) {
            const errorText = await response.text();
            const error = `Failed to analyze task: ${response.status} ${response.statusText}\n${errorText}`;
            
            // Check if it's an authentication error
            if (response.status === 401 || response.status === 403) {
              dispatchAIEvent('aiAnalysisError', { 
                error,
                message: 'Authentication failed. Please check your API key in Settings.' 
              });
            } else {
              dispatchAIEvent('aiAnalysisError', { 
                error,
                message: 'Failed to analyze task. Using default values.' 
              });
            }
            
            throw new Error(error);
          }
          
          let result;
          try {
            result = await response.json();
          } catch (parseError) {
            const error = `Failed to parse API response: ${parseError instanceof Error ? parseError.message : 'Invalid JSON'}`;
            window.dispatchEvent(new CustomEvent('aiAnalysisError', { 
              detail: { 
                error,
                message: 'AI analysis failed due to invalid response. Using default values.' 
              } 
            }));
            throw new Error(error);
          }
          
          if (!result || typeof result !== 'object') {
            const error = 'API returned invalid response format';
            window.dispatchEvent(new CustomEvent('aiAnalysisError', { 
              detail: { 
                error,
                message: 'AI analysis failed due to invalid response format. Using default values.' 
              } 
            }));
            throw new Error(error);
          }
          
          if (result.error) {
            const error = `API returned error: ${result.error}`;
            window.dispatchEvent(new CustomEvent('aiAnalysisError', { 
              detail: { 
                error,
                message: 'AI analysis failed. Using default values.' 
              } 
            }));
            throw new Error(error);
          }

          // Notify that AI has completed analysis
          dispatchAIEvent('aiAnalysisComplete', { 
            message: 'AI analysis complete',
            result,
            targetQuadrant: result.suggestedQuadrant,
            taskType: result.taskType,
            reasoning: result.reasoning
          });

          // Update task with AI analysis results
          const targetQuadrant = result.suggestedQuadrant || "q4";
          const taskType = result.taskType || taskData.taskType || "personal";
          
          const now = new Date().toISOString();
          try {
            await updateTaskMutation({
              id: toConvexId(taskId),
              quadrant: targetQuadrant,
              taskType: taskType,
              updatedAt: now,
              reflection: result.reasoning ? {
                justification: result.reasoning,
                aiAnalysis: JSON.stringify(result),
                suggestedQuadrant: targetQuadrant,
                finalQuadrant: targetQuadrant,
                reflectedAt: now,
              } : undefined,
            });
            
            // Store reasoning data in the ReasoningLogService for the task card display
            console.log('[DEBUG] Storing AI reasoning log for task:', taskId);
            if (result.reasoning) {
              ReasoningLogService.storeLog({
                taskId: taskId,
                taskText: taskData.text,
                timestamp: Date.now(),
                suggestedQuadrant: targetQuadrant,
                taskType: taskType,
                reasoning: result.reasoning,
                alignmentScore: result.alignmentScore,
                urgencyScore: result.urgencyScore,
                importanceScore: result.importanceScore
              });
            }

            // Notify of successful update
            window.dispatchEvent(new CustomEvent('aiAnalysisComplete', { 
              detail: { 
                message: `Task analyzed and moved to ${targetQuadrant.toUpperCase()} as ${taskType} task`,
                result,
                targetQuadrant,
                taskType,
                reasoning: result.reasoning?.split('.')[0] || 'Based on AI analysis'
              } 
            }));
          } catch (updateError) {
            // Handle task update errors
            const error = `Failed to update task with AI analysis: ${updateError instanceof Error ? updateError.message : 'Unknown error'}`;
            console.error('Task update error:', updateError);
            
            dispatchAIEvent('aiAnalysisError', { 
              error,
              message: 'Failed to update task with AI analysis results. Please try again.' 
            });
            
            throw new Error(error);
          }
          
          // Notify that analysis is complete
          dispatchAIEvent('aiAnalysisComplete', { 
            message: `Task analyzed and moved to ${targetQuadrant.toUpperCase()} as ${taskType} task`,
            result,
            targetQuadrant,
            taskType,
            reasoning: result.reasoning?.split('.')[0] || 'Based on AI analysis'
          });
        } catch (analysisError) {
          console.error("Error analyzing task:", analysisError);
          dispatchAIEvent('aiAnalysisError', { 
            error: analysisError instanceof Error ? analysisError.message : 'Unknown error',
            message: 'AI analysis failed. Task will remain in Q4. Please check your API key and try again.' 
          });
        } finally {
          // Always notify that AI has finished thinking
          dispatchThinkingState(false, 'AI analysis complete');
        }
      };

      // Start AI analysis in the background
      analyzeTask();

      return { task, isAnalyzing: true };
    } catch (error) {
      console.error("Error in addTaskWithAIAnalysis:", error);
      return { task: null, isAnalyzing: false };
    }
  }, [addTask, updateTaskMutation]);

  /**
   * Update an existing task in the database
   * @param id The ID of the task to update
   * @param updates The fields to update on the task
   * @returns Object with success status and error information if applicable
   */
  const updateTask = useCallback(async (id: string, updates: Partial<Omit<Task, "id" | "_creationTime" | "userId">>) => {
    if (!id) {
      console.error("Cannot update task: Invalid task ID");
      return { success: false, error: "Invalid task ID" };
    }
    
    try {
      // Create a clean updates object with only the defined values
      const cleanUpdates: Record<string, any> = {};
      
      // Only include defined values and ensure text is trimmed if present
      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined) {
          if (key === 'text' && typeof value === 'string') {
            cleanUpdates[key] = value.trim();
          } else if (key === 'description' && typeof value === 'string') {
            cleanUpdates[key] = value.trim();
          } else {
            cleanUpdates[key] = value;
          }
        }
      });

      // Add updated timestamp if not explicitly set
      if (!cleanUpdates.updatedAt) {
        cleanUpdates.updatedAt = new Date().toISOString();
      }
      
      // Update the task
      await updateTaskMutation({
        id: toConvexId(id),
        ...cleanUpdates,
      });
      
      return { success: true };
    } catch (error) {
      console.error(`Error updating task ${id}:`, error);
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
      ReasoningLogService.deleteLog(id);
      
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
