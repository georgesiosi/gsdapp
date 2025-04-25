"use client";

import React from 'react';
import { Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserButton } from '@clerk/nextjs'; // Import Clerk UserButton
import { ScorecardButton } from '@/components/scorecard-button'; // <-- Import ScorecardButton
import { Task } from '@/types/task'; // <-- Import Task type

interface AppHeaderProps {
  isSidebarOpen: boolean; // Add prop to know sidebar state
  onToggleSidebar: () => void;
  tasks: Task[]; // <-- Add tasks prop
}

export function AppHeader({ 
  onToggleSidebar, 
  isSidebarOpen, 
  tasks // <-- Accept tasks prop
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4">
      {/* Mobile Sidebar Toggle */}
      <Button
        variant="outline"
        size="icon"
        className="shrink-0 md:hidden"
        onClick={onToggleSidebar}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle navigation menu</span>
      </Button>

      {/* Desktop Sidebar Toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="hidden shrink-0 md:block"
        onClick={onToggleSidebar}
      >
        {isSidebarOpen ? (
          <PanelLeftClose className="h-5 w-5" />
        ) : (
          <PanelLeftOpen className="h-5 w-5" />
        )}
        <span className="sr-only">Toggle sidebar</span>
      </Button>

      {/* Optional: Add App Title or other elements here */}
      <div className="flex-1">
        {/* Example: Add title that might be hidden on mobile if needed */}
        {/* <h1 className="text-lg font-semibold hidden md:block">GSDapp</h1> */}
      </div>

      {/* Scorecard Button */}
      <ScorecardButton 
        tasks={tasks.filter(t => t.status === 'active' || t.status === 'completed')} 
        className="mr-2" // Add some margin to separate from user button
      />

      {/* Clerk User Button */}
      <UserButton afterSignOutUrl="/" />
    </header>
  );
}
