"use client";

import React, { useState, useEffect } from 'react';
import { AppSidebar } from './app-sidebar';
import { AppHeader } from './app-header'; 
import { cn } from '@/lib/utils'; 
import { useUser } from "@clerk/clerk-react";
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { toast } from 'sonner';
import { OnboardingModal } from './onboarding-modal';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ 
  children
}: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useUser(); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const preferences = useQuery(api.userPreferences.getUserPreferences);
  const markOnboardingComplete = useMutation(api.userPreferences.markOnboardingComplete);
  const [showInitialOnboarding, setShowInitialOnboarding] = useState(false);
  
  const adminEmails = ["georges@siosism.com", "george@faiacorp.com"];
  // Ensure isAdmin is always boolean or undefined (!! handles '', null, undefined correctly)
  const isAdmin = !!(user?.primaryEmailAddress?.emailAddress && adminEmails.includes(user.primaryEmailAddress.emailAddress));
  const isDevelopment = process.env.NODE_ENV === 'development';

  useEffect(() => {
    if (preferences !== undefined && !showInitialOnboarding && !isModalOpen) {
      if (!preferences?.hasCompletedOnboarding) {
        console.log('[DEBUG] User needs onboarding, showing modal.');
        setShowInitialOnboarding(true);
      }
    }
  }, [preferences, showInitialOnboarding, isModalOpen]);

  const handleCloseModal = () => {
    console.log("[DEBUG] handleCloseModal triggered in DashboardLayout!"); 
    setIsModalOpen(false);
    if (showInitialOnboarding) {
      setShowInitialOnboarding(false);
      markOnboardingComplete()
        .then(() => {
          console.log('[DEBUG] Successfully marked onboarding complete via mutation.');
        })
        .catch((error) => {
          console.error('Failed to mark onboarding complete:', error);
          toast.error('Failed to save onboarding status. Please try again.');
        });
    }
  };

  const openDevModal = () => setIsModalOpen(true);

  return (
    <div className="relative flex h-screen bg-background">
      <AppSidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
        isAdmin={isAdmin}
        isDevelopment={isDevelopment}
        openDevModal={openDevModal}
      />

      <div
        className={cn(
          "flex-1 flex flex-col transition-all duration-300 ease-in-out",
        )}
      >
        <AppHeader 
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
          isSidebarOpen={isSidebarOpen} 
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>

      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden" 
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <OnboardingModal 
        isOpen={isModalOpen || showInitialOnboarding} 
        onClose={handleCloseModal} 
      />
    </div>
  );
}
