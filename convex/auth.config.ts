// Define auth config for Convex with Clerk best practices

// Try both prefixed and unprefixed environment variables
const getEnvVar = (name: string) => 
  process.env[name] || process.env[`CONTEXT_STAGING_${name}`] || process.env[`CONTEXT_PRODUCTION_${name}`];

// Get Clerk issuer URL with fallback handling
const clerkIssuerUrl = getEnvVar('NEXT_PUBLIC_CLERK_ISSUER_URL');

export default {
  providers: [{
    name: "clerk",
    // Use Clerk issuer URL for JWT verification
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
