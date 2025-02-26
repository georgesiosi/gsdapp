"use client"

import { useEffect } from 'react'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Only register service worker in production
      const isProduction = window.location.hostname !== 'localhost' && 
                          !window.location.hostname.includes('127.0.0.1');
      
      if (isProduction) {
        window.addEventListener('load', function() {
          navigator.serviceWorker.register('/sw.js').then(
            function(registration) {
              console.log('ServiceWorker registration successful');
            },
            function(err) {
              console.log('ServiceWorker registration failed: ', err);
            }
          );
        });
      } else {
        // Unregister any existing service workers in development
        navigator.serviceWorker.getRegistrations().then(function(registrations) {
          for(let registration of registrations) {
            registration.unregister();
            console.log('ServiceWorker unregistered for development');
          }
        });
      }
    }
  }, []);

  return null;
}
