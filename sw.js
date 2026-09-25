// Permite abrir Calma sin internet. Siempre intenta traer la versión más nueva y, si no hay
// conexión, usa la copia guardada en el teléfono.

const VERSION = 'calma-v1';

const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/app.css',
  './js/app.js',
  './js/audio.js',
  './js/audiolib.js',
  './js/config.js',
  './js/content.js',
  './js/icons.js',
  './js/moon.js',
  './js/store.js',
  './js/ui.js',
  './js/util.js',
  './js/youtube.js',
  './js/views/diario.js',
  './js/views/hoy.js',
  './js/views/juegos.js',
  './js/views/meditar.js',
  './js/views/onboarding.js',
  './js/views/players.js',
  './js/views/retos.js',
  './js/views/yo.js',
  './icons/icon.svg',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // YouTube y otros: siempre desde internet

  // Primero internet (así los cambios publicados llegan solos); si no hay conexión, lo guardado.
  event.respondWith((async () => {
    const cache = await caches.open(VERSION);
    try {
      const res = await Promise.race([
        fetch(req, { cache: 'no-cache' }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('lento')), 4000)),
      ]);
      if (res.ok && res.type === 'basic') cache.put(req, res.clone());
      return res;
    } catch {
      const cached = await cache.match(req, { ignoreSearch: true });
      if (cached) return cached;
      if (req.mode === 'navigate') return (await cache.match('./index.html')) || Response.error();
      return Response.error();
    }
  })());
});
