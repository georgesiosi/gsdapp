import { query } from "../_generated/server";
import { v } from "convex/values";

// Simple query to get current subscription
export const getSubscription = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
  },
});
