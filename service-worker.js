/**
 * Agent Arcades Service Worker
 * Provides offline functionality and caching for the PWA
 */

const CACHE_NAME = 'agent-arcades-v1.0.2';
const STATIC_CACHE = 'static-v1.0.2';
const DYNAMIC_CACHE = 'dynamic-v1.0.2';
const MODEL_CACHE = 'models-v1.0.2';

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/main.css',
  '/css/components.css',
  '/css/node-editor.css',
  '/css/arena.css',
  '/css/responsive.css',
  '/js/app.js',
  '/js/modules/web-llm-integration.js',
  '/js/modules/node-editor.js',
  '/js/modules/agent-engine.js',
  '/js/modules/tournament.js',
  '/js/modules/skill-chips.js',
  '/js/modules/scenarios.js',
  '/js/utils/storage.js',
  '/js/utils/error-handler.js',
  '/js/utils/performance.js',
  '/assets/icons/favicon.svg'
];

// Network-first resources (always try network first)
const NETWORK_FIRST = [
  'https://esm.run/@mlc-ai/web-llm',
  'https://huggingface.co/',
  'https://raw.githubusercontent.com/'
];

// Cache-first resources (try cache first, fallback to network)
const CACHE_FIRST = [
  '/css/',
  '/js/',
  '/assets/',
  'https://fonts.googleapis.com/',
  'https://fonts.gstatic.com/'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Static assets cached');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Service Worker: Failed to cache static assets', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            // Delete old caches
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== MODEL_CACHE) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - handle all network requests
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http requests
  if (!request.url.startsWith('http')) {
    return;
  }
  
  // Handle different types of requests
  if (isModelRequest(request)) {
    event.respondWith(handleModelRequest(request));
  } else if (isNetworkFirst(request)) {
    event.respondWith(networkFirstStrategy(request));
  } else if (isCacheFirst(request)) {
    event.respondWith(cacheFirstStrategy(request));
  } else if (isStaticAsset(request)) {
    event.respondWith(cacheFirstStrategy(request));
  } else {
    event.respondWith(networkFirstStrategy(request));
  }
});

// Strategy: Cache First (for static assets)
async function cacheFirstStrategy(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback to network
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    console.error('Cache-first strategy failed:', error);
    
    // Return offline fallback if available
    if (request.destination === 'document') {
      const offlinePage = await caches.match('/offline.html');
      if (offlinePage) return offlinePage;
    }
    
    // Return a basic offline response
    return new Response('Offline - Content not available', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

// Strategy: Network First (for dynamic content)
async function networkFirstStrategy(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    console.log('Network failed, trying cache:', request.url);
    
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline fallback
    if (request.destination === 'document') {
      const offlinePage = await caches.match('/offline.html');
      if (offlinePage) return offlinePage;
      
      // Generate basic offline HTML
      return new Response(generateOfflineHTML(), {
        headers: { 'Content-Type': 'text/html' }
      });
    }
    
    return new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Strategy: Model Request (for AI models)
async function handleModelRequest(request) {
  try {
    // Check model cache first
    const modelCache = await caches.open(MODEL_CACHE);
    const cachedModel = await modelCache.match(request);
    
    if (cachedModel) {
      console.log('Service Worker: Serving cached model');
      return cachedModel;
    }
    
    // Fetch model from network
    console.log('Service Worker: Fetching model from network');
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache the model for future use
      modelCache.put(request, networkResponse.clone());
      console.log('Service Worker: Model cached');
    }
    
    return networkResponse;
    
  } catch (error) {
    console.error('Model request failed:', error);
    
    // Try to return cached model
    const modelCache = await caches.open(MODEL_CACHE);
    const cachedModel = await modelCache.match(request);
    
    if (cachedModel) {
      return cachedModel;
    }
    
    return new Response('Model unavailable offline', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Helper functions
function isModelRequest(request) {
  return request.url.includes('huggingface.co') ||
         request.url.includes('.wasm') ||
         request.url.includes('.bin') ||
         request.url.includes('model');
}

function isNetworkFirst(request) {
  return NETWORK_FIRST.some(pattern => request.url.includes(pattern));
}

function isCacheFirst(request) {
  return CACHE_FIRST.some(pattern => request.url.includes(pattern));
}

function isStaticAsset(request) {
  return STATIC_ASSETS.some(asset => request.url.endsWith(asset));
}

function generateOfflineHTML() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Agent Arcades - Offline</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 100%);
            color: #ffffff;
            margin: 0;
            padding: 0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .offline-container {
            text-align: center;
            max-width: 500px;
            padding: 2rem;
        }
        .offline-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
        }
        .offline-title {
            font-size: 2rem;
            margin-bottom: 1rem;
            color: #00ff88;
        }
        .offline-message {
            font-size: 1.1rem;
            line-height: 1.6;
            margin-bottom: 2rem;
            color: #b8b8b8;
        }
        .retry-button {
            background: linear-gradient(135deg, #00ff88 0%, #0066ff 100%);
            color: #0f0f1e;
            border: none;
            padding: 1rem 2rem;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s ease;
        }
        .retry-button:hover {
            transform: translateY(-2px);
        }
        .features-list {
            text-align: left;
            margin-top: 2rem;
        }
        .features-list h3 {
            color: #00ff88;
            margin-bottom: 1rem;
        }
        .features-list ul {
            list-style: none;
            padding: 0;
        }
        .features-list li {
            padding: 0.5rem 0;
            color: #b8b8b8;
        }
        .features-list li::before {
            content: "✓ ";
            color: #00ff88;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="offline-container">
        <div class="offline-icon">🤖</div>
        <h1 class="offline-title">Agent Arcades</h1>
        <p class="offline-message">
            You're currently offline, but don't worry! Agent Arcades works completely in your browser.
            Many features are still available without an internet connection.
        </p>
        
        <button class="retry-button" onclick="window.location.reload()">
            Try Again
        </button>
        
        <div class="features-list">
            <h3>Available Offline:</h3>
            <ul>
                <li>Create and edit AI agents</li>
                <li>Run local simulations</li>
                <li>Access your saved agents</li>
                <li>View skill chip collection</li>
                <li>Practice with built-in scenarios</li>
            </ul>
        </div>
    </div>
</body>
</html>
  `.trim();
}

// Background sync for when connection is restored
self.addEventListener('sync', event => {
  console.log('Service Worker: Background sync triggered');
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    // Sync any pending data when connection is restored
    console.log('Service Worker: Performing background sync');
    
    // This would sync with any external services if needed
    // For now, just log that sync is available
    
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Push notifications (for future use)
self.addEventListener('push', event => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/assets/icons/icon-192x192.png',
    badge: '/assets/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: data.data || {},
    actions: data.actions || []
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});

// Message handling from main thread
self.addEventListener('message', event => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CACHE_MODEL':
      event.waitUntil(cacheModel(data.url));
      break;
      
    case 'CLEAR_CACHE':
      event.waitUntil(clearCache(data.cacheName));
      break;
      
    case 'GET_CACHE_SIZE':
      event.waitUntil(getCacheSize().then(size => {
        event.ports[0].postMessage({ type: 'CACHE_SIZE', size });
      }));
      break;
  }
});

async function cacheModel(url) {
  try {
    const cache = await caches.open(MODEL_CACHE);
    await cache.add(url);
    console.log('Service Worker: Model cached manually', url);
  } catch (error) {
    console.error('Service Worker: Failed to cache model', error);
  }
}

async function clearCache(cacheName) {
  try {
    await caches.delete(cacheName);
    console.log('Service Worker: Cache cleared', cacheName);
  } catch (error) {
    console.error('Service Worker: Failed to clear cache', error);
  }
}

async function getCacheSize() {
  try {
    const cacheNames = await caches.keys();
    let totalSize = 0;
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      
      for (const request of requests) {
        const response = await cache.match(request);
        if (response) {
          const blob = await response.blob();
          totalSize += blob.size;
        }
      }
    }
    
    return totalSize;
  } catch (error) {
    console.error('Service Worker: Failed to calculate cache size', error);
    return 0;
  }
}

console.log('Service Worker: Loaded and ready');
