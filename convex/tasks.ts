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
      .order("desc") // Sort by _creationTime descending (newest first)
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
    taskType: v.optional(v.union(v.literal("personal"), v.literal("work"), v.literal("business"))),
    status: v.optional(v.union(v.literal("active"), v.literal("completed"))),
    description: v.optional(v.string()),
    order: v.optional(v.float64()), // Will be ignored by the new logic but kept for arg consistency if needed elsewhere
    createdAt: v.optional(v.string()), // Optional: server will generate if not provided
    updatedAt: v.optional(v.string()), // Optional: server will generate if not provided
    goalId: v.optional(v.id("goals")),
    dueDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUser(ctx);
    const now = new Date().toISOString();

    // 1. Fetch user's active goals for their order
    const userGoals = await ctx.db
      .query("goals")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();
    const goalOrderMap = new Map(userGoals.map(goal => [goal._id.toString(), goal.order ?? Infinity]));

    // 2. Fetch existing tasks in the specified quadrant
    const existingTasks = await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("quadrant"), args.quadrant))
      .collect();

    // 3. Define the new task for sorting comparison (as a temporary object)
    const newTaskForComparison = {
      _id: "temp_new_task_id", // Temporary ID for sorting logic
      _creationTime: Date.now(), // Use current time for sorting new task
      text: args.text,
      quadrant: args.quadrant,
      taskType: args.taskType ?? "personal",
      status: args.status ?? "active",
      description: args.description,
      userId,
      createdAt: args.createdAt || now,
      updatedAt: args.updatedAt || now,
      goalId: args.goalId,
      dueDate: args.dueDate,
      // 'order' field is not needed here as it's determined by sort position
    };

    // 4. Combine new task candidate with existing tasks
    // Type assertion to allow sorting on common properties including temp ones
    const allTasksToConsider = [...existingTasks, newTaskForComparison] as any[]; 

    // 5. Sort the combined list
    allTasksToConsider.sort((a, b) => {
      const aDueDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const bDueDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      if (aDueDate !== bDueDate) return aDueDate - bDueDate;

      const aGoalOrder = a.goalId ? (goalOrderMap.get(a.goalId.toString()) ?? Infinity) : Infinity;
      const bGoalOrder = b.goalId ? (goalOrderMap.get(b.goalId.toString()) ?? Infinity) : Infinity;
      if (aGoalOrder !== bGoalOrder) return aGoalOrder - bGoalOrder;
      
      // For existing tasks, a._creationTime is a number (timestamp from Convex)
      // For newTaskForComparison, we set _creationTime as Date.now()
      const valA = typeof a._creationTime === 'string' ? parseInt(a._creationTime, 10) : a._creationTime;
      const valB = typeof b._creationTime === 'string' ? parseInt(b._creationTime, 10) : b._creationTime;
      return valA - valB;
    });

    // 6. Insert the new task (order will be set in the patch loop)
    const newTaskId = await ctx.db.insert("tasks", {
      text: args.text,
      quadrant: args.quadrant,
      taskType: args.taskType ?? "personal",
      status: args.status ?? "active",
      description: args.description,
      userId,
      order: 0, // Placeholder, will be updated in the loop
      createdAt: args.createdAt || now,
      updatedAt: args.updatedAt || now, // Will be updated again by patch
      goalId: args.goalId,
      dueDate: args.dueDate,
    });

    // Update the temporary ID in the sorted list with the actual new Task ID
    const newActualTaskIndexInSortedList = allTasksToConsider.findIndex(t => t._id === "temp_new_task_id");
    if (newActualTaskIndexInSortedList !== -1) {
        allTasksToConsider[newActualTaskIndexInSortedList]._id = newTaskId;
    }
    
    // 7. Patch all tasks in the sorted list with their new order index and updatedAt
    const updateOps = [];
    for (let i = 0; i < allTasksToConsider.length; i++) {
      const taskInSortedList = allTasksToConsider[i];
      const existingTaskMatch = existingTasks.find(et => et._id.toString() === taskInSortedList._id.toString());
      
      // Patch if it's the new task, or if an existing task's order has changed
      if (taskInSortedList._id.toString() === newTaskId.toString() || !existingTaskMatch || existingTaskMatch.order !== i) {
        updateOps.push(ctx.db.patch(taskInSortedList._id, { order: i, updatedAt: now }));
      }
    }
    await Promise.all(updateOps);

    return newTaskId;
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
    taskType: v.optional(v.union(v.literal("personal"), v.literal("work"), v.literal("business"))),
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
    goalId: v.optional(v.id("goals")), // Add goalId argument
    dueDate: v.optional(v.string()), // Add dueDate argument
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

    // Prepare the update data object selectively
    const updateData: any = {};
    if (args.text !== undefined) updateData.text = args.text;
    if (args.quadrant !== undefined) updateData.quadrant = args.quadrant;
    if (args.taskType !== undefined) updateData.taskType = args.taskType;
    if (args.needsReflection !== undefined) updateData.needsReflection = args.needsReflection;
    if (args.status !== undefined) updateData.status = args.status;
    if (args.description !== undefined) updateData.description = args.description;
    if (args.reflection !== undefined) updateData.reflection = args.reflection;
    if (args.completedAt !== undefined) updateData.completedAt = args.completedAt;
    if (args.order !== undefined) updateData.order = args.order;
    if (args.createdAt !== undefined) updateData.createdAt = args.createdAt;
    if (args.goalId !== undefined) updateData.goalId = args.goalId; // Include goalId in update
    if (args.dueDate !== undefined) updateData.dueDate = args.dueDate; // Include dueDate in update

    // Always update the updatedAt timestamp
    updateData.updatedAt = new Date().toISOString();

    // Perform the patch operation
    await ctx.db.patch(args.id, updateData);

    return { 
      success: true,
      message: "Task updated successfully",
      id: args.id.toString(),
      timestamp: updateData.updatedAt
    };
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
