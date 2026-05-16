import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';

/** Clear Stripe billing fields when the customer was removed in Stripe Dashboard. */
export async function clearStaleStripeBilling(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  await supabase
    .from('host_plan')
    .update({
      stripe_customer_id: null,
      stripe_subscription_id: null,
      subscription_status: null,
      current_period_end: null,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);
}

export function isMissingStripeCustomerError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'type' in error) {
    const e = error as Stripe.StripeRawError;
    if (e.code === 'resource_missing') {
      const msg = e.message ?? '';
      return msg.includes('No such customer') || e.param === 'customer';
    }
  }
  return error instanceof Error && error.message.includes('No such customer');
}

/** Returns customer id if it still exists in Stripe; otherwise clears DB and returns null. */
export async function resolveStripeCustomerId(
  stripe: Stripe,
  supabase: SupabaseClient,
  userId: string,
  storedId: string | null | undefined
): Promise<string | null> {
  const id = storedId?.trim();
  if (!id) return null;

  try {
    const customer = await stripe.customers.retrieve(id);
    if ('deleted' in customer && customer.deleted) {
      await clearStaleStripeBilling(supabase, userId);
      return null;
    }
    return id;
  } catch (error: unknown) {
    if (isMissingStripeCustomerError(error)) {
      await clearStaleStripeBilling(supabase, userId);
      return null;
    }
    throw error;
  }
}
