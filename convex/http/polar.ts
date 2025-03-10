import { httpRouter } from "convex/server";
import { httpAction } from "../_generated/server";

// Simple webhook handler for Polar.sh
const http = httpRouter();

// Simple helper to verify webhook signature
const verifySignature = (signature: string | null, body: string): boolean => {
  // TODO: Implement signature verification with Polar.sh webhook secret
  return true;
};

// Types for webhook payload
type PolarWebhookPayload = {
  type: string;
  data: {
    user_id: string;
    status: string;
    plan_id: string;
    current_period_end: number;
  };
};

// Webhook handler for subscription events
http.route({
  path: "/polar",
  method: "POST",
  handler: httpAction(async ({ runMutation }, request: Request) => {
    // Verify webhook signature
    const signature = request.headers.get("x-polar-signature");
    const rawBody = await request.text();
    
    if (!signature || !verifySignature(signature, rawBody)) {
      return new Response("Invalid signature", { status: 401 });
    }

    try {
      // Parse webhook payload
      const body = JSON.parse(rawBody) as PolarWebhookPayload;
      const { type, data } = body;

      // Build subscription data from webhook payload
      const userId = data.user_id;
      const isActive = data.status === "active";
      const tier = data.plan_id === "team" ? "team" : "pro";
      const validUntil = data.current_period_end;

      // Process the webhook event using a mutation
      if (type === "subscription.deleted") {
        // For deletion events, mark as inactive
        // @ts-ignore - string reference to mutation
        await runMutation("subscription:updateSubscription", {
          userId,
          status: "inactive",
          tier: "free",
          validUntil: Date.now()
        });
      } else {
        // For creation and update events
        // @ts-ignore - string reference to mutation
        await runMutation("subscription:updateSubscription", {
          userId,
          status: isActive ? "active" : "inactive",
          tier,
          validUntil
        });
      }

      return new Response("OK", { status: 200 });
    } catch (error) {
      console.error("Error processing webhook:", error);
      return new Response("Internal server error", { status: 500 });
    }
  }),
});

export default http;
