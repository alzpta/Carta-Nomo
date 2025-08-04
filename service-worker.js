/* Service Worker para Carta Nomo (scope: /Carta-Nomo/) */
const VERSION = 'v1.0.0';
const CACHE_NAME = `carta-nomo-${VERSION}`;
const APP_SHELL = [
  '/Carta-Nomo/',
  '/Carta-Nomo/index.html',
  '/Carta-Nomo/styles.css',
  '/Carta-Nomo/manifest.json',
  '/Carta-Nomo/icons/icon-192.png',
  '/Carta-Nomo/icons/icon-512.png',
  '/Carta-Nomo/favicon.ico'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((k) => k.startsWith('carta-nomo-') && k !== CACHE_NAME).map((k) => caches.delete(k))
    ))
  );
  self.clients.claim();
});

// Network-first para HTML, SWR para estáticos e imágenes (incluye Firebase Storage)
self.addEventListener('fetch', (event) => {
  const { request } = event; const url = new URL(request.url);
  if (request.method !== 'GET') return;

  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request).then((res) => {
        const copy = res.clone(); if (copy.ok && copy.status === 200) caches.open(CACHE_NAME).then((c) => c.put(request, copy));
        return res;
      }).catch(() => caches.match(request).then((r) => r || caches.match('/Carta-Nomo/index.html')))
    );
    return;
  }

  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request).then((networkRes) => {
          if (networkRes && networkRes.status === 200) caches.open(CACHE_NAME).then((cache) => cache.put(request, networkRes.clone()));
          return networkRes;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request).then((networkRes) => {
        if (networkRes && networkRes.status === 200) caches.open(CACHE_NAME).then((cache) => cache.put(request, networkRes.clone()));
        return networkRes;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
