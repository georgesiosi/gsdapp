"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { ThemeProvider } from "next-themes";

// ENVIRONMENT VARIABLES DEBUGGING - START
// List all available environment variables for debugging
const envVars: Record<string, string | undefined> = {};
for (const key in process.env) {
  envVars[key] = process.env[key];
}
console.log("All available environment variables:", envVars);

// With Next.js, we need to be careful about environment variables that are available at runtime
// Hard-code staging Convex URL as a fallback if environment variables are missing
const FALLBACK_STAGING_CONVEX_URL = "https://rapid-octopus-495.convex.cloud";
const FALLBACK_PROD_CONVEX_URL = "https://kindhearted-basilisk-30.convex.cloud";

// Try to get Convex URL from environment variables first
let convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONTEXT_STAGING_NEXT_PUBLIC_CONVEX_URL;

// If no environment variable is found, determine environment based on hostname
if (!convexUrl && typeof window !== 'undefined') {
  const hostname = window.location.hostname;
  console.log("Current hostname:", hostname);
  
  // Use hostname to determine which environment we're in
  if (hostname.includes('staging') || hostname.includes('deploy-preview') || hostname === 'localhost') {
    console.log("Detected staging/development environment. Using staging Convex URL.");
    convexUrl = FALLBACK_STAGING_CONVEX_URL;
  } else {
    console.log("Detected production environment. Using production Convex URL.");
    convexUrl = FALLBACK_PROD_CONVEX_URL;
  }
}

// Final check and logging
if (!convexUrl) {
  console.error("Could not determine Convex URL from environment variables or hostname!");
  throw new Error("Missing Convex URL environment variable and could not determine from hostname");
}

console.log("Connecting to Convex URL:", convexUrl);
// ENVIRONMENT VARIABLES DEBUGGING - END

// Initialize Convex client with custom headers
const convex = new ConvexReactClient(convexUrl, {
  unsavedChangesWarning: false // Disable unsaved changes warning
});

// Log any unhandled promise rejections which might be related to Convex
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', event => {
    console.error('Unhandled promise rejection (possibly Convex-related):', event.reason);
  });

  // Add event listener for AI thinking state
  window.addEventListener('aiThinkingChanged', (event: Event) => {
    const customEvent = event as CustomEvent;
    if (customEvent.detail?.thinking !== undefined) {
      console.log('AI thinking state changed:', customEvent.detail.thinking);
    }
  });
}

// Wrap Convex with Clerk auth using session tokens
function ConvexClientProvider({ children }: { children: React.ReactNode }) {
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const auth = useAuth();
  
  // Deliberately NOT showing connection errors during development
  // This allows us to continue using the app while we debug
  useEffect(() => {
    // Set a flag to verify we have a valid Convex client
    if (convex) {
      console.log("Convex client initialized with URL:", convexUrl);
      
      // Always mark as connected for now to avoid blocking the app
      // The real test will happen when we try to use Convex functions
      setIsConnected(true);
      
      // For debugging purposes
      // Using this TypeScript workaround to add a debug property to window
      (window as any).DEBUG_forceConvexTest = () => {
        console.log("Manual Convex connection test initiated");
        console.log("Auth state:", { 
          isLoaded: auth.isLoaded, 
          isSignedIn: auth.isSignedIn, 
          userId: auth.userId, 
          sessionId: auth.sessionId 
        });
        console.log("You can run the Convex test from the settings page to verify the connection");
      };
    }
    
    // Log auth status for debugging
    if (auth.isLoaded) {
      console.log("Auth loaded - Current session details:", {
        isSignedIn: auth.isSignedIn,
        userId: auth.userId,
        sessionId: auth.sessionId ? "present" : "missing"
      });
    }
  }, [auth.isLoaded, auth.isSignedIn, auth.userId, auth.sessionId]);

  // TEMPORARILY DISABLED: We're not going to show any connection errors
  // during development to make it easier to work on the app
  // This code would normally check for authentication issues, but for now
  // we'll let the app continue loading regardless of connection status

  // TEMPORARILY DISABLED: Not showing any connection warnings during development
  // This allows the app to run normally while we work on the Convex integration
  const connectionWarning = null;

  // Use a simplified configuration to ensure we don't block the app
  return (
    <ConvexProviderWithClerk 
      client={convex} 
      useAuth={useAuth}
    >
      {connectionWarning}
      {children}
    </ConvexProviderWithClerk>
  );
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConvexClientProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
      </ThemeProvider>
    </ConvexClientProvider>
  );
}
