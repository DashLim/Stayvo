import assert from 'node:assert/strict';
import test from 'node:test';
import type { SupabaseClient } from '@supabase/supabase-js';
import { listHostSyncFeeds, syncOneHostFeed } from './host-sync';

function feed(id: string, owner = 'host-a', enabled = true) {
  return {
    id, property_id: `property-${id}`, calendar_name: `Calendar ${id}`,
    feed_url_encrypted: 'private-encrypted-url', source: 'airbnb' as const, enabled,
    properties: { user_id: owner, is_live: false },
  };
}

function clientFor(rows: ReturnType<typeof feed>[], userId: string | null = 'host-a', failQuery = false) {
  let queries = 0;
  const client = {
    auth: { getUser: async () => ({ data: { user: userId ? { id: userId } : null }, error: null }) },
    from(table: string) {
      assert.equal(table, 'property_ical_feeds');
      queries += 1;
      const filters: Array<[string, unknown]> = [];
      const selected = () => rows.filter((row) => filters.every(([key, value]) =>
        key === 'properties.user_id' ? row.properties.user_id === value : row[key as keyof typeof row] === value,
      ));
      const query = {
        select: (_columns: string) => query,
        eq(key: string, value: unknown) { filters.push([key, value]); return query; },
        order: () => query,
        async range(start: number, end: number) {
          return { data: selected().slice(start, end + 1), error: failQuery ? new Error('private DB detail') : null };
        },
        async maybeSingle() {
          return { data: selected()[0] ?? null, error: failQuery ? new Error('private DB detail') : null };
        },
      };
      return query;
    },
  } as unknown as SupabaseClient;
  return { client, queryCount: () => queries };
}

const successfulSync: Parameters<typeof syncOneHostFeed>[2] = async (_client, row) => ({
  feedId: row.id, propertyId: row.property_id, created: 2, extended: 1, expired: 0, skipped: 0,
});

test('Sync All rejects unauthenticated listing and sync before querying feeds', async () => {
  const { client, queryCount } = clientFor([feed('1')], null);
  assert.equal((await listHostSyncFeeds(client)).ok, false);
  assert.equal((await syncOneHostFeed(client, '1', successfulSync)).ok, false);
  assert.equal(queryCount(), 0);
});

test('Sync All lists only own enabled feeds, including drafts, without exposing URLs', async () => {
  const { client } = clientFor([feed('1'), feed('2'), feed('3', 'host-b'), feed('4', 'host-a', false)]);
  assert.deepEqual(await listHostSyncFeeds(client), {
    ok: true, feeds: [{ id: '1', name: 'Calendar 1' }, { id: '2', name: 'Calendar 2' }],
  });
});

test('Sync All lists beyond a single page and handles hosts without enabled feeds', async () => {
  const { client, queryCount } = clientFor(Array.from({ length: 501 }, (_, i) => feed(String(i))));
  const result = await listHostSyncFeeds(client);
  assert.equal(result.ok && result.feeds.length, 501);
  assert.equal(queryCount(), 2);
  assert.deepEqual(await listHostSyncFeeds(clientFor([]).client), { ok: true, feeds: [] });
});

test('per-feed sync rechecks ownership and enabled state before calling reconciliation', async () => {
  const { client } = clientFor([feed('foreign', 'host-b'), feed('disabled', 'host-a', false)]);
  const neverSync: Parameters<typeof syncOneHostFeed>[2] = async () => {
    assert.fail('Unauthorized or disabled feed reached reconciliation');
  };
  for (const id of ['foreign', 'disabled', 'missing']) {
    assert.equal((await syncOneHostFeed(client, id, neverSync)).ok, false);
  }
});

test('per-feed sync reuses reconciliation with the host session and returns counts only', async () => {
  const { client } = clientFor([feed('1')]);
  const result = await syncOneHostFeed(client, '1', async (receivedClient, row, nowIso) => {
    assert.equal(receivedClient, client);
    assert.equal(row.feed_url_encrypted, 'private-encrypted-url');
    assert.ok(Number.isFinite(Date.parse(nowIso)));
    return successfulSync(receivedClient, row, nowIso);
  });
  assert.deepEqual(result, { ok: true, created: 2, updated: 1, expired: 0 });
});

test('per-feed failures return a safe result so the client can continue with remaining feeds', async () => {
  const { client } = clientFor([feed('1')]);
  const failure = await syncOneHostFeed(client, '1', async (c, row, now) => ({
    ...await successfulSync(c, row, now), error: 'private upstream detail',
  }));
  assert.equal(failure.ok, false);
  assert.equal(JSON.stringify(failure).includes('private upstream detail'), false);
  const thrown = await syncOneHostFeed(client, '1', async () => { throw new Error('private exception'); });
  assert.equal(thrown.ok, false);
  assert.equal(JSON.stringify(thrown).includes('private exception'), false);
  assert.equal((await syncOneHostFeed(client, '1', successfulSync)).ok, true);
});

test('database query failures are reported without leaking backend details', async () => {
  const { client } = clientFor([feed('1')], 'host-a', true);
  assert.equal((await listHostSyncFeeds(client)).ok, false);
  assert.equal((await syncOneHostFeed(client, '1', successfulSync)).ok, false);
});
