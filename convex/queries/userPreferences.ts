import { query } from "../_generated/server";
import { v } from "convex/values";

// Simple query to get user preferences
export const getUserPreferences = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
  },
});

// Simple helper to check if user exists
export const userExists = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    return !!user;
  },
});
