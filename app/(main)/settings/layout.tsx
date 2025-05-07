"use client";

// /app/(main)/settings/layout.tsx
import React from 'react';
import { useUser } from '@clerk/nextjs';
import { redirect } from 'next/navigation';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoaded, isSignedIn } = useUser();

  console.log('[Settings Layout] State:', { isLoaded, isSignedIn, userId: user?.id }); // Log initial state

  if (!isLoaded) {
    console.log('[Settings Layout] User not loaded yet.');
    // Consistent loading state with the rest of the app might be better
    return <div className="flex justify-center items-center min-h-screen">Loading user information...</div>;
  }

  if (!isSignedIn) { 
    console.warn(`[Settings Layout] Redirecting. Signed In: ${isSignedIn}`);
    redirect('/'); // Redirect non-signed-in users to the home page
  }

  console.log('[Settings Layout] Rendering settings content.'); // Log successful access

  // Render children directly, relying on DashboardLayout's padding
  return <>{children}</>; 
}
