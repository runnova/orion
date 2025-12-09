const CACHE_NAME = 'v1';
const CACHE_DURATION = 3 * 60 * 1000;
const cacheTimes = new Map();
let activeRequests = 0;
const queue = [];

self.addEventListener('install', e => e.waitUntil(caches.open(CACHE_NAME)));

self.addEventListener('fetch', e => {
  e.respondWith(limitFetch(() => handleFetch(e.request)));
});

async function handleFetch(request) {
  if (request.url.includes('apps/')) return fetch(request);

  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  if (cached) {
    const t = cacheTimes.get(request.url);
    if (t && Date.now() - t < CACHE_DURATION) return cached;
  }

  try {
    const response = await fetch(request);
    cache.put(request, response.clone());
    cacheTimes.set(request.url, Date.now());
    return response;
  } catch {
    return cached || new Response('Offline', {status: 503, statusText: 'Service Unavailable'});
  }
}


function limitFetch(fn) {
  return new Promise((resolve) => {
    const run = async () => {
      activeRequests++;
      try {
        resolve(await fn());
      } finally {
        activeRequests--;
        if (queue.length) queue.shift()();
      }
    };

    if (activeRequests < 2) run();
    else queue.push(run);
  });
}

async function clearCache() {
  const keys = await caches.keys();
  for (const k of keys) await caches.delete(k);
  cacheTimes.clear();
}
