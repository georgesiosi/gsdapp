import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUser } from "./auth";

// Test function to verify Convex connection and authentication
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
        needsReflection: false,
        status: "active",
        userId,
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
        error: error instanceof Error ? error.message : String(error)
      };
    }
  },
});

// Get all tasks for the current user
export const getTasks = query({
  handler: async (ctx) => {
    const userId = await getAuthenticatedUser(ctx);
    return await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

// Add a new task
export const addTask = mutation({
  args: {
    text: v.string(),
    quadrant: v.string(),
    taskType: v.optional(v.string()),
    needsReflection: v.optional(v.boolean()),
    status: v.optional(v.string()),
    description: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUser(ctx);

    // Get the highest order in this quadrant
    const existingTasks = await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("quadrant"), args.quadrant))
      .collect();

    const maxOrder = existingTasks.length > 0
      ? Math.max(...existingTasks.map(t => t.order ?? 0))
      : -1;

    const now = new Date().toISOString();
    return await ctx.db.insert("tasks", {
      text: args.text,
      quadrant: args.quadrant,
      taskType: args.taskType ?? "personal",
      needsReflection: args.needsReflection ?? false,
      status: args.status ?? "active",
      description: args.description,
      userId,
      order: maxOrder + 1,
      createdAt: now,
      updatedAt: now
    });
  },
});

// Update a task
export const updateTask = mutation({
  args: {
    id: v.id("tasks"),
    text: v.optional(v.string()),
    quadrant: v.optional(v.string()),
    taskType: v.optional(v.string()),
    needsReflection: v.optional(v.boolean()),
    status: v.optional(v.string()),
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
    if (!task || task.userId !== userId) {
      throw new Error("Task not found or unauthorized");
    }

    // Create update object with only provided fields
    const { id, ...updates } = args;
    const now = new Date().toISOString();
    return await ctx.db.patch(args.id, {
      ...updates,
      updatedAt: now
    });
  },
});

// Delete a task
export const deleteTask = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUser(ctx);
    const task = await ctx.db.get(args.id);

    // Check if task exists and belongs to user
    if (!task || task.userId !== userId) {
      throw new Error("Task not found or unauthorized");
    }

    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// Reorder tasks within a quadrant
export const reorderTasks = mutation({
  args: {
    quadrant: v.string(),
    sourceIndex: v.number(),
    destinationIndex: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUser(ctx);

    // Get all tasks in the quadrant
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("quadrant"), args.quadrant))
      .collect();

    // Sort by current order
    const sortedTasks = tasks.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    if (
      args.sourceIndex < 0 ||
      args.sourceIndex >= sortedTasks.length ||
      args.destinationIndex < 0 ||
      args.destinationIndex >= sortedTasks.length
    ) {
      throw new Error("Invalid indices");
    }

    // Remove task from source position
    const [movedTask] = sortedTasks.splice(args.sourceIndex, 1);
    // Insert task at destination position
    sortedTasks.splice(args.destinationIndex, 0, movedTask);

    // Update order values for all tasks
    for (let i = 0; i < sortedTasks.length; i++) {
      const now = new Date().toISOString();
      await ctx.db.patch(sortedTasks[i]._id, {
        order: i,
        updatedAt: now
      });
    }

    return { success: true };
  },
});
