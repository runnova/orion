const CACHE_NAME='v1';
const CACHE_DURATION=180000;
const cacheTimes=new Map();

self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE_NAME)));

self.addEventListener('fetch',e=>{
  e.respondWith(handle(e.request));
});

async function handle(request){
  const cache=await caches.open(CACHE_NAME);
  const cached=await cache.match(request);
  if(cached){
    const t=cacheTimes.get(request.url);
    if(t && Date.now()-t<CACHE_DURATION) return cached;
  }
  const r=await fetch(request).catch(()=>cached);
  if(r){
    cache.put(request,r.clone());
    cacheTimes.set(request.url,Date.now());
    return r;
  }
  return cached;
}

async function clearCache(){
  const keys=await caches.keys();
  for(const k of keys) await caches.delete(k);
  cacheTimes.clear();
}
