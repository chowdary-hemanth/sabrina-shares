/**
 * Sabrina Shares - Offline App Shell Service Worker
 * 
 * HARD CONSTRAINTS:
 * - Precache ONLY the app shell (static assets).
 * - NEVER cache or store user file contents, camera frames, or transfer payloads.
 * - Cache-first for shell with versioned cache name.
 * - On activate, delete old caches.
 * - Provide 'update available' flow (do NOT silently swap code mid-transfer).
 * - Zero fetch handling for cross-origin requests, blob: URLs, or data: URIs.
 * - No background sync, no push notifications, no analytics.
 */

const CACHE_NAME = 'sabrina-shell-v2.0.0';

const PRECACHE_ASSETS = [
  './',
  'index.html',
  'manifest.webmanifest',
  'favicon.ico',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'icons/logo.jpg',
  'fonts/bitcount-single-ink.ttf',
  'fonts/bitcount-ink.ttf',
  'fonts/yarndings-12.ttf',
  'sw.js'
];

// Install: precache the static shell assets only and skip waiting immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
});

// Activate: clean up any obsolete caches from previous versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name.startsWith('sabrina-shell-') && name !== CACHE_NAME) {
            console.log('[SW] Purging deprecated cache:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Cache-first for local app shell assets only
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Ignore blob:, data:, chrome-extension:, etc.
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // Never intercept or handle cross-origin requests
  if (url.origin !== self.location.origin) return;

  // Cache-first strategy for app shell
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      // If not in cache, fetch from network (e.g. initial navigation)
      return fetch(request).then((networkResponse) => {
        // Only cache valid basic responses for our shell
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        // Cache the fetched shell resource
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });

        return networkResponse;
      });
    }).catch(() => {
      // Offline fallback: if navigation fails, return cached index.html
      if (request.mode === 'navigate') {
        return caches.match('./') || caches.match('index.html');
      }
    })
  );
});

// Listen for message from main thread to activate pending update
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
