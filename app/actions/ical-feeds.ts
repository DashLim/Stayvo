'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getServiceRoleSupabase } from '@/lib/supabase/admin';
import { encryptFeedUrl } from '@/lib/ical-feed-crypto';
import { syncPropertyIcalFeed } from '@/lib/ical/sync-feed';
import type { IcalFeedSource } from '@/lib/ical/types';

function normalizeString(value: string | null | undefined) {
  return (value ?? '').trim();
}

function inferSourceFromCalendarName(name: string): IcalFeedSource {
  const n = name.toLowerCase();
  if (n.includes('airbnb')) return 'airbnb';
  if (n.includes('booking')) return 'booking';
  if (n.includes('vrbo')) return 'vrbo';
  return 'other';
}

function isValidHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

async function assertPropertyOwner(propertyId: string, userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('properties')
    .select('id')
    .eq('id', propertyId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error || !data) return false;
  return true;
}

export type IcalFeedStatus = {
  id: string;
  propertyId: string;
  calendarName: string | null;
  source: IcalFeedSource;
  enabled: boolean;
  lastSyncedAt: string | null;
  lastError: string | null;
};

export async function getIcalFeedStatuses(
  propertyId: string
): Promise<{ ok: true; feeds: IcalFeedStatus[] } | { ok: false; error: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return { ok: false, error: 'Unauthorized.' };

  const pid = normalizeString(propertyId);
  if (!pid) return { ok: false, error: 'Property is required.' };
  if (!(await assertPropertyOwner(pid, user.id))) {
    return { ok: false, error: 'Property not found.' };
  }

  const { data: feeds, error } = await supabase
    .from('property_ical_feeds')
    .select('id, property_id, calendar_name, source, enabled, last_synced_at, last_error')
    .eq('property_id', pid)
    .order('created_at', { ascending: false });

  if (error) return { ok: false, error: error.message };
  return {
    ok: true,
    feeds: (feeds ?? []).map((feed) => ({
      id: feed.id as string,
      propertyId: feed.property_id as string,
      calendarName: feed.calendar_name ?? null,
      source: feed.source as IcalFeedSource,
      enabled: Boolean(feed.enabled),
      lastSyncedAt: feed.last_synced_at ?? null,
      lastError: feed.last_error ?? null,
    })),
  };
}

export async function upsertPropertyIcalFeed(input: {
  propertyId: string;
  feedUrl: string;
  calendarName: string;
  feedId?: string;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return { ok: false as const, error: 'Unauthorized.' };

  const propertyId = normalizeString(input.propertyId);
  const feedUrl = normalizeString(input.feedUrl);
  const calendarName = normalizeString(input.calendarName);
  const feedId = normalizeString(input.feedId);
  const source = inferSourceFromCalendarName(calendarName);

  if (!propertyId) return { ok: false as const, error: 'Property is required.' };
  if (!calendarName) return { ok: false as const, error: 'Calendar name is required.' };
  if (!feedUrl) return { ok: false as const, error: 'Calendar URL is required.' };
  if (!isValidHttpUrl(feedUrl)) {
    return { ok: false as const, error: 'Enter a valid http(s) calendar URL.' };
  }
  if (!(await assertPropertyOwner(propertyId, user.id))) {
    return { ok: false as const, error: 'Property not found.' };
  }

  let encrypted: string;
  try {
    encrypted = encryptFeedUrl(feedUrl);
  } catch (e) {
    return {
      ok: false as const,
      error: e instanceof Error ? e.message : 'Could not save calendar URL.',
    };
  }

  const nowIso = new Date().toISOString();
  if (feedId) {
    const { data: existing, error: existingError } = await supabase
      .from('property_ical_feeds')
      .select('id, property_id')
      .eq('id', feedId)
      .maybeSingle();
    if (existingError || !existing) {
      return { ok: false as const, error: 'Calendar feed not found.' };
    }
    if ((existing.property_id as string) !== propertyId) {
      return { ok: false as const, error: 'Calendar feed does not belong to this property.' };
    }
    const { error } = await supabase
      .from('property_ical_feeds')
      .update({
        feed_url_encrypted: encrypted,
        calendar_name: calendarName,
        source,
        enabled: true,
        last_error: null,
        updated_at: nowIso,
      })
      .eq('id', feedId);
    if (error) return { ok: false as const, error: error.message };
  } else {
    const { error } = await supabase.from('property_ical_feeds').insert({
      property_id: propertyId,
      feed_url_encrypted: encrypted,
      calendar_name: calendarName,
      source,
      enabled: true,
      updated_at: nowIso,
    });
    if (error) return { ok: false as const, error: error.message };
  }

  const syncResult = await syncPropertyIcalFeedsForProperty(propertyId);
  revalidatePath('/dashboard');
  revalidatePath(`/properties/${propertyId}/edit`);
  if (!syncResult.ok) {
    return { ok: true as const, syncWarning: syncResult.error };
  }
  return { ok: true as const, sync: syncResult.result };
}

export async function disconnectPropertyIcalFeed(input: {
  propertyId: string;
  feedId: string;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return { ok: false as const, error: 'Unauthorized.' };

  const pid = normalizeString(input.propertyId);
  const feedId = normalizeString(input.feedId);
  if (!pid) return { ok: false as const, error: 'Property is required.' };
  if (!feedId) return { ok: false as const, error: 'Calendar feed is required.' };
  if (!(await assertPropertyOwner(pid, user.id))) {
    return { ok: false as const, error: 'Property not found.' };
  }

  const { data: feed, error: feedError } = await supabase
    .from('property_ical_feeds')
    .select('id, property_id')
    .eq('id', feedId)
    .maybeSingle();
  if (feedError || !feed) return { ok: false as const, error: 'Calendar feed not found.' };
  if ((feed.property_id as string) !== pid) {
    return { ok: false as const, error: 'Calendar feed does not belong to this property.' };
  }

  const { error } = await supabase
    .from('property_ical_feeds')
    .delete()
    .eq('id', feedId);

  if (error) return { ok: false as const, error: error.message };

  revalidatePath('/dashboard');
  revalidatePath(`/properties/${pid}/edit`);
  return { ok: true as const };
}

export async function syncPropertyIcalFeedNow(propertyId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return { ok: false as const, error: 'Unauthorized.' };

  const pid = normalizeString(propertyId);
  if (!pid) return { ok: false as const, error: 'Property is required.' };
  if (!(await assertPropertyOwner(pid, user.id))) {
    return { ok: false as const, error: 'Property not found.' };
  }

  const result = await syncPropertyIcalFeedsForProperty(pid);
  revalidatePath('/dashboard');
  revalidatePath(`/properties/${pid}/edit`);
  return result;
}

function aggregateSyncResults(
  results: Array<{
    created: number;
    extended: number;
    expired: number;
    skipped: number;
    error?: string;
  }>
) {
  return {
    created: results.reduce((sum, r) => sum + r.created, 0),
    extended: results.reduce((sum, r) => sum + r.extended, 0),
    expired: results.reduce((sum, r) => sum + r.expired, 0),
    skipped: results.reduce((sum, r) => sum + r.skipped, 0),
    synced: results.length,
    failed: results.filter((r) => Boolean(r.error)).length,
  };
}

async function syncPropertyIcalFeedsForProperty(propertyId: string) {
  const admin = getServiceRoleSupabase();
  if (!admin) {
    return { ok: false as const, error: 'Server calendar sync is not configured.' };
  }

  const { data: feeds, error } = await admin
    .from('property_ical_feeds')
    .select('id, property_id, feed_url_encrypted, source, enabled')
    .eq('property_id', propertyId)
    .eq('enabled', true)
    .order('created_at', { ascending: true });

  if (error) return { ok: false as const, error: error.message };
  if (!feeds || feeds.length === 0) {
    return { ok: false as const, error: 'No calendars connected for this property.' };
  }

  const nowIso = new Date().toISOString();
  const results = [];
  for (const feed of feeds) {
    results.push(await syncPropertyIcalFeed(admin, feed, nowIso));
  }
  const summary = aggregateSyncResults(results);
  const errors = results
    .map((r) => r.error)
    .filter((e): e is string => Boolean(e));

  if (summary.failed === summary.synced && summary.synced > 0) {
    return { ok: false as const, error: errors[0] ?? 'Calendar sync failed for all feeds.' };
  }

  if (errors.length > 0) {
    return {
      ok: true as const,
      result: summary,
      warning: `Some calendars failed: ${errors[0]}`,
    };
  }

  return { ok: true as const, result: summary };
}
