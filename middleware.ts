import { NextRequest, NextResponse } from "next/server";
import { NextFetchEvent } from "next/server";
import { getAuth } from "@clerk/nextjs/server";

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

// Create a middleware function using Clerk's authentication
export default async function middleware(req: NextRequest, _event: NextFetchEvent) {

  try {
    const { pathname } = req.nextUrl;

    // Check if the path is in our public routes
    const isPublicRoute = publicRoutes.some(route => {
      // Handle wildcard routes like /sign-in/*
      if (route.endsWith('*')) {
        const baseRoute = route.replace('*', '');
        return pathname.startsWith(baseRoute);
      }
      return pathname === route;
    });

    // If public route, allow access
    if (isPublicRoute) {
      return NextResponse.next();
    }

    try {
      // Get auth state
      const { userId } = await getAuth(req);
      
      // If authenticated or in development, allow access
      if (userId || isDevelopment) {
        return NextResponse.next();
      }
      
      // In production, redirect unauthenticated users to sign-in
      const signInUrl = new URL('/sign-in', req.url);
      signInUrl.searchParams.set('redirect_url', encodeURI(req.url));
      return NextResponse.redirect(signInUrl);
    } catch (authError) {
      // Handle auth errors
      console.error("Auth error:", authError);
      
      // In development, still allow access
      if (isDevelopment) {
        console.log(`[Dev Mode] Auth error for: ${pathname}`);
        return NextResponse.next();
      }
      
      // In production, redirect to sign-in
      const signInUrl = new URL('/sign-in', req.url);
      return NextResponse.redirect(signInUrl);
    }
  } catch (error) {
    // Catch general errors
    console.error("Middleware error:", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    // Match all paths except static assets, API health check, and public assets
    "/((?!.*\\..*|_next).*)",
    "/",
    "/(api|trpc)(.*)"
  ],
};
