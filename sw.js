// Pixlings PWA: cache the app shell, prefer fresh responses, and work offline.
// Never cache API data or treat the HTML shell as JavaScript, images or JSON.
const CACHE = 'pixlings-v3';
const SHELL = [
  '/', '/index.html', '/manifest.webmanifest',
  '/js/icons.js', '/js/animals.js', '/js/sprites.js', '/js/audio.js',
  '/js/minigames.js', '/js/mockApi.js', '/js/app.js',
  '/assets/sprites/manifest.json',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith('pixlings-') && key !== CACHE)
        .map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  event.respondWith(
    fetch(request).then(response => {
      if (response.status === 200) {
        event.waitUntil(caches.open(CACHE)
          .then(cache => cache.put(request, response.clone()))
          .catch(() => {}));
      }
      return response;
    }).catch(async () => {
      const cache = await caches.open(CACHE);
      const hit = await cache.match(request);
      if (hit) return hit;
      if (request.mode === 'navigate') return (await cache.match('/')) || Response.error();
      return Response.error();
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clients => clients.length ? clients[0].focus() : self.clients.openWindow('/'))
  );
});
