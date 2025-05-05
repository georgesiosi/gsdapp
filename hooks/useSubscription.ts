import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useUser } from "@clerk/clerk-react";
import { SubscriptionStatus, getSubscriptionStatus, getTierFeatures } from "../convex/utils/subscription";

// Simple hook for subscription management
export function useSubscription() {
  const { user } = useUser();
  const userId = user?.id;

  // Get current subscription and preferences
  const subscription = useQuery(api.queries.subscription.getSubscription, 
    userId ? { userId } : "skip"
  );
  const preferences = useQuery(api.queries.userPreferences.getUserPreferences,
    userId ? { userId } : "skip"
  );

  // Get subscription status and features
  const status: SubscriptionStatus = userId 
    ? getSubscriptionStatus(subscription || null, preferences || null)
    : "free";
  const features = getTierFeatures(status);

  // Simple messages for each status
  const statusMessage = {
    legacy: "Legacy User - Full Access",
    free: "Free Tier",
    pro: "Pro Subscription",
    team: "Team Subscription",
    expired: "Subscription Expired"
  }[status];

  return {
    status,
    statusMessage,
    features,
    isLegacy: status === "legacy",
    isPro: status === "pro",
    isTeam: status === "team",
    isExpired: status === "expired",
    isFree: status === "free",
    hasProAccess: ["legacy", "pro", "team"].includes(status),
  };
}
