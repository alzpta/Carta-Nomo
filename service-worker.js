/* Service Worker para Carta Nomo (scope: /Carta-Nomo/) */
const VERSION = 'v1.0.1';
const CACHE_NAME = `carta-nomo-${VERSION}`;
const APP_SHELL = [
  '/Carta-Nomo/',
  '/Carta-Nomo/index.html',
  '/Carta-Nomo/app.js',
  '/Carta-Nomo/styles.css',
  '/Carta-Nomo/manifest.json',
  '/Carta-Nomo/icons/icon-192.png',
  '/Carta-Nomo/icons/icon-512.png',
  '/Carta-Nomo/favicon.ico'
];

const ORIGIN_WHITELIST = ['https://firebasestorage.googleapis.com'];
const MAX_CACHE_ITEMS = 60;
const MAX_CACHE_AGE = 30 * 24 * 60 * 60 * 1000; // 30 días

async function enforceCacheLimits(cache) {
  const keys = await cache.keys();
  const now = Date.now();

  await Promise.all(
    keys.map(async (req) => {
      const res = await cache.match(req);
      const date = res?.headers.get('date');
      if (date && now - new Date(date).getTime() > MAX_CACHE_AGE) {
        await cache.delete(req);
      }
    })
  );

  const remaining = await cache.keys();
  while (remaining.length > MAX_CACHE_ITEMS) {
    await cache.delete(remaining.shift());
  }
}

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
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET') return;

  const allowed = url.origin === location.origin || ORIGIN_WHITELIST.includes(url.origin);
  if (!allowed) return;

  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then(async (res) => {
          const copy = res.clone();
          if (
            copy.ok &&
            copy.status === 200 &&
            !/no-store|no-cache/i.test(copy.headers.get('Cache-Control') || '')
          ) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(request, copy);
            enforceCacheLimits(cache);
          }
          return res;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match('/Carta-Nomo/index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then(async (networkRes) => {
          if (
            networkRes &&
            networkRes.status === 200 &&
            !/no-store|no-cache/i.test(networkRes.headers.get('Cache-Control') || '')
          ) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(request, networkRes.clone());
            enforceCacheLimits(cache);
          }
          return networkRes;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
