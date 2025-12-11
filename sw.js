const CACHE_NAME='v1';
const CACHE_DURATION=180000;
const cacheTimes=new Map();

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_NAME));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => e.respondWith(handle(e.request)));

async function handle(request){
  const cache=await caches.open(CACHE_NAME);
  const cached=await cache.match(request);
  if(cached){
    const t=cacheTimes.get(request.url);
    if(t && Date.now()-t<CACHE_DURATION) return cached;
  }
  const r=await fetch(request).catch(()=>cached);
  if(r && request.method==='GET'){
    cache.put(request,r.clone()).catch(()=>{});
    cacheTimes.set(request.url,Date.now());
  }
  return r || cached;
}
