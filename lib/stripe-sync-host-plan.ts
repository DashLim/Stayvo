import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';
import type { HostTier } from '@/lib/host-tier';

const PRO_STATUSES = new Set<Stripe.Subscription.Status>([
  'active',
  'trialing',
  'past_due',
  'paused',
]);

export function tierFromSubscriptionStatus(
  status: Stripe.Subscription.Status | string | null | undefined
): HostTier {
  if (!status) return 'free';
  return PRO_STATUSES.has(status as Stripe.Subscription.Status) ? 'pro' : 'free';
}

type UpsertRow = {
  user_id: string;
  tier: HostTier;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string | null;
  current_period_end: string | null;
  updated_at: string;
};

export async function upsertHostPlanFromSubscription(
  admin: SupabaseClient,
  stripeSub: Stripe.Subscription,
  opts?: { userId?: string | null }
): Promise<boolean> {
  const userId = opts?.userId ?? stripeSub.metadata?.supabase_user_id;
  if (!userId?.trim()) {
    return false;
  }

  const customerId =
    typeof stripeSub.customer === 'string'
      ? stripeSub.customer
      : stripeSub.customer?.id ?? null;

  const row: UpsertRow = {
    user_id: userId.trim(),
    tier: tierFromSubscriptionStatus(stripeSub.status),
    stripe_customer_id: customerId,
    stripe_subscription_id: stripeSub.id,
    subscription_status: stripeSub.status,
    current_period_end:
      stripeSub.current_period_end != null
        ? new Date(stripeSub.current_period_end * 1000).toISOString()
        : null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await admin.from('host_plan').upsert(row, { onConflict: 'user_id' });
  return !error;
}

/** After subscription canceled / unpaid — clear active sub references but keep Stripe customer id. */
export async function downgradeHostPlanFree(
  admin: SupabaseClient,
  stripeSubOrId: Stripe.Subscription | string
): Promise<boolean> {
  const subId = typeof stripeSubOrId === 'string' ? stripeSubOrId : stripeSubOrId.id;
  const userId =
    typeof stripeSubOrId !== 'string' ? stripeSubOrId.metadata?.supabase_user_id : undefined;

  if (userId?.trim()) {
    const { error } = await admin
      .from('host_plan')
      .update({
        tier: 'free',
        stripe_subscription_id: null,
        subscription_status: 'canceled',
        current_period_end: null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId.trim());
    if (!error) return true;
  }

  const { error } = await admin
    .from('host_plan')
    .update({
      tier: 'free',
      stripe_subscription_id: null,
      subscription_status: 'canceled',
      current_period_end: null,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subId);
  return !error;
}
