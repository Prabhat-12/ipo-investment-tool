// VERSION: 3 — Network-First strategy. Bump this number to force cache purge.
const CACHE_NAME = 'divergen-cache-v3';
const STATIC_ASSETS = [
  '/divergen-logo.png',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Install: pre-cache only true static assets (not index.html or JS/CSS bundles)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  // Take control immediately so new SW kicks in without waiting
  self.skipWaiting();
});

// Activate: delete ALL old caches (v1 and any others)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// Fetch: NETWORK-FIRST strategy
// Always try the network first. Only fall back to cache when offline.
// This ensures code changes are visible immediately on normal reload.
self.addEventListener('fetch', (event) => {
  // Pass Supabase API calls straight through — never cache them
  if (event.request.url.includes('supabase.co')) return;
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Cache a copy of successful same-origin responses
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          networkResponse.type === 'basic'
        ) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      })
      .catch(() => {
        // Network failed (offline) — try the cache
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // For navigation requests, serve index.html as a fallback
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      })
  );
});
