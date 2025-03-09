import { authMiddleware } from "@clerk/nextjs/server";
 
// Skip auth in development for API routes
const isDev = process.env.NODE_ENV === 'development';

export default authMiddleware({
  // Routes that can be accessed while signed out
  publicRoutes: [
    "/", 
    "/sign-in", 
    "/sign-up",
    ...(isDev ? ["/api/analyze-reflection"] : [])
  ],
  // Routes that can always be accessed, and have
  // no authentication information
  ignoredRoutes: ["/api/webhooks/polar/health", "/api/webhooks/polar"]
});

export const config = {
  // Runs before other middleware
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
