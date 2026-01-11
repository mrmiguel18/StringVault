/* StringVault Service Worker — v1 */

const CACHE_NAME = "stringvault-v1";
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

// 1. Install Phase: Cache the updated assets
self.addEventListener("install", (event) => {
  // Forces the waiting service worker to become the active service worker
  self.skipWaiting(); 
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("StringVault: Caching system assets");
      return cache.addAll(ASSETS);
    })
  );
});

// 2. Activate Phase: Delete OLD StringIQ caches
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    // This deletes any old caches that don't match the current CACHE_NAME
    await Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    );
    // Take control of all pages immediately
    await self.clients.claim(); 
    console.log("StringVault: Cache cleaned and active");
  })());
});

// 3. Fetch Phase: Network-first strategy with cache fallback
self.addEventListener("fetch", (event) => {
  event.respondWith((async () => {
    // Check cache first
    const cached = await caches.match(event.request);
    if (cached) return cached;

    try {
      // If not in cache, try network
      const res = await fetch(event.request);
      
      // If we got a valid response, save it to cache for next time
      if (res && res.status === 200) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(event.request, res.clone());
      }
      
      return res;
    } catch (error) {
      // Offline fallback: If user is offline and trying to navigate
      if (event.request.mode === "navigate") {
        return caches.match("./offline.html");
      }
      return new Response("Network error", { status: 408 });
    }
  })());
});
