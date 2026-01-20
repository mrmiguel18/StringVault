/* StringVault Service Worker — v2 (Updated branding & asset strategy) */

const CACHE_NAME = "stringvault-v2";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.json",
  "./offline.html",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

// 1. Install Phase: Cache the core UI assets
self.addEventListener("install", (event) => {
  self.skipWaiting(); 
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("StringVault: Caching system assets");
      return cache.addAll(ASSETS);
    })
  );
});

// 2. Activate Phase: Clean up old StringIQ caches to free up device space
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    // This deletes any old caches that don't match "stringvault-v2"
    await Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    );
    // Take control of all open tabs immediately
    await self.clients.claim(); 
    console.log("StringVault: Cache migration complete and active");
  })());
});

// 3. Fetch Phase: Network-first strategy with cache fallback
// Optimized for equipment tracking where data accuracy is priority
self.addEventListener("fetch", (event) => {
  // We only handle GET requests (Firebase handles its own data syncing)
  if (event.request.method !== 'GET') return;

  event.respondWith((async () => {
    try {
      // Try network first for the most up-to-date data
      const networkResponse = await fetch(event.request);
      
      // If network is successful, update the cache with this new version
      if (networkResponse && networkResponse.status === 200) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(event.request, networkResponse.clone());
      }
      
      return networkResponse;
    } catch (error) {
      // If network fails (Offline), check the cache
      const cachedResponse = await caches.match(event.request);
      if (cachedResponse) return cachedResponse;

      // If neither work and it's a page navigation, show offline.html
      if (event.request.mode === "navigate") {
        return caches.match("./offline.html");
      }
      
      return new Response("Offline: Connection lost", { 
        status: 503, 
        statusText: "Service Unavailable" 
      });
    }
  })());
});
