import { Doc } from "../_generated/dataModel";

// Simple type for subscription status
export type SubscriptionStatus = "legacy" | "free" | "pro" | "team" | "expired";

// Simple helper to check if a subscription is active
export function isSubscriptionActive(subscription: Doc<"subscriptions"> | null): boolean {
  if (!subscription) return false;
  
  const now = Date.now();
  return (
    subscription.status === "active" &&
    (!subscription.validUntil || subscription.validUntil > now)
  );
}

// Simple helper to get user's subscription status
export function getSubscriptionStatus(
  subscription: Doc<"subscriptions"> | null,
  userPreferences: Doc<"userPreferences"> | null
): SubscriptionStatus {
  // Legacy user check (had a license key before)
  if (userPreferences?.isLegacyUser) {
    return "legacy";
  }

  // No subscription = free tier
  if (!subscription) {
    return "free";
  }

  // Check if subscription is expired
  if (!isSubscriptionActive(subscription)) {
    return "expired";
  }

  // Return current tier
  return subscription.tier;
}

// Simple helper to check if user has access to pro features
export function hasProAccess(
  subscription: Doc<"subscriptions"> | null,
  userPreferences: Doc<"userPreferences"> | null
): boolean {
  const status = getSubscriptionStatus(subscription, userPreferences);
  return ["legacy", "pro", "team"].includes(status);
}

// Simple helper to get subscription tier features
export function getTierFeatures(tier: SubscriptionStatus): {
  maxTasks: number;
  maxIdeas: number;
  aiEnabled: boolean;
  teamEnabled: boolean;
} {
  switch (tier) {
    case "team":
      return {
        maxTasks: Infinity,
        maxIdeas: Infinity,
        aiEnabled: true,
        teamEnabled: true,
      };
    case "pro":
    case "legacy":
      return {
        maxTasks: Infinity,
        maxIdeas: Infinity,
        aiEnabled: true,
        teamEnabled: false,
      };
    case "free":
    case "expired":
    default:
      return {
        maxTasks: 100,
        maxIdeas: 50,
        aiEnabled: false,
        teamEnabled: false,
      };
  }
}
