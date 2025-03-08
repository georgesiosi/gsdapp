import { authMiddleware } from "@clerk/nextjs/server";

// Development mode detection
const isDevelopment = process.env.NODE_ENV === 'development';

// Define public routes that don't require authentication
const publicRoutes = [
  "/",                          // Homepage
  "/sign-in",                   // Sign in page
  "/sign-in/*",                 // Any sign-in subpaths
  "/sign-up",                   // Sign up page
  "/sign-up/*",                 // Any sign-up subpaths
  "/api/webhooks/polar/health", // Polar webhook health check
  "/api/webhooks/polar"         // Polar webhook endpoint
];

export default authMiddleware({
  publicRoutes,
  ignoredRoutes: [
    "/api/webhooks/polar/health",
    "/api/webhooks/polar"
  ],
  debug: isDevelopment
});

export const config = {
  matcher: [
    // Match all paths except static assets, API health check, and public assets
    "/((?!.*\\..*|_next).*)",
    "/",
    "/(api|trpc)(.*)"
  ],
};
