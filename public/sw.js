const CACHE_NAME = "priority-matrix-v1";
const urlsToCache = [
  "/",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/icons/icon-192x192-maskable.png"
];

// Log service worker initialization
console.log("Service Worker initializing");

self.addEventListener("install", (event) => {
  console.log("Service Worker installing");
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log("Service Worker caching app shell");
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error("Service Worker cache failure:", error);
      })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        return fetch(event.request).then(
          (response) => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== "basic") {
              return response;
            }

            // Clone the response as it can only be consumed once
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              })
              .catch(error => {
                console.error("Service Worker cache put failure:", error);
              });

            return response;
          }
        ).catch(error => {
          console.error("Service Worker fetch failure:", error);
          // Optionally return a fallback response here
        });
      })
  );
});

// Clean up old caches
self.addEventListener("activate", (event) => {
  console.log("Service Worker activating");
  const cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log("Service Worker deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).catch(error => {
      console.error("Service Worker activation failure:", error);
    })
  );
});
