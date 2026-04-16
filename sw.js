const CACHE_NAME = 'v2';
const CACHE_DURATION = 600000;
const cacheTimes = new Map();

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_NAME));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', e => {
  e.respondWith(handle(e.request));
});

async function handle(request) {
  const url = new URL(request.url);

  const isImage = request.destination === 'image';
  const isRotur =
    url.hostname === 'rotur.dev' || url.hostname.endsWith('.rotur.dev');

  if (!isImage || !isRotur || request.method !== 'GET') {
    return fetch(request).catch(() => caches.match(request));
  }

  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  if (cached) {
    const t = cacheTimes.get(request.url);
    if (t && Date.now() - t < CACHE_DURATION) return cached;
  }

  const response = await fetch(request).catch(() => cached);

  if (response) {
    cache.put(request, response.clone()).catch(() => {});
    cacheTimes.set(request.url, Date.now());
  }

  return response || cached;
}