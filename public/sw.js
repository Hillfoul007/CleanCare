const CACHE_NAME = "cleancare-v2";
const urlsToCache = ["/", "/manifest.json"];

// Install service worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache");
      return cache.addAll(urlsToCache);
    }),
  );
  self.skipWaiting(); // Force the waiting service worker to become active
});

// Activate service worker
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
  self.clients.claim(); // Take control of all pages
});

// Fetch event
self.addEventListener("fetch", (event) => {
  // Skip chrome-extension requests and other non-http requests
  if (!event.request.url.startsWith("http")) {
    return;
  }

  // Don't cache API requests
  if (event.request.url.includes("/api/")) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch from network
      return (
        response ||
        fetch(event.request).catch(() => {
          // Return a default response for failed fetches
          return new Response("Resource not available", {
            status: 503,
            statusText: "Service Unavailable",
          });
        })
      );
    }),
  );
});

// Push event handler
self.addEventListener("push", (event) => {
  console.log("Push event received:", event);

  const options = {
    body: event.data
      ? event.data.text()
      : "New notification from CleanCare Pro",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: "view",
        title: "View Details",
        icon: "/icons/icon-72x72.png",
      },
      {
        action: "close",
        title: "Close",
        icon: "/icons/icon-72x72.png",
      },
    ],
  };

  event.waitUntil(self.registration.showNotification("CleanCare Pro", options));
});

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  console.log("Notification click received.");

  event.notification.close();

  if (event.action === "view") {
    event.waitUntil(clients.openWindow("/"));
  }
});

// Background sync
self.addEventListener("sync", (event) => {
  if (event.tag === "background-sync") {
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  // Handle background sync tasks
  return Promise.resolve();
}
