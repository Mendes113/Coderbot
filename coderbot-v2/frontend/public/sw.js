// Service Worker for CoderBot PWA
// Temporarily disabled due to conflicts with React dynamic module loading
// const CACHE_NAME = 'coderbot-v1';
const STATIC_CACHE_URLS = [
  '/',
  '/manifest.json',
  '/coderbot.png',
  '/coderbot2.png',
  '/coderbot_colorfull.png',
  '/favicon.ico'
];

// Temporarily disabled - causing conflicts with React dynamic modules
/*
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('Service Worker: Static assets cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Error caching static assets', error);
      })
  );
});
*/

// Temporarily disabled - causing conflicts with React dynamic modules
/*
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated and ready');
        return self.clients.claim();
      })
  );
});
*/

// Temporarily disabled - causing conflicts with React dynamic modules
/*
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // For dynamic JS modules, always fetch from network
  if (isDynamicModule(new URL(event.request.url).pathname)) {
    event.respondWith(
      fetch(event.request)
        .catch((error) => {
          console.error('Service Worker: Failed to load dynamic module', event.request.url, error);
          throw error;
        })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Return cached version if available
        if (cachedResponse) {
          return cachedResponse;
        }

        // Otherwise, fetch from network
        return fetch(event.request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response before caching
            const responseToCache = response.clone();

            // Cache successful responses for future use
            caches.open(CACHE_NAME)
              .then((cache) => {
                // Only cache specific types of requests
                if (shouldCache(event.request)) {
                  cache.put(event.request, responseToCache);
                }
              });

            return response;
          })
          .catch((error) => {
            console.log('Service Worker: Network request failed', error);

            // Return offline page for navigation requests
            if (event.request.destination === 'document') {
              return caches.match('/');
            }

            throw error;
          });
      })
  );
});

// Helper function to determine if a request should be cached
function shouldCache(request) {
  const url = new URL(request.url);

  // Don't cache dynamic JS modules (React lazy loading)
  if (url.pathname.endsWith('.js') && isDynamicModule(url.pathname)) {
    return false;
  }

   // Cache static assets, API responses, and pages
  return (
    request.destination === 'document' ||
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'image' ||
    url.pathname.startsWith('/api/') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.ico')
  );
}

// Check if a JS file is a dynamic module (React lazy loading)
function isDynamicModule(pathname) {
  // Dynamic modules usually have hash-like names with multiple parts and hyphens
  // Examples: Home-BO88QvcT.js, Component-A1B2C3D4.js, etc.
  // But NOT static chunks like: index.js, vendor.js, main.js
  if (!pathname.endsWith('.js')) return false;

  const parts = pathname.split('-');

  // Must have at least 2 parts separated by hyphens
  if (parts.length < 2) return false;

  // Must contain hyphens (dynamic modules usually have them)
  if (!pathname.includes('-')) return false;

  // Exclude common static chunk names
  const staticChunks = ['index', 'vendor', 'main', 'runtime', 'polyfills'];
  const baseName = parts[0].toLowerCase();

  return !staticChunks.includes(baseName);
}

// Handle background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle offline actions when connection is restored
      handleBackgroundSync()
    );
  }
});

async function handleBackgroundSync() {
  // This would handle offline actions like saving chat messages
  // when the connection is restored
  console.log('Service Worker: Handling background sync');

  // Check if we have any offline data to sync
  const offlineData = await getOfflineData();

  if (offlineData.length > 0) {
    // Send offline data to the server
    await syncOfflineData(offlineData);
  }
}

async function getOfflineData() {
  // This would retrieve offline data from IndexedDB
  // For now, return empty array
  return [];
}

// Temporarily disabled - causing conflicts with React dynamic modules
/*
async function syncOfflineData(data) {
  // This would sync offline data with the server
  // For now, just log the data
  console.log('Service Worker: Syncing offline data', data);
}

// Handle push notifications (if implemented)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();

    const options = {
      body: data.body || 'Nova mensagem do CoderBot',
      icon: '/coderbot.png',
      badge: '/coderbot.png',
      tag: data.tag || 'coderbot-notification',
      data: data.url || '/',
      actions: [
        {
          action: 'open',
          title: 'Abrir',
          icon: '/coderbot.png'
        },
        {
          action: 'close',
          title: 'Fechar'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'CoderBot', options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open') {
    const url = event.notification.data || '/';
    event.waitUntil(
      clients.openWindow(url)
    );
  }
});
*/

// Service Worker temporarily disabled to fix React dynamic module loading issues
// The PWA features can be re-enabled once the conflicts are resolved
