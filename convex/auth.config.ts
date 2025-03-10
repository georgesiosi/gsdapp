// Define auth config for Convex with enhanced JWKS handling
export default {
  providers: [{
    name: "clerk",
    // Use issuer URL when available, otherwise fall back to domain
    domain: process.env.NEXT_PUBLIC_CLERK_ISSUER_URL?.replace(/^https?:\/\//, '') ||
            process.env.NEXT_PUBLIC_CLERK_DOMAIN,
    applicationID: "convex",  // Match the JWT template name we created in Clerk
    // Ensure JWT verification is properly configured with better caching control
    verifyToken: true,
    // Specify required claims
    requiredClaims: ["userId", "applicationId"],
    // Enhanced JWKS options (if supported)
    jwksOptions: {
      cache: false,  // Disable caching for JWKS
      timeout: 10000, // Increase timeout for JWKS fetching
      retry: 3       // Allow retries
    }
  }],
  // Set to true to get more detailed error messages
  debug: true, // Force debug on to see more details about the JWT verification
};
