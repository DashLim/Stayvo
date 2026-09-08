import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import { calculateExpiryIso } from '@/lib/guest-link-expiry';
import { decryptFeedUrl } from '@/lib/ical-feed-crypto';
import { generateShortGuestLinkToken, isUniqueViolation } from '@/lib/ical/guest-link-tokens';
import { parseIcalBookings } from '@/lib/ical/parse-events';
import type { IcalFeedSource } from '@/lib/ical/types';

export type PropertyIcalFeedRow = {
  id: string;
  property_id: string;
  feed_url_encrypted: string;
  source: IcalFeedSource;
  enabled: boolean;
};

export type SyncFeedResult = {
  feedId: string;
  propertyId: string;
  created: number;
  extended: number;
  expired: number;
  skipped: number;
  error?: string;
};

const FETCH_TIMEOUT_MS = 25_000;

async function fetchIcsText(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'text/calendar, text/plain, */*' },
      cache: 'no-store',
    });
    if (!res.ok) {
      throw new Error(`Calendar feed returned ${res.status}.`);
    }
    const text = await res.text();
    if (!text.includes('BEGIN:VCALENDAR')) {
      throw new Error('URL did not return a valid iCalendar file.');
    }
    return text;
  } finally {
    clearTimeout(timeout);
  }
}

function checkoutChanged(
  existing: string | null,
  next: string
): boolean {
  if (!existing) return true;
  return existing.slice(0, 10) !== next.slice(0, 10);
}

export async function syncPropertyIcalFeed(
  supabase: SupabaseClient,
  feed: PropertyIcalFeedRow,
  nowIso: string
): Promise<SyncFeedResult> {
  const result: SyncFeedResult = {
    feedId: feed.id,
    propertyId: feed.property_id,
    created: 0,
    extended: 0,
    expired: 0,
    skipped: 0,
  };

  let feedUrl: string;
  try {
    feedUrl = decryptFeedUrl(feed.feed_url_encrypted);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Could not read calendar URL.';
    await supabase
      .from('property_ical_feeds')
      .update({ last_error: msg, updated_at: nowIso })
      .eq('id', feed.id);
    return { ...result, error: msg };
  }

  try {
    const icsText = await fetchIcsText(feedUrl);
    const todayUtc = nowIso.slice(0, 10);
    const bookings = parseIcalBookings(icsText, feed.source, todayUtc);
    const bookingByUid = new Map(bookings.map((b) => [b.uid, b]));

    const { data: existingLinks, error: linksError } = await supabase
      .from('guest_links')
      .select('id, ical_uid, checkout_date, is_permanent, token, guest_name')
      .eq('ical_feed_id', feed.id)
      .eq('link_source', 'ical');

    if (linksError) throw new Error(linksError.message);

    const linkByUid = new Map(
      (existingLinks ?? [])
        .filter((l) => l.ical_uid)
        .map((l) => [l.ical_uid as string, l])
    );

    for (const booking of bookings) {
      const existing = linkByUid.get(booking.uid);
      if (!existing) {
        const expiresAt = calculateExpiryIso(booking.checkoutDate);
        let inserted = false;
        for (let attempt = 0; attempt < 15; attempt++) {
          const token = generateShortGuestLinkToken();
          const { error: insertError } = await supabase.from('guest_links').insert({
            property_id: feed.property_id,
            guest_name: booking.guestName,
            checkout_date: booking.checkoutDate,
            check_in_date: booking.checkInDate,
            expires_at: expiresAt,
            token,
            is_permanent: false,
            link_source: 'ical',
            ical_feed_id: feed.id,
            ical_uid: booking.uid,
          });
          if (!insertError) {
            inserted = true;
            result.created += 1;
            break;
          }
          if (!isUniqueViolation(insertError.message)) {
            throw new Error(insertError.message);
          }
        }
        if (!inserted) {
          result.skipped += 1;
        }
        continue;
      }

      if (existing.is_permanent) {
        result.skipped += 1;
        continue;
      }

      if (checkoutChanged(existing.checkout_date, booking.checkoutDate)) {
        const expiresAt = calculateExpiryIso(booking.checkoutDate);
        const { error: updateError } = await supabase
          .from('guest_links')
          .update({
            checkout_date: booking.checkoutDate,
            check_in_date: booking.checkInDate,
            expires_at: expiresAt,
            guest_name: booking.guestName ?? existing.guest_name,
          })
          .eq('id', existing.id);

        if (updateError) throw new Error(updateError.message);
        result.extended += 1;
      } else {
        result.skipped += 1;
      }
    }

    for (const link of existingLinks ?? []) {
      if (!link.ical_uid) continue;
      if (bookingByUid.has(link.ical_uid)) continue;
      if (link.is_permanent) continue;

      const { error: expireError } = await supabase
        .from('guest_links')
        .update({ expires_at: nowIso })
        .eq('id', link.id);

      if (expireError) throw new Error(expireError.message);
      result.expired += 1;
    }

    await supabase
      .from('property_ical_feeds')
      .update({
        last_synced_at: nowIso,
        last_error: null,
        updated_at: nowIso,
      })
      .eq('id', feed.id);

    return result;
  } catch (e) {
    const msg =
      e instanceof Error
        ? e.name === 'AbortError'
          ? 'Calendar feed timed out.'
          : e.message
        : 'Calendar sync failed.';
    await supabase
      .from('property_ical_feeds')
      .update({ last_error: msg, updated_at: nowIso })
      .eq('id', feed.id);
    return { ...result, error: msg };
  }
}

export async function syncAllEnabledIcalFeeds(
  supabase: SupabaseClient
): Promise<SyncFeedResult[]> {
  const nowIso = new Date().toISOString();
  const { data: feeds, error } = await supabase
    .from('property_ical_feeds')
    .select('id, property_id, feed_url_encrypted, source, enabled')
    .eq('enabled', true);

  if (error) throw new Error(error.message);

  const results: SyncFeedResult[] = [];
  for (const feed of feeds ?? []) {
    results.push(
      await syncPropertyIcalFeed(supabase, feed as PropertyIcalFeedRow, nowIso)
    );
  }
  return results;
}
