"use client"

import { useEffect } from "react"

export function ServiceWorkerRegistration() {
  useEffect(() => {
    console.log("ServiceWorkerRegistration component mounted - Service workers disabled");
    
    try {
      if ("serviceWorker" in navigator) {
        console.log("Service Worker API is available - Unregistering all service workers");
        
        // Unregister any existing service workers
        navigator.serviceWorker.getRegistrations().then(function(registrations) {
          console.log("Found", registrations.length, "service worker registrations");
          for(let registration of registrations) {
            registration.unregister();
            console.log("ServiceWorker unregistered:", registration.scope);
          }
        }).catch(function(err) {
          console.error("Error unregistering service workers:", err);
        });
      } else {
        console.log("Service Worker API is not available in this browser");
      }
    } catch (error) {
      console.error("Error in service worker unregistration:", error);
    }
  }, []);

  return null;
}
