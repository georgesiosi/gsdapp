import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUser } from "./auth";

// Get all scorecards for the current user
export const getScorecards = query({
  handler: async (ctx) => {
    const userId = await getAuthenticatedUser(ctx);
    return await ctx.db
      .query("scorecards")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

// Add a new scorecard
export const addScorecard = mutation({
  args: {
    metrics: v.object({
      date: v.string(),
      totalTasks: v.number(),
      completedTasks: v.number(),
      completionRate: v.number(),
      quadrantMetrics: v.object({
        q1: v.object({
          total: v.number(),
          completed: v.number(),
          completionRate: v.number(),
        }),
        q2: v.object({
          total: v.number(),
          completed: v.number(),
          completionRate: v.number(),
        }),
        q3: v.object({
          total: v.number(),
          completed: v.number(),
          completionRate: v.number(),
        }),
        q4: v.object({
          total: v.number(),
          completed: v.number(),
          completionRate: v.number(),
        }),
      }),
      highValueCompletionRate: v.number(),
      priorityAlignmentScore: v.number(),
    }),
    trends: v.object({
      completionRateTrend: v.string(),
      highValueCompletionTrend: v.string(),
      priorityAlignmentTrend: v.string(),
    }),
    insights: v.object({
      analysis: v.string(),
      suggestions: v.array(v.string()),
    }),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUser(ctx);

    return await ctx.db.insert("scorecards", {
      ...args,
      userId,
    });
  },
});

// Update a scorecard
export const updateScorecard = mutation({
  args: {
    id: v.id("scorecards"),
    metrics: v.optional(v.object({
      date: v.string(),
      totalTasks: v.number(),
      completedTasks: v.number(),
      completionRate: v.number(),
      quadrantMetrics: v.object({
        q1: v.object({
          total: v.number(),
          completed: v.number(),
          completionRate: v.number(),
        }),
        q2: v.object({
          total: v.number(),
          completed: v.number(),
          completionRate: v.number(),
        }),
        q3: v.object({
          total: v.number(),
          completed: v.number(),
          completionRate: v.number(),
        }),
        q4: v.object({
          total: v.number(),
          completed: v.number(),
          completionRate: v.number(),
        }),
      }),
      highValueCompletionRate: v.number(),
      priorityAlignmentScore: v.number(),
    })),
    trends: v.optional(v.object({
      completionRateTrend: v.string(),
      highValueCompletionTrend: v.string(),
      priorityAlignmentTrend: v.string(),
    })),
    insights: v.optional(v.object({
      analysis: v.string(),
      suggestions: v.array(v.string()),
    })),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUser(ctx);
    const scorecard = await ctx.db.get(args.id);

    // Check if scorecard exists and belongs to user
    if (!scorecard || scorecard.userId !== userId) {
      throw new Error("Scorecard not found or unauthorized");
    }

    // Create update object with only provided fields
    const { id, ...updates } = args;
    return await ctx.db.patch(args.id, updates);
  },
});

// Delete a scorecard
export const deleteScorecard = mutation({
  args: { id: v.id("scorecards") },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUser(ctx);
    const scorecard = await ctx.db.get(args.id);

    // Check if scorecard exists and belongs to user
    if (!scorecard || scorecard.userId !== userId) {
      throw new Error("Scorecard not found or unauthorized");
    }

    await ctx.db.delete(args.id);
    return { success: true };
  },
});
