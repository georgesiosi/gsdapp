import { authMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from 'next/server';
 
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
  ignoredRoutes: ["/api/webhooks/polar/health", "/api/webhooks/polar"],

  async afterAuth(auth, req) {
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
