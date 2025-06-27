import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUser } from "./auth";
import { Id } from "./_generated/dataModel";

// Helper function to get the next order value for a goal
async function getNextGoalOrderValue(ctx: any, userId: string): Promise<number> {
  const existingGoals = await ctx.db
    .query("goals")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .filter((q: any) => q.field("order") !== undefined) // Consider only goals that have an order
    .collect();

  if (existingGoals.length === 0) {
    return 0; // First goal gets order 0
  }

  // Find the maximum order value among existing goals
  const maxOrder = Math.max(...existingGoals.map((g: any) => g.order!)); // Non-null assertion as we filtered undefined
  return maxOrder + 1;
}

// --- Queries ---

/**
 * Get all goals for the authenticated user.
 */
export const getGoals = query({
  handler: async (ctx) => {
    const userId = await getAuthenticatedUser(ctx);
    return await ctx.db
      .query("goals")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

/**
 * Get active goals for the authenticated user.
 */
export const getActiveGoals = query({
  handler: async (ctx) => {
    const userId = await getAuthenticatedUser(ctx);
    return await ctx.db
      .query("goals")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();
  },
});

// Fetch all goals (active, achieved, archived) for the user
export const getAllGoals = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User must be authenticated to fetch goals.");
    }

    // Fetch goals associated with the user's identity subject (their unique ID)
    return await ctx.db
      .query("goals")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc") // Optional: order by creation time or another field
      .collect();
  },
});

// --- Mutations ---

/**
 * Add a new goal for the authenticated user.
 */
export const addGoal = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    order: v.optional(v.float64()), // Add order argument
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUser(ctx);
    const now = new Date().toISOString();

    if (!args.title.trim()) {
      throw new Error("Goal title cannot be empty.");
    }

    // Calculate the next order value for this goal if not provided
    const order = args.order === undefined ? await getNextGoalOrderValue(ctx, userId) : args.order;

    const goalId = await ctx.db.insert("goals", {
      userId,
      title: args.title.trim(),
      description: args.description?.trim(),
      status: "active",
      updatedAt: now, 
      order, // Include order in the insert
    });

    return goalId;
  },
});

/**
 * Update an existing goal.
 */
export const updateGoal = mutation({
  args: {
    id: v.id("goals"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal('active'), 
      v.literal('achieved'), 
      v.literal('archived')
    )),
    order: v.optional(v.float64()), // Add order argument
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUser(ctx);
    const { id, ...updates } = args;

    const existingGoal = await ctx.db.get(id);

    if (!existingGoal) {
      throw new Error(`Goal not found with ID: ${id}`);
    }

    if (existingGoal.userId !== userId) {
      throw new Error("Not authorized to update this goal.");
    }

    // Validate title if provided
    if (updates.title !== undefined && !updates.title.trim()) {
       throw new Error("Goal title cannot be empty.");
    }
    
    const now = new Date().toISOString();

    // Prepare the data to be patched, including the order if provided
    const patchData: any = { ...updates };
    if (args.order !== undefined) {
      patchData.order = args.order;
    }

    // Trim title and description if present
    if (patchData.title) patchData.title = patchData.title.trim();
    if (patchData.description) patchData.description = patchData.description.trim();
    
    patchData.updatedAt = now;

    await ctx.db.patch(id, patchData);

    return { success: true, id };
  },
});

// --- Delete Goal ---
export const deleteGoal = mutation({
  args: { id: v.id("goals") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User not authenticated");
    }

    // Optional: Check if the goal belongs to the user before deleting
    const existingGoal = await ctx.db.get(args.id);
    if (!existingGoal) {
      throw new Error("Goal not found");
    }
    if (existingGoal.userId !== identity.subject) {
      throw new Error("User not authorized to delete this goal");
    }

    await ctx.db.delete(args.id);
    console.log(`Goal deleted: ${args.id}`);

    // Consider what to do with tasks linked to this goal.
    // Option 1: Set task.goalId to null/undefined
    // Option 2: Leave tasks linked (might lead to dangling references if goal details are needed)
    // Option 3: Delete linked tasks (potentially destructive)
    // For now, let's leave them linked. We can adjust later if needed.
  },
});
