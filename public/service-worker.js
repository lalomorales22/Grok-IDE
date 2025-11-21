// Grok IDE Service Worker - Phase 5: PWA Implementation
// Version: 1.0.0

const CACHE_NAME = 'grok-ide-v1.0.0';
const RUNTIME_CACHE = 'grok-ide-runtime-v1';
const API_CACHE = 'grok-ide-api-v1';

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/v4',
  '/GrokIDE-v4.html',
  '/css/design-tokens.css',
  '/css/base.css',
  '/css/utilities.css',
  '/css/animations.css',
  '/css/components.css',
  '/css/advanced-components.css',
  '/css/phase3-components.css',
  '/css/phase4-components.css',
  '/themes/metal-gear.css',
  '/themes/cyberpunk.css',
  '/themes/matrix.css',
  '/themes/light.css',
  '/themes/nord.css',
  '/themes/dracula.css',
  '/js/app-v4.js',
  '/js/theme-manager.js',
  '/js/notification-system.js',
  '/js/command-palette.js',
  '/js/settings-manager.js',
  '/js/keyboard-handler.js',
  '/js/monaco-integration.js',
  '/js/ai-streaming.js',
  '/js/conversation-manager.js',
  '/js/search-engine.js',
  '/js/git-integration.js',
  '/js/file-manager-advanced.js',
  '/js/terminal-manager.js',
  '/js/markdown-preview.js',
  '/js/json-formatter.js',
  '/js/code-snippets.js',
  '/js/developer-console.js',
  '/js/api-tester.js',
  '/js/task-manager.js',
  '/js/project-templates.js',
  '/manifest.json'
];

// CDN assets (Monaco Editor, xterm.js, marked.js)
const CDN_ASSETS = [
  'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/loader.js',
  'https://cdn.jsdelivr.net/npm/xterm@5.3.0/css/xterm.min.css',
  'https://cdn.jsdelivr.net/npm/xterm@5.3.0/lib/xterm.min.js',
  'https://cdn.jsdelivr.net/npm/marked@11.0.0/marked.min.js'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS.filter(url => !url.startsWith('http')));
      }),
      caches.open(RUNTIME_CACHE).then((cache) => {
        console.log('[SW] Caching CDN assets');
        return cache.addAll(CDN_ASSETS);
      })
    ]).then(() => {
      console.log('[SW] Service worker installed successfully');
      return self.skipWaiting();
    }).catch((error) => {
      console.error('[SW] Installation failed:', error);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName !== CACHE_NAME &&
                   cacheName !== RUNTIME_CACHE &&
                   cacheName !== API_CACHE;
          })
          .map((cacheName) => {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => {
      console.log('[SW] Service worker activated');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // API requests - network first, cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Static assets - cache first, network fallback
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // CDN assets - cache first
  if (isCDNAsset(url)) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // Default: network first
  event.respondWith(networkFirstStrategy(request));
});

// Cache-first strategy
async function cacheFirstStrategy(request) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      // Return cached version and update in background
      fetchAndCache(request);
      return cachedResponse;
    }

    return await fetchAndCache(request);
  } catch (error) {
    console.error('[SW] Cache-first strategy failed:', error);
    return new Response('Offline - Resource not available', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Network-first strategy
async function networkFirstStrategy(request) {
  try {
    const response = await fetch(request);

    // Cache successful responses
    if (response && response.status === 200) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    // Fallback to cache
    const cache = await caches.open(RUNTIME_CACHE);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/');
    }

    return new Response('Offline - Resource not available', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Helper: Fetch and cache
async function fetchAndCache(request) {
  const response = await fetch(request);

  if (response && response.status === 200) {
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
  }

  return response;
}

// Helper: Check if URL is a static asset
function isStaticAsset(url) {
  return url.pathname.match(/\.(css|js|json|html)$/);
}

// Helper: Check if URL is a CDN asset
function isCDNAsset(url) {
  return url.hostname.includes('cdn.jsdelivr.net') ||
         url.hostname.includes('cdnjs.cloudflare.com') ||
         url.hostname.includes('unpkg.com');
}

// Background sync for AI requests (future enhancement)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-ai-requests') {
    event.waitUntil(syncAIRequests());
  }
});

async function syncAIRequests() {
  // TODO: Implement background sync for queued AI requests
  console.log('[SW] Background sync triggered');
}

// Push notifications (future enhancement)
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Grok IDE';
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    data: data.url || '/'
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data)
  );
});

// Message handler for communication with main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});

console.log('[SW] Service Worker loaded');
