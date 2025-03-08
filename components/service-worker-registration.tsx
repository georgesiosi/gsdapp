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
    // Safely execute in a non-blocking way
    const safelyUnregisterServiceWorkers = () => {
      // Use a small timeout to ensure this doesn't block the main thread
      // or interfere with initial rendering
      setTimeout(() => {
        if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
          return;
        }
        
        // Use Promise-based approach with proper error handling
        navigator.serviceWorker.getRegistrations()
          .then(registrations => {
            if (registrations.length > 0) {
              console.log("Found", registrations.length, "service worker registrations");
              return Promise.all(registrations.map(registration => registration.unregister()));
            }
          })
          .then(results => {
            if (results && results.length > 0) {
              console.log("All service workers unregistered");
            }
          })
          .catch(error => {
            console.error("Error unregistering service workers:", error);
          });
      }, 3000); // Increase timeout to further reduce chances of interfering with initial load
    };

    // Execute the function
    safelyUnregisterServiceWorkers();
    
    // No cleanup needed as we're using a self-contained approach
  }, []);

  return null;
}
