const CACHE_NAME = 'v1';
const CACHE_DURATION = 3 * 60 * 1000;
const cacheTimes = new Map();

self.addEventListener('install', e => e.waitUntil(caches.open(CACHE_NAME)));

self.addEventListener('fetch', e => {
  e.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(e.request);

    if (cached) {
      const t = cacheTimes.get(e.request.url);
      if (t && Date.now() - t < CACHE_DURATION) return cached;
    }

    try {
      const response = await fetch(e.request);
      cache.put(e.request, response.clone());
      cacheTimes.set(e.request.url, Date.now());
      return response;
    } catch (err) {
      return cached || new Response('Offline', {status: 503, statusText: 'Service Unavailable'});
    }
  })());
});

async function clearCache() {
  const keys = await caches.keys();
  for (const k of keys) await caches.delete(k);
  cacheTimes.clear();
}
