import { v } from "convex/values";
import { mutation, internalMutation } from "../_generated/server";
import { DatabaseWriter } from "../_generated/server";
import { Id } from "../_generated/dataModel";

// Types for subscription management
export type SubscriptionStatus = "active" | "inactive";
export type SubscriptionTier = "free" | "pro" | "team";

type SubscriptionArgs = {
  userId: string;
  status: SubscriptionStatus;
  tier: SubscriptionTier;
  validUntil?: number;
};

// Helper to update subscription
async function upsertSubscription(
  db: DatabaseWriter,
  args: SubscriptionArgs
): Promise<Id<"subscriptions">> {
  const existing = await db
    .query("subscriptions")
    .withIndex("by_user", (q) => q.eq("userId", args.userId))
    .unique();

  if (existing) {
    await db.patch(existing._id, args);
    return existing._id;
  }

  return await db.insert("subscriptions", args);
}

// Mutation names for reference
export const MUTATION_NAMES = {
  UPDATE_SUBSCRIPTION: "subscription:updateSubscription",
  HANDLE_WEBHOOK_UPDATE: "subscription:handleWebhookUpdate",
} as const;

// Update subscription status
export const updateSubscription = mutation({
  args: {
    userId: v.string(),
    status: v.union(v.literal("active"), v.literal("inactive")),
    tier: v.union(v.literal("free"), v.literal("pro"), v.literal("team")),
    validUntil: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await upsertSubscription(ctx.db, args);
  },
});

// Handle webhook updates
export const handleWebhookUpdate = internalMutation({
  args: {
    userId: v.string(),
    status: v.union(v.literal("active"), v.literal("inactive")),
    tier: v.union(v.literal("free"), v.literal("pro"), v.literal("team")),
    validUntil: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await upsertSubscription(ctx.db, args);
  },
});
