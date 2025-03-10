// Define auth config for Convex
export default {
  providers: [{
    name: "clerk",
    domain: process.env.NEXT_PUBLIC_CLERK_DOMAIN,
    applicationID: "convex",  // Match the JWT template name we created in Clerk
    // Ensure JWT verification is properly configured
    verifyToken: true,
  }],
  // Set to true to get more detailed error messages
  debug: process.env.NODE_ENV !== "production",
};
