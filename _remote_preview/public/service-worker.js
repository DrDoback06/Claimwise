/* eslint-disable no-restricted-globals */

// Service Worker for Loomwright PWA
// Bump these when you want every installed client to purge its cache on next load.
const CACHE_NAME = 'loomwright-shell-v1';
const RUNTIME_CACHE = 'loomwright-runtime-v1';
const DEPRECATED_CACHE_PREFIXES = ['claimwise-omniscience-', 'claimwise-runtime-'];

// Only precache the shell - hashed assets are handled at runtime
const PRECACHE_ASSETS = [
  '/manifest.json'
];

// Install event - cache minimal shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .catch((err) => {
        console.error('[Service Worker] Cache install failed:', err);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches (including legacy Claimwise names)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((cacheName) => {
            if (cacheName === CACHE_NAME || cacheName === RUNTIME_CACHE) return false;
            return true;
          })
          .map((cacheName) => {
            console.log('[Loomwright SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
      await self.clients.claim();
      // Nudge open tabs to reload once so they pick up the new shell immediately.
      const clientsList = await self.clients.matchAll({ includeUncontrolled: true });
      clientsList.forEach((c) => {
        try { c.postMessage({ type: 'LOOMWRIGHT_UPDATED' }); } catch (_e) {}
      });
    })()
  );
});

// Fetch event - network-first for navigation and JS/CSS, cache-first for other assets
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip API calls
  if (event.request.url.includes('/api/') || event.request.url.includes('/.netlify/')) {
    return;
  }

  // Navigation requests and JS/CSS: network-first so we always get the latest build
  const isNavigation = event.request.mode === 'navigate';
  const isAsset = event.request.url.match(/\.(js|css)$/);

  if (isNavigation || isAsset) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Offline fallback - serve cached version
          return caches.match(event.request).then((cached) => {
            if (cached) return cached;
            // For navigation, fall back to cached index
            if (isNavigation) return caches.match('/');
            return undefined;
          });
        })
    );
    return;
  }

  // Other assets (images, fonts): cache-first
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request)
          .then((response) => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            const responseToCache = response.clone();
            caches.open(RUNTIME_CACHE)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            return undefined;
          });
      })
  );
});

// Message event - handle messages from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
