"use client"

import { useEffect } from "react"

// Simple helper function that we'll call safely
const unregisterServiceWorkers = async () => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }
  
  try {
    console.log("Unregistering service workers...");
    const registrations = await navigator.serviceWorker.getRegistrations();
    
    console.log("Found", registrations.length, "service worker registrations");
    for (const registration of registrations) {
      await registration.unregister();
      console.log("ServiceWorker unregistered:", registration.scope);
    }
  } catch (error) {
    console.error("Error unregistering service workers:", error);
  }
};

export function ServiceWorkerRegistration() {
  useEffect(() => {
    // Use a small timeout to ensure this doesn't block the main thread
    // or interfere with initial rendering
    const timeoutId = setTimeout(() => {
      unregisterServiceWorkers();
    }, 2000);
    
    return () => clearTimeout(timeoutId);
  }, []);

  return null;
}
