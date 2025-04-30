"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Target, Settings, X, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { useUser } from "@clerk/clerk-react";
import { OnboardingModal } from "./onboarding-modal";

interface AppSidebarProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const navItems = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Goals', href: '/goals', icon: Target },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function AppSidebar({ isOpen, setIsOpen }: AppSidebarProps) {
  const pathname = usePathname();
  const { user } = useUser();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const preferences = useQuery(api.userPreferences.getUserPreferences);
  const markOnboardingComplete = useMutation(api.userPreferences.markOnboardingComplete);

  const [showInitialOnboarding, setShowInitialOnboarding] = useState(false);

  const adminEmails = ["georges@siosism.com", "george@faiacorp.com"];
  const isAdmin = user?.primaryEmailAddress?.emailAddress && adminEmails.includes(user.primaryEmailAddress.emailAddress);
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

  const handleGenerateScorecard = async () => {
    // TODO: Implement the actual logic using addScorecard if needed
    toast.info("Generate Scorecard clicked (logic pending)");
  };

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 w-64 bg-background border-r border-border p-4 flex flex-col transition-transform duration-300 ease-in-out',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold tracking-tight">GSDapp</h2>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setIsOpen(false)}
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Close sidebar</span>
        </Button>
      </div>
      <nav className="flex-grow">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="mt-auto flex flex-col space-y-2">
        {/* Admin Only Button to Trigger Onboarding Modal in Dev */}
        {isAdmin && isDevelopment && (
          <Button 
            variant="outline" 
            className="w-full justify-start gap-2" 
            onClick={() => setIsModalOpen(true)} 
          >
            <span>Show Onboarding (Dev)</span> 
          </Button>
        )}
      </div>
      <OnboardingModal 
        isOpen={isModalOpen || showInitialOnboarding} 
        onClose={handleCloseModal} 
      />
    </aside>
  );
}
