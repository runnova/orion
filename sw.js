const CACHE_NAME = 'v1';
const CACHE_DURATION = 3 * 60 * 1000;
const cacheTimes = new Map();
const SLOW_THRESHOLD = 3000;

let tokens = 5;
const MAX_TOKENS = 5;
const REFILL_MS = 500;
const MAX_RETRIES = 6;

setInterval(() => {
  if (tokens < MAX_TOKENS) tokens++;
}, REFILL_MS);

self.addEventListener('install', e => e.waitUntil(caches.open(CACHE_NAME)));

self.addEventListener('fetch', e => {
  e.respondWith(rateLimit(() => handleFetch(e.request)));
});

function rateLimit(fn) {
  return new Promise(res => {
    let tries = 0;
    const tryRun = () => {
      if (tokens > 0) {
        tokens--;
        fn().then(res);
      } else if (tries < MAX_RETRIES) {
        tries++;
        setTimeout(tryRun, REFILL_MS);
      } else {
        fn().then(res);
      }
    };
    tryRun();
  });
}

async function handleFetch(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) {
    const t = cacheTimes.get(request.url);
    if (t && Date.now() - t < CACHE_DURATION) return cached;
  }
  const fetchPromise = fetch(request);
  const timeout = new Promise(r => setTimeout(() => r(null), SLOW_THRESHOLD));
  const raceResult = await Promise.race([fetchPromise, timeout]);
  const response = raceResult === null ? await fetchPromise : raceResult;
  cache.put(request, response.clone());
  cacheTimes.set(request.url, Date.now());
  return response;
}

async function clearCache() {
  const keys = await caches.keys();
  for (const k of keys) await caches.delete(k);
  cacheTimes.clear();
}
