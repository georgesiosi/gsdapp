// Define auth config for Convex with Clerk best practices

// Log environment variables to help debug issues
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONTEXT_STAGING_NEXT_PUBLIC_CONVEX_URL;
const clerkIssuerUrl = process.env.NEXT_PUBLIC_CLERK_ISSUER_URL || process.env.CONTEXT_STAGING_NEXT_PUBLIC_CLERK_ISSUER_URL;

// Log all relevant environment variables for debugging
console.log('Environment Variables:', {
  convex: {
    local: process.env.NEXT_PUBLIC_CONVEX_URL,
    staging: process.env.CONTEXT_STAGING_NEXT_PUBLIC_CONVEX_URL,
    final: convexUrl
  },
  clerk: {
    local: process.env.NEXT_PUBLIC_CLERK_ISSUER_URL,
    staging: process.env.CONTEXT_STAGING_NEXT_PUBLIC_CLERK_ISSUER_URL,
    final: clerkIssuerUrl,
    domain: clerkIssuerUrl?.replace(/^https?:\/\//, '')
  }
});

export default {
  providers: [{
    name: "clerk",
    // Use the extracted Clerk issuer URL for JWT verification
    domain: clerkIssuerUrl?.replace(/^https?:\/\//, ''),
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
