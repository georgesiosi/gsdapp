import { NextRequest, NextResponse } from "next/server";
import { getAuth, clerkMiddleware } from "@clerk/nextjs/server";
import { NextFetchEvent } from "next/server";

// Apply Clerk middleware
const apiRoutePattern = /^\/api(?!\/webhooks\/polar)/;
const authMiddleware = clerkMiddleware();

// Define our public routes that don't require authentication
// Using regex patterns to ensure all paths under sign-in and sign-up are public
const publicPaths = ["/", "/api/webhooks/polar/health"];
const publicPatterns = [
  /^\/sign-in(\/.*)?$/,  // All paths under /sign-in
  /^\/sign-up(\/.*)?$/   // All paths under /sign-up
];

// Development mode detection - could be set by Docker or Next.js
const isDevelopment = process.env.NODE_ENV === 'development';

// The middleware function that Next.js will call for matched routes
export default async function middleware(req: NextRequest, event: NextFetchEvent) {
  // Apply Clerk middleware to non-public API routes
  if (apiRoutePattern.test(req.nextUrl.pathname)) {
    return authMiddleware(req, event);
  }
  try {
    // Get the pathname from the request URL
    const { pathname } = req.nextUrl;
    
    // Check if the path is in our public paths list
    const isPublicPath = publicPaths.some(path => 
      pathname === path || pathname.startsWith(`${path}/`)
    );
    
    // Check if the path matches any of our public regex patterns
    const matchesPublicPattern = publicPatterns.some(pattern => 
      pattern.test(pathname)
    );

    // If the path is public (either in paths list or matches pattern), allow access without authentication
    if (isPublicPath || matchesPublicPattern) {
      return NextResponse.next();
    }

    // In development mode, make authentication optional to help with debugging
    if (isDevelopment) {
      try {
        // Try to get auth, but don't block if it fails
        const { userId } = getAuth(req);
        if (!userId) {
          console.log(`[Dev Mode] Would redirect to sign-in for: ${pathname}`);
          // In development, we'll just allow access anyway
          return NextResponse.next();
        }
      } catch (authError) {
        console.error("[Dev Mode] Auth error:", authError);
        // Continue in dev mode even if auth fails
        return NextResponse.next();
      }
    } else {
      // Production authentication flow
      const { userId } = getAuth(req);
      
      // If the user is not authenticated and trying to access a protected route,
      // redirect them to the sign-in page
      if (!userId) {
        const signInUrl = new URL('/sign-in', req.url);
        signInUrl.searchParams.set('redirect_url', encodeURI(req.url));
        return NextResponse.redirect(signInUrl);
      }
    }

    // If the user is authenticated or we're in dev mode, allow access
    return NextResponse.next();
  } catch (error) {
    // Catch any unexpected errors to prevent the app from crashing
    console.error("Middleware error:", error);
    
    // In case of any error, we'll allow the request to continue
    // This prevents the middleware from completely blocking the app
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    // Skip static files and important assets
    "/((?!.+\\.[\\w]+$|_next/static|_next/image|favicon.ico|.*\\.svg).*)",
    
    // Skip health check API
    "/api/((?!webhooks/polar/health).*)",
  ],
};
