"use client";

import React, { useState } from 'react';
import { AppSidebar } from './app-sidebar';
import { AppHeader } from './app-header'; 
import { cn } from '@/lib/utils'; 

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ 
  children
}: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // On larger screens, we might want the sidebar open by default.
  // We'll handle the logic for initial state based on screen size later,
  // or let the sidebar component itself manage its default visibility.

  return (
    <div className="relative flex h-screen bg-background">
      {/* Sidebar will be positioned absolutely/fixed later */}
      <AppSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* Main content area */}
      <div
        className={cn(
          "flex flex-col flex-1 overflow-hidden transition-[margin-left] duration-300 ease-in-out",
          // Apply margin-left only on md+ screens when sidebar is open
          isSidebarOpen ? "md:ml-64" : "md:ml-0"
        )}
      >
        {/* Render header only on mobile (md:hidden in AppHeader handles this) */}
        <AppHeader
          isSidebarOpen={isSidebarOpen} // Pass state down
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} // Toggle function
        />

        {/* Apply smooth scroll to the main content area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 scroll-smooth">
          {children}
        </main>
      </div>

      {/* Optional: Overlay for closing sidebar on mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
