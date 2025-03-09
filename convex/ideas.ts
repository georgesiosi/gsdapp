import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUser } from "./auth";

// Get all ideas for the current user
export const getIdeas = query({
  handler: async (ctx) => {
    const userId = await getAuthenticatedUser(ctx);
    return await ctx.db
      .query("ideas")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

// Add a new idea
export const addIdea = mutation({
  args: {
    text: v.string(),
    taskType: v.string(),
    connectedToPriority: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUser(ctx);

    return await ctx.db.insert("ideas", {
      text: args.text,
      taskType: args.taskType,
      connectedToPriority: args.connectedToPriority,
      userId,
    });
  },
});

// Update an idea
export const updateIdea = mutation({
  args: {
    id: v.id("ideas"),
    text: v.optional(v.string()),
    taskType: v.optional(v.string()),
    connectedToPriority: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUser(ctx);
    const idea = await ctx.db.get(args.id);

    // Check if idea exists and belongs to user
    if (!idea || idea.userId !== userId) {
      throw new Error("Idea not found or unauthorized");
    }

    // Create update object with only provided fields
    const { id, ...updates } = args;
    return await ctx.db.patch(args.id, updates);
  },
});

// Delete an idea
export const deleteIdea = mutation({
  args: { id: v.id("ideas") },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUser(ctx);
    const idea = await ctx.db.get(args.id);

    // Check if idea exists and belongs to user
    if (!idea || idea.userId !== userId) {
      throw new Error("Idea not found or unauthorized");
    }

    await ctx.db.delete(args.id);
    return { success: true };
  },
});
