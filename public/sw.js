const CACHE_NAME = 'stayvo-v2';

// Static assets to pre-cache on install
const PRECACHE_URLS = ['/', '/dashboard', '/offline.html'];

// ─── Install: pre-cache shell ───────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

// ─── Activate: remove old caches ────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

// ─── Fetch strategy ─────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET, cross-origin, or API/auth requests
  if (
    request.method !== 'GET' ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/_next/data/') ||
    url.pathname.includes('supabase')
  ) {
    return;
  }

  // Next.js chunks under /_next/static must be network-first: cache-first serves stale JS after
  // rebuilds (dev HMR, redeploy) and causes ChunkLoadError when loading route bundles.
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          }
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Other static assets → cache-first
  if (url.pathname.match(/\.(ico|png|svg|webp|jpg|jpeg|woff2?|ttf|css|js)$/)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ??
          fetch(request).then((res) => {
            if (res.ok) {
              const clone = res.clone();
              caches.open(CACHE_NAME).then((c) => c.put(request, clone));
            }
            return res;
          })
      )
    );
    return;
  }

  // HTML navigation → network-first, fall back to cache, then offline page
  event.respondWith(
    fetch(request)
      .then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, clone));
        }
        return res;
      })
      .catch(
        () =>
          caches.match(request) ??
          caches.match('/offline.html') ??
          new Response('You are offline.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' },
          })
      )
  );
});
