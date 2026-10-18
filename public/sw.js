const CACHE_NAME = 'stayvo-v6';
const CACHE_PREFIX = 'stayvo-v';

// Only public, non-personalized content belongs in the offline cache.
const PRECACHE_URLS = ['/offline.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // Never intercept API, auth, or App Router payload requests.
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/_next/data/') ||
    url.pathname.includes('supabase') ||
    url.searchParams.has('_rsc')
  ) {
    return;
  }

  const headers = request.headers;
  if (
    headers.get('rsc') ||
    headers.get('next-router-state-tree') ||
    headers.get('next-router-prefetch') ||
    headers.get('next-router-segment-prefetch') ||
    headers.get('next-hmr-refresh')
  ) {
    return;
  }

  if (url.pathname.startsWith('/_next/') && !url.pathname.startsWith('/_next/static/')) {
    return;
  }

  // Navigations (including dashboard/editor/account/guest-token pages) are network-only.
  // On network failure, show the generic offline page; never persist HTML responses.
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        return (
          (await cache.match('/offline.html')) ||
          new Response('You are offline.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' },
          })
        );
      })
    );
    return;
  }

  // Hashed Next assets and a small allowlist of public app assets are safe to cache.
  const isNextStatic = url.pathname.startsWith('/_next/static/');
  const isPublicStatic =
    url.pathname.startsWith('/icons/') ||
    ['/icon.svg', '/manifest.webmanifest', '/offline.html'].includes(url.pathname);
  if (!isNextStatic && !isPublicStatic) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      if (!isNextStatic) {
        const cached = await cache.match(request);
        if (cached) return cached;
      }

      try {
        const response = await fetch(request);
        if (response.ok) await cache.put(request, response.clone());
        return response;
      } catch (error) {
        if (isNextStatic) {
          const cached = await cache.match(request);
          if (cached) return cached;
        }
        throw error;
      }
    })()
  );
});
