"use client"

import { useEffect } from "react"

/**
 * This component has been modified to always unregister service workers
 * since we've determined they're no longer needed.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    // Always unregister service workers
    const unregisterServiceWorkers = async () => {
      if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
        return;
      }

      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        if (registrations.length > 0) {
          console.log('Unregistering', registrations.length, 'service workers...');
          await Promise.all(registrations.map(r => r.unregister()));
          console.log('Service workers unregistered');
        }
      } catch (error) {
        console.error('Error unregistering service workers:', error);
      }
    };

    // Always execute regardless of environment
    unregisterServiceWorkers();
  }, []);

  return null;
}
