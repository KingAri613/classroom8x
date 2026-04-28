const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `classroom8x-${CACHE_VERSION}`;
const RUNTIME_CACHE = `classroom8x-runtime-${CACHE_VERSION}`;

// Resources to cache on install
const PRECACHE_URLS = [
  './',
  './index.html',
  './game-player.html',
  './games.json',
  './manifest.json',
  './favicon.svg',
  './robots.txt',
  './sitemap.xml',
];

// Cache strategies
const CACHEABLE_PATTERNS = {
  // Cache images for 30 days
  images: /\.(png|jpg|jpeg|gif|svg|webp)$/i,
  // Cache scripts for 7 days  
  scripts: /\.(js)$/i,
  // Cache styles for 7 days
  styles: /\.(css)$/i,
  // Cache fonts for 30 days
  fonts: /\.(woff|woff2|ttf|otf|eot)$/i,
};

// Install event - precache essential resources
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Precaching core resources');
      return cache.addAll(PRECACHE_URLS).catch((error) => {
        console.warn('[ServiceWorker] Precache error:', error);
      });
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName.startsWith('classroom8x-') && cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE)
          .map((cacheName) => {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );
  self.clients.claim();
});

// Fetch strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests and non-GET requests
  if (url.origin !== location.origin || request.method !== 'GET') {
    return;
  }

  // Network-first strategy for HTML documents
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fall back to cached version on network error
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || caches.match('./index.html');
          });
        })
    );
    return;
  }

  // Cache-first strategy for static assets
  if (isStaticAsset(request.url)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request)
          .then((response) => {
            if (response && response.status === 200) {
              const responseClone = response.clone();
              caches.open(RUNTIME_CACHE).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return response;
          })
          .catch(() => {
            // Return a fallback response for failed assets
            return new Response('Asset not available', { status: 404 });
          });
      })
    );
    return;
  }

  // Stale-while-revalidate strategy for dynamic content
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request).then((response) => {
        // Update cache with fresh response
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      });

      // Return cached version immediately, or fetch if not cached
      return cachedResponse || fetchPromise;
    })
  );
});

// Helper function to determine if a URL is a static asset
function isStaticAsset(url) {
  const urlPath = url.toLowerCase();
  return (
    CACHEABLE_PATTERNS.images.test(urlPath) ||
    CACHEABLE_PATTERNS.scripts.test(urlPath) ||
    CACHEABLE_PATTERNS.styles.test(urlPath) ||
    CACHEABLE_PATTERNS.fonts.test(urlPath)
  );
}

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
