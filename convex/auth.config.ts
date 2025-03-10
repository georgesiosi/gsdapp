// Define auth config for Convex
export default {
  providers: [{
    name: "clerk",
    domain: process.env.NEXT_PUBLIC_CLERK_DOMAIN || "live-glider-97.clerk.accounts.dev",
    applicationID: "convex",  // Match the JWT template name we created in Clerk
  }],
};
