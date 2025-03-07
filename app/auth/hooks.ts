// hooks.ts - Custom hooks for managing auth state and legacy license integration
import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import StorageManager from '@/lib/storage';

interface AuthState {
  isAuthenticated: boolean;
  hasLegacyLicense: boolean;
  isLoading: boolean;
  userId: string | null;
}

export function useAuthState(): AuthState {
  const { isLoaded, isSignedIn, user } = useUser();
  const [hasLegacyLicense, setHasLegacyLicense] = useState<boolean>(false);

  useEffect(() => {
    // Check for legacy license in localStorage
    const legacyLicense = StorageManager.get<string>('LICENSE');
    if (legacyLicense) {
      // TODO: Add proper license validation
      setHasLegacyLicense(true);

      // If user is signed in with Clerk, migrate the license
      if (isSignedIn && user) {
        // Store the association between Clerk user and legacy license
        const userData = { ...(user as any) };
        StorageManager.set('USER_PREFERENCES', {
          ...StorageManager.get('USER_PREFERENCES'),
          legacyLicense,
          userId: userData.id
        });
      }
    }
  }, [isSignedIn, user]);

  return {
    isAuthenticated: isSignedIn || hasLegacyLicense,
    hasLegacyLicense,
    isLoading: !isLoaded,
    userId: user?.id || null,
  };
}
