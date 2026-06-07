const APP_VERSION = 'v11.5.7';
const CACHE_NAME = `archai-${APP_VERSION}`;
const PRECACHE = [
  '/ARCHAI_v10_8.html',
  '/icons/archai-192.png',
  '/icons/archai-512.png',
  '/manifest.json',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('/api/')) return;

  // The app shell must be network-first so an installed PWA does not stay
  // pinned to an old build label after the local server comes back online.
  const isAppShell = e.request.mode === 'navigate' || e.request.url.includes('/ARCHAI_v10_8.html');
  const request = isAppShell
    ? new Request(e.request.url, { cache: 'no-store', credentials: 'same-origin' })
    : e.request;

  e.respondWith(
    fetch(request)
      .then(resp => {
        const clone = resp.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return resp;
      })
      .catch(() => caches.match(e.request))
  );
});
