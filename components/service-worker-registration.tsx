"use client"

import { useEffect } from "react"

/**
 * This component unregisters service workers.
 * 
 * It was originally added to fix issues with Docker and multiple instances
 * impacting localhost ports. If those issues are no longer relevant,
 * this component can be safely removed.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    // Immediately unregister service workers in development
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
          window.location.reload(); // Force reload after unregistration
        }
      } catch (error) {
        console.error('Error unregistering service workers:', error);
      }
    };

    // Execute immediately in development
    if (process.env.NODE_ENV === 'development') {
      unregisterServiceWorkers();
    }
  }, []);

  return null;
}
