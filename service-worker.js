self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('tabla-numeros-v1').then(cache => {
      return cache.addAll([
        './',
        './index.html',
        './style.css',   // si lo tienes en un archivo separado
        './script.js'    // tu código JS
      ]);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
