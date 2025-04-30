'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function SmoothScrollHandler() {
  const pathname = usePathname();

  useEffect(() => {
    // Extract hash from the window location, as pathname doesn't include it
    const hash = window.location.hash;

    if (hash) {
      // Decode URI component in case hash contains encoded characters
      const targetId = decodeURIComponent(hash.substring(1)); // Remove the leading '#'

      // Add a small delay to ensure the element is rendered
      const timer = setTimeout(() => {
        const element = document.getElementById(targetId);
        if (element) {
          console.log(`Scrolling to element: ${targetId}`); // Debug log
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          console.warn(`Element with ID ${targetId} not found for scrolling.`); // Warning if element not found
        }
      }, 150); // Slightly increased delay for potentially complex layouts

      // Clear timeout if the component unmounts or path changes quickly
      return () => clearTimeout(timer);
    } 
    // Only run scroll logic when hash is present
    // No cleanup needed if there's no hash, or return undefined implicitly

  // Dependency array includes pathname to re-trigger effect on route changes
  // Note: We rely on window.location.hash directly inside the effect, 
  // which reflects the browser's current state after navigation.
  }, [pathname]); 

  // This component doesn't render anything itself
  return null;
}
