import { authMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from 'next/server';
 
// Configure Clerk auth middleware with environment-specific settings
export default authMiddleware({
  debug: true, // Enable debug mode to get more detailed error messages
  // Disable JWK caching to ensure we always fetch fresh keys
  jwksCacheTtlInMs: 0, // 0 means no caching
  jwtKey: undefined, // Force re-fetching keys
  // Routes that can be accessed while signed out
  publicRoutes: [
    "/sign-in", 
    "/sign-up",
    "/api/webhooks/polar/health",
    "/api/webhooks/polar"
  ],
  // Routes that can always be accessed, and have
  // no authentication information
  ignoredRoutes: [],

  afterAuth(auth, req) {
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      const response = new NextResponse(null, { status: 204 });
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-openai-key');
      return response;
    }
    return NextResponse.next();
  }
});

export const config = {
  // Runs before other middleware
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
