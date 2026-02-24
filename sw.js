/* ============================================================
   TRACKIT! v2.2 — SERVICE WORKER (Cloudflare Pages optimized)
   ============================================================ */

const CACHE_NAME = 'trackit-v2.2';

const SHELL = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Mono:wght@300;400;500&family=Manrope:wght@300;400;500;600;700&display=swap'
];

/* ── Install: pre-cache app shell ── */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.allSettled(
        SHELL.map(url =>
          cache.add(url).catch(err => console.warn('[SW] Could not cache:', url, err))
        )
      );
    }).then(() => self.skipWaiting())
  );
});

/* ── Activate: delete old caches ── */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

/* ── Fetch: cache-first with background update ── */
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  if (e.request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;
  if (url.pathname.includes('cdn-cgi')) return; // skip Cloudflare internals

  const isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  const isOwnFile = url.origin === self.location.origin;

  if (isOwnFile || isFont) {
    e.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        cache.match(e.request).then(cached => {
          const networkFetch = fetch(e.request)
            .then(resp => {
              if (resp.ok) cache.put(e.request, resp.clone());
              return resp;
            })
            .catch(() => null);
          return cached || networkFetch;
        })
      )
    );
    return;
  }

  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
