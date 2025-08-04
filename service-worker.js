/* Service Worker para Carta Nomo (scope: BASE_PATH) */
import { BASE_PATH } from './src/config.js';
const VERSION = 'v1.0.0';
const CACHE_NAME = `carta-nomo-${VERSION}`;
const APP_SHELL = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/styles.css`,
  `${BASE_PATH}/manifest.json`,
  `${BASE_PATH}/icons/icon-192.png`,
  `${BASE_PATH}/icons/icon-512.png`,
  `${BASE_PATH}/favicon.ico`
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    try {
      const cache = await caches.open(CACHE_NAME);
      const results = await Promise.allSettled(APP_SHELL.map((url) => cache.add(url)));
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.warn('Failed to precache', APP_SHELL[index], result.reason);
        }
      });
    } catch (err) {
      console.error('Failed to install service worker', err);
    }
  })());
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
      }).catch(() => caches.match(request).then((r) => r || caches.match(`${BASE_PATH}/index.html`)))
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
