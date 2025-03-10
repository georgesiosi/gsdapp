"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { ThemeProvider } from "next-themes";

// Ensure Convex URL is available
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!convexUrl) {
  throw new Error("Missing NEXT_PUBLIC_CONVEX_URL environment variable");
}

// Log Convex URL to help debug (will be logged in browser console)
console.log("Connecting to Convex URL:", convexUrl);

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
