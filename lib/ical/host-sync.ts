import type { SupabaseClient } from '@supabase/supabase-js';
import type { PropertyIcalFeedRow, SyncFeedResult } from './sync-feed';

export type HostSyncFeed = { id: string; name: string };
const PAGE_SIZE = 500;

/** The host session/RLS and explicit property owner filter both scope this list. */
export async function listHostSyncFeeds(supabase: SupabaseClient) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { ok: false as const, error: 'Please sign in to sync calendars.' };

  const feeds: HostSyncFeed[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await supabase
      .from('property_ical_feeds')
      .select('id, calendar_name, properties!inner(user_id)')
      .eq('properties.user_id', user.id)
      .eq('enabled', true)
      .order('id', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) return { ok: false as const, error: 'Could not load your calendars. Please try again.' };
    for (const feed of data ?? []) {
      feeds.push({ id: feed.id, name: feed.calendar_name?.trim() || 'Calendar' });
    }
    if ((data?.length ?? 0) < PAGE_SIZE) break;
  }
  return { ok: true as const, feeds };
}

/** One feed per request avoids putting every calendar into one serverless run. */
export async function syncOneHostFeed(
  supabase: SupabaseClient,
  feedId: string,
  syncFeed: (
    client: SupabaseClient,
    feed: PropertyIcalFeedRow,
    nowIso: string,
  ) => Promise<SyncFeedResult>,
) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { ok: false as const, error: 'Please sign in to sync calendars.' };
  if (typeof feedId !== 'string' || !feedId.trim()) {
    return { ok: false as const, error: 'Calendar is required.' };
  }

  // Recheck ownership and enabled state on every request, including a stale list.
  const { data: feed, error } = await supabase
    .from('property_ical_feeds')
    .select('id, property_id, feed_url_encrypted, source, enabled, properties!inner(user_id)')
    .eq('properties.user_id', user.id)
    .eq('enabled', true)
    .eq('id', feedId.trim())
    .maybeSingle();
  if (error || !feed) {
    return { ok: false as const, error: 'Calendar is no longer enabled or available to your account.' };
  }

  try {
    // Use the host session, not the cron/service-role client. Existing RLS applies
    // to every guest-link/feed write made by the reconciliation service.
    const result = await syncFeed(supabase, feed as PropertyIcalFeedRow, new Date().toISOString());
    if (result.error) {
      return { ok: false as const, error: 'Sync failed. Check this calendar in Property Editor.' };
    }
    return {
      ok: true as const,
      created: result.created,
      updated: result.extended,
      expired: result.expired,
    };
  } catch {
    return { ok: false as const, error: 'Could not sync this calendar. Please try again.' };
  }
}
