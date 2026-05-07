'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  guestLinkOpenStatsByLinkId,
  type GuestLinkOpenStats,
} from '@/lib/guest-link-open-stats';

/** Returns open/device aggregates for the caller’s guest links (RLS-enforced). */
export async function getGuestLinkOpenStatsForLinkIds(
  linkIds: string[]
): Promise<Record<string, GuestLinkOpenStats>> {
  if (!linkIds.length) return {};
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return {};

  const { data, error } = await supabase.rpc('get_guest_link_open_stats', {
    p_link_ids: linkIds,
  });
  if (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '[Stayvo] get_guest_link_open_stats failed — apply migration 0013_guest_link_visitor_tracking.sql.',
        error.message
      );
    }
    return {};
  }

  return guestLinkOpenStatsByLinkId(
    (data ?? []) as Array<{
      guest_link_id: string;
      device_count: number;
      total_opens: number | string | bigint;
      last_open_at: string | null;
    }>
  );
}
