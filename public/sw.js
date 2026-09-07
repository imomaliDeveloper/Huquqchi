const CACHE_NAME = 'huquqchi-v2.6-live';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install Event: Skip waiting immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate Event: Delete ALL old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => caches.delete(key)));
    })
  );
  self.clients.claim();
});

// Fetch Event: Network First strategy (Always fetch fresh code from Render)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Don't cache dynamic API requests or app.js
  if (event.request.url.includes('/api/') || event.request.url.includes('/app.js')) {
    return event.respondWith(fetch(event.request));
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
