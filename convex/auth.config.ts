// Define auth config for Convex with Clerk best practices

// Try both prefixed and unprefixed environment variables
// const getEnvVar = (name: string) => 
//   process.env[name] || process.env[`CONTEXT_STAGING_${name}`] || process.env[`CONTEXT_PRODUCTION_${name}`];

// Get Clerk issuer URL directly from expected production environment variable
const clerkIssuerUrl = process.env.CLERK_JWT_ISSUER_DOMAIN;

export default {
  providers: [{
    name: "clerk",
    // Use Clerk issuer URL for JWT verification
    domain: clerkIssuerUrl, // Use the full URL
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
