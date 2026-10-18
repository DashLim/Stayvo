import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import test from 'node:test';

type FakeResponse = { body: string; ok: boolean; clone: () => FakeResponse };
type FakeCache = {
  addAll: (urls: string[]) => Promise<void>;
  match: (request: string | { url: string }) => Promise<FakeResponse | undefined>;
  put: (request: string | { url: string }, response: FakeResponse) => Promise<void>;
  entries: Map<string, FakeResponse>;
};

function createWorkerHarness(fetchImpl: (request: unknown) => Promise<FakeResponse>) {
  const listeners = new Map<string, (event: any) => void>();
  const cacheMap = new Map<string, FakeCache>();
  const deleted: string[] = [];
  const keyFor = (request: string | { url: string }) =>
    typeof request === 'string' ? request : new URL(request.url).pathname;
  const caches = {
    async open(name: string) {
      let cache = cacheMap.get(name);
      if (!cache) {
        const entries = new Map<string, FakeResponse>();
        cache = {
          entries,
          async addAll(urls) {
            for (const url of urls) entries.set(url, response(`cached:${url}`));
          },
          async match(request) {
            return entries.get(keyFor(request));
          },
          async put(request, value) {
            entries.set(keyFor(request), value);
          },
        };
        cacheMap.set(name, cache);
      }
      return cache;
    },
    async keys() {
      return [...cacheMap.keys()];
    },
    async delete(name: string) {
      deleted.push(name);
      return cacheMap.delete(name);
    },
  };
  const self = {
    location: { origin: 'https://stayvo.test' },
    clients: { claim: async () => undefined },
    skipWaiting: async () => undefined,
    addEventListener(type: string, listener: (event: any) => void) {
      listeners.set(type, listener);
    },
  };
  const source = readFile(new URL('../public/sw.js', import.meta.url), 'utf8');

  return source.then((code) => {
    runInNewContext(code, {
      self,
      caches,
      fetch: fetchImpl,
      URL,
      Response: class {
        constructor(public body: string, public init: { status?: number; headers?: unknown } = {}) {}
      },
    });
    return { listeners, cacheMap, deleted, caches };
  });
}

function response(body: string): FakeResponse {
  return { body, ok: true, clone() { return response(body); } };
}

function makeRequest(path: string, options: { mode?: string; destination?: string } = {}) {
  return {
    url: `https://stayvo.test${path}`,
    method: 'GET',
    mode: options.mode ?? 'cors',
    destination: options.destination ?? '',
    headers: { get: () => null },
  };
}

test('service worker precaches only offline fallback and removes prior Stayvo caches', async () => {
  const harness = await createWorkerHarness(async () => response('network'));
  const oldCache = await harness.caches.open('stayvo-v5');
  await oldCache.put('/dashboard', response('private dashboard html'));
  await harness.caches.open('unrelated-app-cache');

  let installWait: Promise<unknown> | undefined;
  harness.listeners.get('install')?.({ waitUntil: (promise: Promise<unknown>) => { installWait = promise; } });
  await installWait;
  const current = harness.cacheMap.get('stayvo-v6');
  assert.ok(current);
  assert.deepEqual([...current.entries.keys()], ['/offline.html']);

  let activateWait: Promise<unknown> | undefined;
  harness.listeners.get('activate')?.({ waitUntil: (promise: Promise<unknown>) => { activateWait = promise; } });
  await activateWait;
  assert.deepEqual(harness.deleted, ['stayvo-v5']);
  assert.ok(harness.cacheMap.has('unrelated-app-cache'));
});

test('service worker returns navigations from network without caching private HTML', async () => {
  const harness = await createWorkerHarness(async () => response('network html'));
  const privatePaths = [
    '/dashboard',
    '/dashboard/profile',
    '/properties/123/edit',
    '/stay/private-token',
    '/host/private-token',
  ];

  for (const path of privatePaths) {
    let result: Promise<unknown> | undefined;
    harness.listeners.get('fetch')?.({
      request: makeRequest(path, { mode: 'navigate', destination: 'document' }),
      respondWith: (promise: Promise<unknown>) => { result = promise; },
    });
    assert.equal((await result as FakeResponse).body, 'network html');
  }

  assert.equal(harness.cacheMap.get('stayvo-v6'), undefined);
});

test('service worker caches public static assets and uses generic offline fallback', async () => {
  const harness = await createWorkerHarness(async (request) => {
    if ((request as { url: string }).url.endsWith('/icons/app.png')) return response('public icon');
    throw new Error('offline');
  });
  const cache = await harness.caches.open('stayvo-v6');
  await cache.put('/offline.html', response('offline page'));

  let staticResult: Promise<unknown> | undefined;
  harness.listeners.get('fetch')?.({
    request: makeRequest('/icons/app.png', { destination: 'image' }),
    respondWith: (promise: Promise<unknown>) => { staticResult = promise; },
  });
  assert.equal((await staticResult as FakeResponse).body, 'public icon');
  assert.equal((await cache.match('/icons/app.png'))?.body, 'public icon');

  let offlineResult: Promise<unknown> | undefined;
  harness.listeners.get('fetch')?.({
    request: makeRequest('/dashboard', { mode: 'navigate', destination: 'document' }),
    respondWith: (promise: Promise<unknown>) => { offlineResult = promise; },
  });
  assert.equal((await offlineResult as FakeResponse).body, 'offline page');
  assert.equal((await cache.match('/dashboard')), undefined);
});
