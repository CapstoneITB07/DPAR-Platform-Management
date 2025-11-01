const CACHE_NAME = 'dpar-citizen-cache-v1';
const API_CACHE_NAME = 'dpar-api-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/static/js/bundle.js',
  '/static/js/main.chunk.js',
  '/static/js/0.chunk.js',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png',
  // Add paths to other static assets like CSS files, images, etc.
  '/Assets/disaster_logo.png',
  // You can add more specific assets for CitizenPage if needed
];

// Citizen API endpoints that should be cached for offline use
const CACHEABLE_API_ENDPOINTS = [
  '/api/training-programs',
  '/api/announcements',
  '/api/associate-groups/public',
];

// Install a service worker
self.addEventListener('install', event => {
  // Perform install steps
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then(cache => {
        return cache.addAll(urlsToCache.map(url => new Request(url, { cache: 'reload' })));
      }),
      caches.open(API_CACHE_NAME).then(cache => {
        // Cache opened
      })
    ]).catch(error => {
      // Cache failed
    })
  );
});

// Cache and return requests
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  const isApiRequest = url.pathname.includes('/api/');
  const isGetRequest = event.request.method === 'GET';
  
  // Handle API requests for citizen endpoints (cache for offline)
  if (isApiRequest && isGetRequest) {
    const shouldCache = CACHEABLE_API_ENDPOINTS.some(endpoint => url.pathname.includes(endpoint));
    
    if (shouldCache) {
      // Use network-first strategy with cache fallback for API requests
      event.respondWith(
        caches.match(event.request).then(cachedResponse => {
          // Always try network first to get fresh data
          const fetchPromise = fetch(event.request).then(response => {
            // Check if we received a valid response
            if (response && response.status === 200) {
              // Clone the response because it's a stream and can only be consumed once
              const responseToCache = response.clone();
              
              caches.open(API_CACHE_NAME).then(cache => {
                cache.put(event.request, responseToCache);
              });
            }
            return response;
          }).catch(() => {
            // Network failed - return null to fall back to cache
            return null;
          });

          // If we have a cached response, use it while waiting for network
          // If network fails, return cached response
          return fetchPromise.then(networkResponse => {
            if (networkResponse) {
              return networkResponse;
            }
            // Network failed, return cached response if available
            if (cachedResponse) {
              return cachedResponse;
            }
            // If no cache, return a basic error response
            return new Response(
              JSON.stringify({ error: 'No internet connection and no cached data available' }),
              {
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'application/json' }
              }
            );
          });
        })
      );
      return;
    } else {
      // For other API requests, don't cache
      event.respondWith(fetch(event.request));
      return;
    }
  }
  
  // Don't cache non-GET requests (POST, PUT, DELETE, etc.)
  if (!isGetRequest) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Use a cache-first strategy for all other requests (static assets)
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request because it's a stream and can only be consumed once
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          response => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response because it's a stream and can only be consumed once
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        ).catch(() => {
          // If fetch fails and it's a static asset, return cached version if available
          return caches.match(event.request);
        });
      })
  );
});

// Update a service worker
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME, API_CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Push notification event handler - match daily-quest format
self.addEventListener('push', event => {
  let notificationData = {
    title: 'DPAR Notification',
    body: 'You have a new notification',
    icon: '/Assets/disaster_logo.png',
    badge: '/Assets/disaster_logo.png',
    data: {
      url: '/'
    }
  };

  if (event.data) {
    try {
      // Parse like daily-quest: expects { message, body, icon } format
      const data = event.data.json();
      
      // Support both formats: daily-quest uses 'message', DPAR might send 'title'
      const title = data.message || data.title || notificationData.title;
      
      notificationData = {
        title: title,
        body: data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        data: data.data || notificationData.data,
        tag: (data.data && data.data.type) || data.tag || 'default',
        requireInteraction: false,
        vibrate: [200, 100, 200]
      };
    } catch (error) {
      // Error parsing push notification data
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      data: notificationData.data,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      vibrate: notificationData.vibrate
    })
  );
});

// Notification click event handler 
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  // Extract URL - support both data structures
  const notificationData = event.notification.data || {};
  const urlToOpen = notificationData.url || notificationData.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(windowClients => {
        // Check if there's already a window open
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          if (client.url === urlToOpen || (urlToOpen !== '/' && client.url.includes(urlToOpen))) {
            if ('focus' in client) {
              return client.focus();
            }
          }
        }
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
}); 