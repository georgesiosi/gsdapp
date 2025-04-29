import React from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';

// This is the shared layout for the main application sections (dashboard, goals, settings)
// It utilizes the DashboardLayout to provide the consistent sidebar and header.
export default function MainAppLayout({ children }: { children: React.ReactNode }) {
  // DashboardLayout no longer needs the 'tasks' prop
  return <DashboardLayout>{children}</DashboardLayout>;
}
