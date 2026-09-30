import type { SupabaseClient } from '@supabase/supabase-js';

import type { HostTier } from '@/lib/host-tier';

/**
 * Reads legacy Stripe billing tier from `host_plan` (Profile → Plan, Stripe webhooks).
 * Missing row is treated as Free. **Not** used for Stayvo Check-in product access.
 *
 * @see lib/check-in-access.ts — who may use Check-in
 * @see lib/host-tier.ts — Check-in feature limits (not tier-gated)
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
