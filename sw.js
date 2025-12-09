const CACHE_NAME = 'v1';
const CACHE_DURATION = 3 * 60 * 1000;
const cacheTimes = new Map();
let activeRequests = 0;
const queue = [];
const MAX_REQUESTS = 10;
const DEFAULT_LIMIT = 2;
const SLOW_THRESHOLD = 3000;

self.addEventListener('install', e => e.waitUntil(caches.open(CACHE_NAME)));

self.addEventListener('fetch', e => {
  e.respondWith(limitFetch(() => handleFetch(e.request)));
});

async function handleFetch(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  if (cached) {
    const t = cacheTimes.get(request.url);
    if (t && Date.now() - t < CACHE_DURATION) return cached;
  }

  const fetchPromise = fetch(request);
  const timeout = new Promise(res => setTimeout(() => res(null), SLOW_THRESHOLD));
  const raceResult = await Promise.race([fetchPromise, timeout]);

  if (raceResult === null) {
    scheduleExtra(); 
    const response = await fetchPromise;
    cache.put(request, response.clone());
    cacheTimes.set(request.url, Date.now());
    return response;
  } else {
    const response = await raceResult;
    cache.put(request, response.clone());
    cacheTimes.set(request.url, Date.now());
    return response;
  }
}

function scheduleExtra() {
  if (activeRequests < MAX_REQUESTS && queue.length) {
    queue.shift()();
  }
}

function limitFetch(fn) {
  return new Promise(resolve => {
    const run = async () => {
      activeRequests++;
      try {
        resolve(await fn());
      } finally {
        activeRequests--;
        if (queue.length) queue.shift()();
      }
    };

    if (activeRequests < DEFAULT_LIMIT) run();
    else queue.push(run);
  });
}

async function clearCache() {
  const keys = await caches.keys();
  for (const k of keys) await caches.delete(k);
  cacheTimes.clear();
}
