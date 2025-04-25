"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Target, Settings, X, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

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

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 w-64 bg-background border-r border-border p-4 flex flex-col transition-transform duration-300 ease-in-out',
        // Handle responsive visibility and open/closed state
        isOpen ? 'translate-x-0' : '-translate-x-full' // Slide in/out based on isOpen state
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
      {/* You could add user info/logout here later */}
     </aside>
   );
 }
