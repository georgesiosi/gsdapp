// Define auth config for Convex with Clerk best practices
export default {
  providers: [{
    name: "clerk",
    // Handle both local and staging Clerk issuer URLs for JWT verification
    domain: (process.env.NEXT_PUBLIC_CLERK_ISSUER_URL || process.env.CONTEXT_STAGING_NEXT_PUBLIC_CLERK_ISSUER_URL)?.replace(/^https?:\/\//, ''),
    applicationID: "convex",
    verifyToken: true,
    // Required claims for Clerk JWT verification
    requiredClaims: ["sub", "userId", "sessionId"],
    // Improved JWKS handling
    jwksOptions: {
      cache: false,  // Disable caching to ensure fresh keys
      timeout: 5000, // 5 second timeout
      retry: {
        count: 3,    // Number of retries
        backoff: 1000 // Start with 1 second delay
      }
    }
  }],
  // Keep debug mode on for better error messages
  debug: true
};
