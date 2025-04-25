"use client";

import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useSettings } from '@/hooks/use-settings';

/**
 * Synchronizes the theme managed by next-themes with the theme setting
 * fetched from Convex via the useSettings hook.
 */
export function ThemeSyncProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();
  const { setTheme } = useTheme();

  useEffect(() => {
    if (settings.theme) {
      console.log(`[ThemeSyncProvider] Syncing next-themes with setting: ${settings.theme}`);
      setTheme(settings.theme);
    }
  }, [settings.theme, setTheme]);

  // We don't render anything ourselves, just manage the effect
  return <>{children}</>; 
}
