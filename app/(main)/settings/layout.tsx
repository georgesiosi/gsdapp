"use client";

// /app/(main)/settings/layout.tsx
import React from 'react';
import { useUser } from '@clerk/nextjs';
import { redirect } from 'next/navigation';

// Placeholder for admin check - replace with your actual logic
const isAdminUser = (userId: string | undefined): boolean => {
  const ADMIN_USER_ID = process.env.NEXT_PUBLIC_ADMIN_USER_ID;
  // Log the values being compared
  console.log('[Admin Check] Comparing:', { userId, ADMIN_USER_ID });
  if (!ADMIN_USER_ID) {
    console.warn('NEXT_PUBLIC_ADMIN_USER_ID environment variable is not set. Settings area will be inaccessible.');
    return false;
  }
  // Example: Check against a list of known admin IDs or check user metadata/roles
  // It's best practice to store this in environment variables
  // const adminIds = ADMIN_USER_ID.split(','); 
  // return userId ? adminIds.includes(userId) : false;
  return userId === ADMIN_USER_ID;
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoaded, isSignedIn } = useUser();

  console.log('[Settings Layout] State:', { isLoaded, isSignedIn, userId: user?.id }); // Log initial state

  if (!isLoaded) {
    console.log('[Settings Layout] User not loaded yet.');
    // Consistent loading state with the rest of the app might be better
    return <div className="flex justify-center items-center min-h-screen">Loading user information...</div>;
  }

  // Protect the entire /settings route
  const isUserAdmin = isAdminUser(user?.id);
  console.log('[Settings Layout] Admin Check Result:', isUserAdmin); // Log admin check result

  if (!isSignedIn || !isUserAdmin) {
    console.warn(`[Settings Layout] Redirecting. Signed In: ${isSignedIn}, Is Admin: ${isUserAdmin}`);
    redirect('/'); // Redirect non-admins to the home page
  }

  console.log('[Settings Layout] Rendering settings content.'); // Log successful access

  // Since this layout is inside (main), it likely inherits the main layout (header, etc.)
  // We just need to render the settings-specific content.
  return (
    <div className="container py-8">
        <h1 className="text-2xl font-bold mb-6">Admin Settings</h1>
        {/* TODO: Add settings navigation (e.g., sidebar or tabs) if needed */}
        {children} {/* Render the specific settings page content */}
    </div>
  );
}
