import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Tasks table
  tasks: defineTable({
    text: v.string(),
    quadrant: v.string(), // "q1", "q2", "q3", "q4"
    taskType: v.optional(v.string()), // "personal", "work", "business"
    needsReflection: v.optional(v.boolean()),
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
    order: v.optional(v.float64()),
    userId: v.string(),
    createdAt: v.string(), // ISO string of when the task was created
    updatedAt: v.string(), // ISO string of when the task was last updated
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
    priority: v.optional(v.string()),
    isLegacyUser: v.optional(v.boolean()),
    theme: v.optional(v.union(v.literal('light'), v.literal('dark'), v.literal('system'))),
    showCompletedTasks: v.optional(v.boolean()),
    autoAnalyze: v.optional(v.boolean()),
    syncApiKey: v.optional(v.boolean()),
    taskSettings: v.optional(v.object({
      endOfDayTime: v.string(),
      autoArchiveDelay: v.float64(),
      gracePeriod: v.float64(),
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

  // Subscription table - simple and focused
  subscriptions: defineTable({
    userId: v.string(),
    status: v.union(v.literal("active"), v.literal("inactive")),
    tier: v.union(
      v.literal("free"),
      v.literal("pro"),
      v.literal("team")
    ),
    validUntil: v.optional(v.number()), // Unix timestamp
  }).index("by_user", ["userId"]),

  // Webhook secrets - simple and focused
  webhookSecrets: defineTable({
    provider: v.string(), // e.g., "polar"
    secret: v.string(),
    createdAt: v.number(),
  }).index("by_provider", ["provider"]),
});
