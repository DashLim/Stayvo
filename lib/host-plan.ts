import type { SupabaseClient } from '@supabase/supabase-js';

import type { HostTier } from '@/lib/host-tier';

/**
 * Reads the host's billing tier from `host_plan` (Stripe/profile UI).
 * Missing row (e.g. before migration backfill) is treated as Free.
 *
 * Stayvo Check-in feature access does not depend on this value; see lib/host-tier.ts.
 */
export async function getHostTier(
  supabase: Pick<SupabaseClient, 'from'>,
  userId: string
): Promise<HostTier> {
  const { data, error } = await supabase
    .from('host_plan')
    .select('tier')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) return 'free';
  const t = (data as { tier?: string }).tier;
  return t === 'pro' ? 'pro' : 'free';
}
