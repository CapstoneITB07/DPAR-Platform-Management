const CACHE_NAME = 'dpar-citizen-cache-v1';
const API_CACHE_NAME = 'dpar-api-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png',
  '/Assets/disaster_logo.png',
  // Note: JS/CSS files with hashed names will be cached dynamically when requested
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
        // Try to cache all URLs, but don't fail if some don't exist
        return Promise.allSettled(
          urlsToCache.map(url => {
            return cache.add(new Request(url, { cache: 'reload' })).catch(err => {
              console.log(`Failed to cache ${url}:`, err);
              // Continue even if this file fails
            });
          })
        );
      }),
      caches.open(API_CACHE_NAME).then(cache => {
        // Cache opened
      })
    ]).then(() => {
      // Force the waiting service worker to become the active service worker
      return self.skipWaiting();
    })
  );
});

// Helper function to check if a request is for admin or associate pages
function isAdminOrAssociateRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // Check if the request URL itself is for admin or associate pages
  if (pathname.startsWith('/admin') || pathname.startsWith('/associate')) {
    return true;
  }
  
  // Check the referrer header to see if request came from admin/associate pages
  const referrer = request.referrer || '';
  if (referrer.includes('/admin') || referrer.includes('/associate')) {
    return true;
  }
  
  return false;
}

// Helper function to check if a request is for citizen pages
function isCitizenRequest(request) {
  // First check if it's admin/associate - if so, it's not citizen
  if (isAdminOrAssociateRequest(request)) {
    return false;
  }
  
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // Check if the request URL itself is for a citizen page
  if (pathname.startsWith('/citizen')) {
    return true;
  }
  
  // Check the referrer header to see if request came from a citizen page
  const referrer = request.referrer || '';
  if (referrer.includes('/citizen')) {
    return true;
  }
  
  // For navigation requests or initial page load, check if it's login or citizen page
  // (login page is OK to cache as it's public)
  if (request.mode === 'navigate') {
    return pathname === '/' || pathname === '/index.html' || pathname.startsWith('/citizen');
  }
  
  // For static assets (JS, CSS, images) requested from login page, allow caching
  // They might be needed for citizen pages too
  if (!pathname.includes('/api/') && (pathname.startsWith('/static/') || pathname.startsWith('/Assets/'))) {
    // Only block if explicitly from admin/associate
    return !isAdminOrAssociateRequest(request);
  }
  
  return false;
}

// Cache and return requests
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  const isApiRequest = url.pathname.includes('/api/');
  const isGetRequest = event.request.method === 'GET';
  const isCitizen = isCitizenRequest(event.request);
  
  // For admin or associate routes, bypass service worker (don't use cache)
  // Only allow offline mode for citizen pages
  if (!isCitizen) {
    // For admin/associate routes, just pass through to network
    // If offline, let it fail naturally (no cache fallback)
    event.respondWith(fetch(event.request));
    return;
  }
  
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
      // For other API requests from citizen pages, try network but don't cache
      event.respondWith(
        fetch(event.request).catch(() => {
          // If offline, return a basic error response
          return new Response(
            JSON.stringify({ error: 'No internet connection' }),
            {
              status: 503,
              statusText: 'Service Unavailable',
              headers: { 'Content-Type': 'application/json' }
            }
          );
        })
      );
      return;
    }
  }
  
  // Don't cache non-GET requests (POST, PUT, DELETE, etc.)
  if (!isGetRequest) {
    event.respondWith(
      fetch(event.request).catch(() => {
        // If offline, return a basic error response
        return new Response(
          JSON.stringify({ error: 'No internet connection' }),
          {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'application/json' }
          }
        );
      })
    );
    return;
  }

  // Use a cache-first strategy for citizen page static assets
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
            // Allow 'basic', 'cors', and 'opaque' response types for caching
            if (!response || response.status !== 200) {
              return response;
            }

            // Only cache same-origin responses (basic) to avoid opaque response issues
            if (response.type === 'basic') {
              // Clone the response because it's a stream and can only be consumed once
              const responseToCache = response.clone();

              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
            }

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
    Promise.all([
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheWhitelist.indexOf(cacheName) === -1) {
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all pages immediately
      self.clients.claim()
    ])
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