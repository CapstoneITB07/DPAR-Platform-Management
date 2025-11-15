// Update cache version when deploying new builds to force cache refresh
const CACHE_NAME = 'dpar-citizen-cache-v3';
const API_CACHE_NAME = 'dpar-api-cache-v2';
const MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB limit per cache

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

// Helper: Check if a request is a navigation request
function isNavigationRequest(request, url) {
  return request.mode === 'navigate' || 
         (request.method === 'GET' && 
          !url.pathname.includes('/api/') && 
          !url.pathname.includes('/static/') && 
          !url.pathname.includes('/Assets/') &&
          !url.pathname.includes('.') && // No file extensions
          url.pathname !== '/service-worker.js' &&
          (url.pathname === '/' || 
           url.pathname === '/index.html' || 
           url.pathname.startsWith('/citizen') || 
           url.pathname === '/superadmin/login' ||
           url.pathname === ''));
}

// Helper: Check if path is a citizen route
function isCitizenPath(pathname) {
  return pathname === '/' || 
         pathname === '/index.html' || 
         pathname.startsWith('/citizen') || 
         pathname === '';
}

// Helper: Check if path is a login page (public, can be cached)
function isLoginPath(pathname) {
  return pathname === '/' || 
         pathname === '/index.html' || 
         pathname === '/superadmin/login' ||
         pathname === '';
}

// Helper: Get fallback HTML response
function getFallbackHTML() {
  return new Response(
    '<!DOCTYPE html><html><head><meta charset="utf-8"><title>DPAR</title><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><div id="root"></div><script>if("serviceWorker"in navigator){navigator.serviceWorker.ready.then(()=>window.location.reload());}</script></body></html>',
    { headers: { 'Content-Type': 'text/html' } }
  );
}

// Helper: Try to get cached HTML with fallbacks
async function getCachedHTML(request) {
  // Try multiple cache keys
  const cacheKeys = ['/index.html', request.url, '/'];
  
  for (const key of cacheKeys) {
    const cached = await caches.match(key);
    if (cached) return cached;
  }
  
  return null;
}

// Helper: Cache response with size check
async function cacheResponse(cacheName, request, response) {
  try {
    const cache = await caches.open(cacheName);
    
    // Check cache size before adding (basic check)
    const keys = await cache.keys();
    if (keys.length > 100) { // Limit number of entries
      // Remove oldest entries (simple FIFO)
      const oldest = keys.slice(0, 10);
      await Promise.all(oldest.map(key => cache.delete(key)));
    }
    
    await cache.put(request, response);
  } catch (error) {
    console.log('Cache error:', error);
  }
}

// Helper: Handle navigation request with cache-first strategy
// Optimized for immediate response to prevent blank pages on mobile/localhost
function handleNavigationRequest(request) {
  // CRITICAL: Try to respond immediately with cached HTML
  // This prevents blank pages, especially on localhost and when dev tools are open
  const cachePromise = caches.match('/index.html');
  
  // Also try network immediately (for localhost, network might be faster)
  const networkPromise = fetch(request).then(response => {
    if (response && response.status === 200) {
      const responseToCache = response.clone();
      // Cache in background - don't wait
      cacheResponse(CACHE_NAME, request, responseToCache);
      cacheResponse(CACHE_NAME, '/index.html', responseToCache);
      return response;
    }
    return null;
  }).catch(() => null);

  // Race: return whichever is faster (cache or network)
  // This is critical for localhost where network might be faster than cache lookup
  return Promise.race([
    cachePromise.then(cachedHtml => {
      if (cachedHtml) {
        // We have cache - return it immediately
        // Update cache in background if online (stale-while-revalidate)
        networkPromise.then(response => {
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            cacheResponse(CACHE_NAME, request, responseToCache);
            cacheResponse(CACHE_NAME, '/index.html', responseToCache);
          }
        }).catch(() => {});
        return cachedHtml;
      }
      // Cache miss - wait for network
      return networkPromise;
    }),
    networkPromise.then(response => {
      if (response) return response;
      // Network failed - try cache
      return cachePromise;
    })
  ]).then(result => {
    if (result) return result;
    
    // Both cache and network failed - try alternative cache keys
    return getCachedHTML(request).then(cached => {
      if (cached) return cached;
      // Last resort: return fallback HTML
      return getFallbackHTML();
    });
  });
}

// Helper: Create error response
function createErrorResponse(message, status = 503) {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status: status,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

// Helper function to check if a request is for admin, associate, or superadmin pages
function isAdminOrAssociateRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // Exclude login pages from admin/associate blocking (they should be cacheable)
  if (pathname === '/' || pathname === '/superadmin/login' || pathname === '/index.html') {
    return false;
  }
  
  // Check if the request URL itself is for admin, associate, or superadmin pages
  if (pathname.startsWith('/admin') || pathname.startsWith('/associate') || pathname.startsWith('/superadmin')) {
    return true;
  }
  
  // Check the referrer header to see if request came from admin/associate/superadmin pages
  const referrer = request.referrer || '';
  // Exclude login pages from referrer check
  if (referrer.includes('/admin') || referrer.includes('/associate') || 
      (referrer.includes('/superadmin') && !referrer.includes('/superadmin/login'))) {
    return true;
  }
  
  return false;
}

// Helper function to check if a request is for citizen pages
function isCitizenRequest(request) {
  // First check if it's admin/associate/superadmin - if so, it's not citizen
  if (isAdminOrAssociateRequest(request)) {
    return false;
  }
  
  const url = new URL(request.url);
  const pathname = url.pathname;
  const origin = url.origin;
  
  // Check if the request URL itself is for a citizen page
  if (pathname.startsWith('/citizen')) {
    return true;
  }
  
  // Check if request is from citizen subdomain (for cross-origin API requests)
  // This handles requests from citizen.dparvc.com to dparvc.com/api/*
  if (origin.includes('citizen.dparvc.com') || origin.includes('localhost')) {
    // If it's an API request to a cacheable endpoint, it's likely a citizen request
    if (pathname.includes('/api/')) {
      const isCacheableEndpoint = CACHEABLE_API_ENDPOINTS.some(endpoint => pathname.includes(endpoint));
      if (isCacheableEndpoint) {
        return true;
      }
    }
  }
  
  // Check the referrer header to see if request came from a citizen page
  const referrer = request.referrer || '';
  if (referrer.includes('/citizen') || referrer.includes('citizen.dparvc.com')) {
    return true;
  }
  
  // For API requests to public/cacheable endpoints, assume citizen if not admin/associate/superadmin
  // These endpoints are public and used by citizen pages
  if (pathname.includes('/api/')) {
    const isPublicEndpoint = CACHEABLE_API_ENDPOINTS.some(endpoint => pathname.includes(endpoint));
    if (isPublicEndpoint) {
      // Only treat as citizen if not explicitly from admin/associate/superadmin
      return !isAdminOrAssociateRequest(request);
    }
  }
  
  // For navigation requests or initial page load, check if it's login or citizen page
  // (login pages are OK to cache as they're public)
  // Mobile browsers may handle navigation differently, so be more permissive
  const isNavRequest = request.mode === 'navigate' || 
                       (request.method === 'GET' && 
                        !pathname.includes('/api/') && 
                        !pathname.includes('/static/') && 
                        !pathname.includes('/Assets/') &&
                        !pathname.includes('.') && // No file extensions
                        pathname !== '/service-worker.js');
  
  if (isNavRequest && (isCitizenPath(pathname) || isLoginPath(pathname))) {
    return true;
  }
  
  // For static assets (JS, CSS, images) requested from login page, allow caching
  // They might be needed for citizen pages too
  if (!pathname.includes('/api/') && (pathname.startsWith('/static/') || pathname.startsWith('/Assets/'))) {
    // Only block if explicitly from admin/associate/superadmin
    return !isAdminOrAssociateRequest(request);
  }
  
  return false;
}

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
        ).then(() => {
          // Also cache index.html for root, citizen routes, and login pages
          // This ensures offline reload works for all public pages
          return Promise.allSettled([
            cache.add(new Request('/', { cache: 'reload' })).catch(() => {}),
            cache.add(new Request('/citizen', { cache: 'reload' })).catch(() => {}),
            cache.add(new Request('/superadmin/login', { cache: 'reload' })).catch(() => {})
          ]);
        });
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

// Cache and return requests
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  const isApiRequest = url.pathname.includes('/api/');
  const isGetRequest = event.request.method === 'GET';
  const isNavigation = isNavigationRequest(event.request, url);
  const isCitizen = isCitizenRequest(event.request);
  
  // Handle navigation requests FIRST - before any other checks
  // This ensures immediate response for page reloads
  // Critical for mobile browsers and localhost, especially when dev tools are open
  if (isNavigation) {
    // Check if it's a citizen route or login page (either detected or by path)
    if (isCitizen || isCitizenPath(url.pathname) || url.pathname.startsWith('/citizen') || isLoginPath(url.pathname)) {
      // CRITICAL: Always respond, even if service worker isn't fully ready
      // This prevents blank pages on localhost and mobile
      event.respondWith(
        handleNavigationRequest(event.request).catch(error => {
          // If anything fails, try multiple fallback strategies
          console.log('Navigation handler error:', error);
          
          // Try to get cached HTML with multiple keys in parallel
          const cacheKeys = ['/index.html', event.request.url, '/'];
          if (url.pathname === '/superadmin/login') {
            cacheKeys.push('/superadmin/login');
          }
          
          return Promise.race([
            ...cacheKeys.map(key => caches.match(key)),
            // If all cache lookups fail, return fallback immediately
            Promise.resolve(null).then(() => getFallbackHTML())
          ]).then(result => {
            return result || getFallbackHTML();
          });
        })
      );
      return;
    }
    // For non-citizen/login navigation (admin/associate/superadmin dashboard pages), pass through
    event.respondWith(fetch(event.request));
    return;
  }
  
  // For admin, associate, or superadmin routes, bypass service worker (don't use cache)
  // Only allow offline mode for citizen pages
  if (!isCitizen) {
    // For admin/associate/superadmin routes, just pass through to network
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
          const fetchPromise = fetch(event.request, {
            mode: 'cors',
            credentials: 'omit'
          }).then(response => {
            // Check if we received a valid response
            if (response && response.status === 200) {
              // Clone the response because it's a stream and can only be consumed once
              const responseToCache = response.clone();
              
              // Cache CORS responses (type 'cors' or 'basic') - both are cacheable
              cacheResponse(API_CACHE_NAME, event.request, responseToCache);
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
            return createErrorResponse('No internet connection and no cached data available');
          });
        })
      );
      return;
    } else {
      // For other API requests from citizen pages, try network but don't cache
      event.respondWith(
        fetch(event.request).catch(() => {
          // If offline, return a basic error response
          return createErrorResponse('No internet connection');
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
        return createErrorResponse('No internet connection');
      })
    );
    return;
  }

  // Use a cache-first strategy for citizen page static assets (JS, CSS, images, etc.)
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response immediately
        if (response) {
          return response;
        }

        // Cache miss - try to fetch from network
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest, {
          cache: 'no-cache' // Don't use browser cache, always check network
        }).then(
          response => {
            // Check if we received a valid response
            if (!response || response.status !== 200) {
              return response;
            }

            // Cache same-origin (basic) and CORS responses - both are cacheable
            // Opaque responses cannot be cached, but basic and cors can be
            if (response.type === 'basic' || response.type === 'cors') {
              // Clone the response because it's a stream and can only be consumed once
              const responseToCache = response.clone();

              cacheResponse(CACHE_NAME, event.request, responseToCache);
            }

            return response;
          }
        ).catch(error => {
          // Network failed - try to return cached version
          // This is critical for offline functionality
          return caches.match(event.request).then(cached => {
            if (cached) {
              return cached;
            }
            // If no cache and network failed, return error response
            // This prevents the page from breaking completely
            return new Response('Network error and no cached version available', {
              status: 408,
              statusText: 'Request Timeout',
              headers: { 'Content-Type': 'text/plain' }
            });
          });
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
