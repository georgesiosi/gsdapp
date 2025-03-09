import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Tasks table
  tasks: defineTable({
    text: v.string(),
    quadrant: v.string(), // "q1", "q2", "q3", "q4"
    taskType: v.optional(v.string()), // "personal", "work", "business"
    needsReflection: v.boolean(),
    status: v.string(), // "active", "completed"
    description: v.optional(v.string()),
    reflection: v.optional(v.object({
      justification: v.string(),
      aiAnalysis: v.optional(v.string()),
      suggestedQuadrant: v.optional(v.string()),
      finalQuadrant: v.string(),
      feedback: v.optional(v.string()),
      content: v.optional(v.string()),
      reflectedAt: v.string(),
    })),
    completedAt: v.optional(v.string()),
    order: v.optional(v.number()),
    userId: v.string(),
  }).index("by_user", ["userId"]),
  
  // Ideas table
  ideas: defineTable({
    text: v.string(),
    taskType: v.string(),
    connectedToPriority: v.boolean(),
    userId: v.string(),
  }).index("by_user", ["userId"]),
  
  // User preferences table
  userPreferences: defineTable({
    goal: v.optional(v.string()),
    openAIKey: v.optional(v.string()),
    licenseKey: v.optional(v.string()),
    priority: v.optional(v.string()),
    theme: v.optional(v.string()),
    showCompletedTasks: v.optional(v.boolean()),
    autoAnalyze: v.optional(v.boolean()),
    taskSettings: v.optional(v.object({
      endOfDayTime: v.string(),
      autoArchiveDelay: v.number(),
      gracePeriod: v.number(),
      retainRecurringTasks: v.boolean(),
    })),
    userId: v.string(),
  }).index("by_user", ["userId"]),
  
  // Scorecards table
  scorecards: defineTable({
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
    userId: v.string(),
  }).index("by_user", ["userId"]),
});
