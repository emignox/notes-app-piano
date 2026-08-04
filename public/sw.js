// Service worker: l'app funziona anche senza rete (in metro, in sala prove).
// I campioni del pianoforte vengono da un CDN: la prima volta che si sentono
// finiscono in cache, così la volta dopo ci sono anche offline.

const VERSION = 'piano-trainer-v3';
const SHELL = `${VERSION}-shell`;
const ASSETS = `${VERSION}-assets`;
const AUDIO = `${VERSION}-audio`;

const SHELL_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then(cache => cache.addAll(SHELL_FILES).catch(() => undefined))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys =>
        Promise.all(keys.filter(k => !k.startsWith(VERSION)).map(k => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (response && (response.ok || response.type === 'opaque')) {
    cache.put(request, response.clone()).catch(() => undefined);
  }
  return response;
}

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Navigazione: rete se c'è, altrimenti la shell dalla cache.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match('/index.html').then(hit => hit ?? Response.error()),
      ),
    );
    return;
  }

  // Campioni audio del CDN.
  if (url.pathname.endsWith('.mp3')) {
    event.respondWith(cacheFirst(request, AUDIO).catch(() => Response.error()));
    return;
  }

  // Bundle e icone dello stesso dominio.
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(request, ASSETS).catch(() => Response.error()));
  }
});
