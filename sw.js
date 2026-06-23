// sw.js — complete version with offline.html fallback

// ────────────────────────────────────────────────
//  CONSTANTS — must be at the top level
// ────────────────────────────────────────────────
const CACHE_NAME   = 'fastme-v2';
const OFFLINE_PAGE = '/offline.html';

// Optional: list of files to pre-cache during install
// (at minimum include offline.html — add more for better offline shell)
const PRECACHE_URLS = [
  OFFLINE_PAGE,
  // Uncomment / add more static assets you want available offline immediately
   '/',
  '/provider/chat_list.html',
   '/provider/provider.html',
   '/provider/profile.html',
  '/provider/news.html',
  '/provider/chat.html',
  '/user/user-dashboard.html',
  '/user/user_chat.html',
  '/user/user_profile.html',
  '/user/user_news.html',
  'auth/signup.html',
  'authlogin.html'
];

// ────────────────────────────────────────────────
// INSTALL — pre-cache important files
// ────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Pre-caching offline page and shell assets');
        return cache.addAll(PRECACHE_URLS)
          .catch(err => {
            console.warn('[SW] Some precache items failed:', err);
          });
      })
      .then(() => self.skipWaiting())
  );
});

// ────────────────────────────────────────────────
// ACTIVATE — clean up old caches
// ────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME)
                  .map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// ────────────────────────────────────────────────
// FETCH — the handler you already have, now with constants available
// ────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET requests (POST, PUT, etc.)
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Domains we treat as "network only" (no caching / heavy interception)
  const noCacheDomains = [
    'supabase.co',
    'mixkit.co',
    'nominatim.openstreetmap.org',
    'photon.komoot.io',
    'ui-avatars.com',
    'basemaps.cartocdn.com',
    'tile.openstreetmap.org',
    'placehold.co',
    'googleapis.com',
  ];

  const isExternalNoCache = noCacheDomains.some(domain => url.hostname.includes(domain));

  // ────────────────────────────────────────────────
  // 1. Navigation requests (HTML page loads / refreshes)
  //    Strategy: Network first → fallback to cached offline.html
  // ────────────────────────────────────────────────
if (request.destination === 'document') {
  event.respondWith(
    (async () => {
      try {
        const networkResponse = await fetch(request);
        return networkResponse;
      } catch (err) {
        console.warn('[SW] Navigation failed → fallback to app shell');

        const cache = await caches.open(CACHE_NAME);

        // Try to return a real page from your app
        return (
          await cache.match('/user/user-dashboard.html') ||
          await cache.match('/provider/provider.html') ||
          await cache.match(OFFLINE_PAGE)
        );
      }
    })()
  );
  return;
}

  // ────────────────────────────────────────────────
  // 2. External domains we don't want to cache
  // ────────────────────────────────────────────────
  if (isExternalNoCache) {
    event.respondWith(
      fetch(request).catch(() => {
        console.warn('[SW] External resource failed (no cache):', url.href);
        return new Response('Offline – this resource is not available without internet', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/plain' }
        });
      })
    );
    return;
  }

  // ────────────────────────────────────────────────
  // 3. Everything else (your own JS, CSS, images, etc.)
  //    Cache-first + network fallback + update cache
  // ────────────────────────────────────────────────
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          console.log('[SW] Cache hit:', request.url);
          return cachedResponse;
        }

        return fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              console.log('[SW] Caching new response:', request.url);
              const responseToCache = networkResponse.clone();
              cache.put(request, responseToCache).catch(err => {
                console.warn('[SW] Failed to cache:', err);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            console.warn('[SW] Network failed for:', request.url);
            return new Response('This resource is unavailable while offline', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      });
    })
  );
});

// ────────────────────────────────────────────────
// (add your push, notificationclick, sync, message handlers here if any)
// ────────────────────────────────────────────────
// ────────────────────────────────────────────────
// PUSH NOTIFICATIONS
// ────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  const options = {
    icon: '/images/icon-192x192.png',
    badge: '/images/icon-96x96.png',
    requireInteraction: false,
    actions: [
      {
        action: 'open',
        title: 'Open'
      },
      {
        action: 'close',
        title: 'Close'
      }
    ]
  };

  let notificationData = {};

  try {
    if (event.data) {
      notificationData = event.data.json();
    }
  } catch (e) {
    notificationData = {
      title: event.data ? event.data.text() : 'Fastme Notification',
      body: 'You have a new notification'
    };
  }

  const title = notificationData.title || 'Fastme';
  const opts = { ...options, ...notificationData };

  event.waitUntil(
    self.registration.showNotification(title, opts)
  );
});

// ────────────────────────────────────────────────
// NOTIFICATION CLICK
// ────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(url) && 'focus' in client) {
            return client.focus();
          }
        }
        return clients.openWindow(url);
      })
  );
});

// ────────────────────────────────────────────────
// NOTIFICATION CLOSE
// ────────────────────────────────────────────────
self.addEventListener('notificationclose', (event) => {
  const notificationData = event.notification.data || {};
  console.log('[SW] Notification dismissed:', notificationData);
});

// ────────────────────────────────────────────────
// BACKGROUND SYNC (for offline requests)
// ────────────────────────────────────────────────
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);

  if (event.tag === 'sync-pending-messages') {
    event.waitUntil(syncPendingMessages());
  } else if (event.tag === 'sync-pending-requests') {
    event.waitUntil(syncPendingRequests());
  }
});

async function syncPendingMessages() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const requests = await cache.keys();
    
    // Find pending message requests
    const pendingMessages = requests.filter(req => 
      req.url.includes('/chat') && req.method === 'POST'
    );

    console.log('[SW] Syncing pending messages:', pendingMessages.length);
    
    for (const request of pendingMessages) {
      try {
        await fetch(request.clone());
        await cache.delete(request);
      } catch (err) {
        console.warn('[SW] Failed to sync message:', err);
      }
    }
  } catch (err) {
    console.error('[SW] Sync failed:', err);
    throw err;
  }
}

async function syncPendingRequests() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const requests = await cache.keys();
    
    // Find pending booking requests
    const pendingRequests = requests.filter(req => 
      req.url.includes('/bookings') && req.method === 'POST'
    );

    console.log('[SW] Syncing pending requests:', pendingRequests.length);
    
    for (const request of pendingRequests) {
      try {
        await fetch(request.clone());
        await cache.delete(request);
      } catch (err) {
        console.warn('[SW] Failed to sync request:', err);
      }
    }
  } catch (err) {
    console.error('[SW] Sync failed:', err);
    throw err;
  }
}

// ────────────────────────────────────────────────
// MESSAGE HANDLER (for client communication)
// ────────────────────────────────────────────────
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;

  console.log('[SW] Message received:', type, payload);

  if (type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.delete(CACHE_NAME).then(() => {
        console.log('[SW] Cache cleared');
        event.ports[0].postMessage({ success: true });
      })
    );
  } else if (type === 'GET_CACHE_SIZE') {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        cache.keys().then((keys) => {
          event.ports[0].postMessage({ count: keys.length });
        });
      })
    );
  }
});

self.addEventListener("notificationclick", function(event) {

  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: "window" }).then(function(clientList) {

      if (clientList.length > 0) {
        return clientList[0].focus();
      }

      return clients.openWindow("/");
    })
  );

});

// /sw.js - Firebase Service Worker
// ==================== FIREBASE MESSAGING SERVICE WORKER ====================
// ================= FIREBASE (ONLY ONCE) =================
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDQY_NSthcHARv0S9rkAAikP0leF9Kl29k",
  authDomain: "contribution-c5309.firebaseapp.com",
  projectId: "contribution-c5309",
  messagingSenderId: "800641687170",
  appId: "1:800641687170:web:36e0e50bdd8cf39844de9b"
});

const messaging = firebase.messaging();

// ✅ BACKGROUND NOTIFICATION (THIS IS THE MAIN ONE)
messaging.onBackgroundMessage((payload) => {
  console.log('📩 Background message:', payload);

  const title = payload.notification?.title || "Fastme";
  const body  = payload.notification?.body || payload.data?.message || "";

  self.registration.showNotification(title, {
    body: body,
    icon: "/logo.jpg",
    badge: "/logo.jpg",
    vibrate: [200, 100, 200],
    requireInteraction: true,
    data: {
      url: payload.data?.url || "/provider/provider.html"
    }
  });
});