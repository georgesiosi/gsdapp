import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUser } from "./auth";

/**
 * Test function to verify Convex connection and authentication.
 * 
 * IMPORTANT: This is for development and testing purposes only.
 * Consider removing or disabling this function in production.
 */
export const testConnection = mutation({
  handler: async (ctx) => {
    try {
      // Get authenticated user
      const userId = await getAuthenticatedUser(ctx);
      
      // Create a test task to verify database write
      const now = new Date().toISOString();
      const testTaskId = await ctx.db.insert("tasks", {
        text: "Convex Test Task - " + now,
        quadrant: "q4",
        taskType: "personal",
        status: "active",
        userId,
        needsReflection: false,  // Add explicit value for consistency
        order: 9999, // High order to appear at the bottom
        createdAt: now,
        updatedAt: now
      });
      
      // Get all user tasks to verify database read
      const userTasks = await ctx.db
        .query("tasks")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();
      
      return {
        success: true,
        message: "Convex connection test successful",
        userId,
        testTaskId: testTaskId.toString(),
        taskCount: userTasks.length
      };
    } catch (error) {
      console.error("Convex test error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString() // Add timestamp for debugging
      };
    }
  },
});

/**
 * Get all tasks for the current authenticated user
 */
export const getTasks = query({
  handler: async (ctx) => {
    const userId = await getAuthenticatedUser(ctx);
    return await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

/**
 * Add a new task to the database
 */
export const addTask = mutation({
  args: {
    text: v.string(),
    quadrant: v.union(v.literal("q1"), v.literal("q2"), v.literal("q3"), v.literal("q4")),
    taskType: v.optional(v.union(v.literal("personal"), v.literal("work"), v.literal("business"), v.literal("idea"))),
    needsReflection: v.optional(v.boolean()),
    status: v.optional(v.union(v.literal("active"), v.literal("completed"))),
    description: v.optional(v.string()),
    order: v.optional(v.float64()),
    createdAt: v.string(),
    updatedAt: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUser(ctx);

    // Calculate the next order value for this quadrant
    const nextOrder = await getNextOrderValue(ctx, userId, args.quadrant);
    
    // Initialize dates - use the provided dates or generate new ones
    const now = new Date().toISOString();
    const createdAt = args.createdAt || now;
    const updatedAt = args.updatedAt || now;
    
    return await ctx.db.insert("tasks", {
      text: args.text,
      quadrant: args.quadrant,
      taskType: args.taskType ?? "personal",
      status: args.status ?? "active",
      description: args.description,
      userId,
      order: args.order ?? nextOrder,
      createdAt,
      updatedAt,
      needsReflection: args.needsReflection ?? false
    });
  },
});

/**
 * Update an existing task in the database
 */
export const updateTask = mutation({
  args: {
    id: v.id("tasks"),
    text: v.optional(v.string()),
    quadrant: v.optional(v.union(v.literal("q1"), v.literal("q2"), v.literal("q3"), v.literal("q4"))),
    taskType: v.optional(v.union(v.literal("personal"), v.literal("work"), v.literal("business"), v.literal("idea"))),
    needsReflection: v.optional(v.boolean()),
    status: v.optional(v.union(v.literal("active"), v.literal("completed"))),
    description: v.optional(v.string()),
    reflection: v.optional(
      v.object({
        justification: v.string(),
        aiAnalysis: v.optional(v.string()),
        suggestedQuadrant: v.optional(v.string()),
        finalQuadrant: v.string(),
        feedback: v.optional(v.string()),
        content: v.optional(v.string()),
        reflectedAt: v.string(),
      })
    ),
    completedAt: v.optional(v.string()),
    order: v.optional(v.number()),
    createdAt: v.optional(v.string()),
    updatedAt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUser(ctx);
    const task = await ctx.db.get(args.id);

    // Check if task exists and belongs to user
    if (!task) {
      throw new Error("Task not found");
    }
    
    if (task.userId !== userId) {
      throw new Error("Not authorized to update this task");
    }

    // Create update object with only provided fields
    const { id, createdAt, ...updates } = args;
    const now = new Date().toISOString();
    
    // Apply updates but preserve certain values that shouldn't be changed
    const updatedTask = await ctx.db.patch(args.id, {
      ...updates,
      updatedAt: now,
      // Don't allow changing userId or createdAt
      userId: task.userId,
      createdAt: task.createdAt
    });
    
    return updatedTask;
  },
});

/**
 * Delete a task from the database
 * 
 * @throws Error if task is not found or user is not authorized
 * @returns Object with success status and deleted task ID
 */
export const deleteTask = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUser(ctx);
    const task = await ctx.db.get(args.id);

    // Check if task exists
    if (!task) {
      throw new Error(`Task not found with ID: ${args.id}`);
    }
    
    // Check if user is authorized to delete this task
    if (task.userId !== userId) {
      throw new Error(`Not authorized to delete task with ID: ${args.id}`);
    }

    // Keep a reference to identify what was deleted in the response
    const deletedTaskId = args.id;
    const deletedTaskText = task.text;
    
    // Delete the task
    await ctx.db.delete(args.id);
    
    return { 
      success: true,
      id: deletedTaskId.toString(),
      timestamp: new Date().toISOString(),
      taskText: deletedTaskText
    };
  },
});

/**
 * Reorder tasks within a quadrant
 */
/**
 * Helper function to get the next order value for a task in a quadrant
 */
async function getNextOrderValue(ctx: any, userId: string, quadrant: string): Promise<number> {
  const existingTasks = await ctx.db
    .query("tasks")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .filter((q: any) => q.eq(q.field("quadrant"), quadrant))
    .collect();

  return existingTasks.length > 0
    ? Math.max(...existingTasks.map((t: any) => t.order ?? 0)) + 1
    : 0;
}

/**
 * Reorder tasks within a quadrant by moving a task from a source index to a destination index
 * and updating the order values of all affected tasks.
 * 
 * This is an optimized implementation that only updates tasks whose order has changed,
 * rather than updating all tasks in the quadrant.
 */
export const reorderTasks = mutation({
  args: {
    quadrant: v.union(v.literal("q1"), v.literal("q2"), v.literal("q3"), v.literal("q4")),
    sourceIndex: v.number(),
    destinationIndex: v.number(),
  },
  handler: async (ctx, args) => {
    // Validate indices early
    if (args.sourceIndex < 0 || args.destinationIndex < 0) {
      throw new Error(`Invalid indices: source (${args.sourceIndex}) and destination (${args.destinationIndex}) must be non-negative`);
    }
    
    // No work needed if source and destination are the same
    if (args.sourceIndex === args.destinationIndex) {
      return { success: true, message: "Source and destination are the same, no reordering needed" };
    }
    
    const userId = await getAuthenticatedUser(ctx);

    // Get all tasks in the quadrant
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .filter((q: any) => q.eq(q.field("quadrant"), args.quadrant))
      .collect();

    // Sort by current order
    const sortedTasks = tasks.sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));

    // Validate indices against actual array length
    if (args.sourceIndex >= sortedTasks.length || args.destinationIndex >= sortedTasks.length) {
      throw new Error(
        `Invalid indices: source (${args.sourceIndex}) and destination (${args.destinationIndex}) ` +
        `must be less than the number of tasks (${sortedTasks.length})`
      );
    }

    // Remove task from source position
    const [movedTask] = sortedTasks.splice(args.sourceIndex, 1);
    // Insert task at destination position
    sortedTasks.splice(args.destinationIndex, 0, movedTask);

    // Get current timestamp once for all updates
    const now = new Date().toISOString();
    
    // Only update tasks whose order has changed
    const updatedTaskIds = [];
    const minIndex = Math.min(args.sourceIndex, args.destinationIndex);
    const maxIndex = Math.max(args.sourceIndex, args.destinationIndex);
    
    // Only update tasks in the affected range (between min and max indices)
    for (let i = minIndex; i <= maxIndex; i++) {
      await ctx.db.patch(sortedTasks[i]._id, {
        order: i,
        updatedAt: now
      });
      updatedTaskIds.push(sortedTasks[i]._id.toString());
    }

    return { 
      success: true,
      message: `Successfully reordered tasks from index ${args.sourceIndex} to ${args.destinationIndex}`,
      updatedTaskCount: updatedTaskIds.length
    };
  },
});
