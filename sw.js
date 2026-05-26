const CACHE = 'golf-score-v1';
const ASSETS = ['./', './index.html'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (!e.request.url.startsWith('http')) return;
  // Network-first for external API calls
  const isExternal = ['corsproxy', 'overpass-api', 'golfdigest', 'nominatim'].some(s => e.request.url.includes(s));
  if (isExternal) {
    e.respondWith(fetch(e.request, { signal: AbortSignal.timeout(8000) }).catch(() => new Response('', { status: 503 })));
    return;
  }
  // Cache-first for app files
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      });
    })
  );
});
