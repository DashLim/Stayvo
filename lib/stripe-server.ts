import 'server-only';
import Stripe from 'stripe';

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  return new Stripe(key, {
    apiVersion: '2025-01-27.acacia',
    typescript: true,
  });
}

export type BillingInterval = 'monthly' | 'annual';

/** @deprecated Prefer {@link stripePriceIdForInterval} with STRIPE_PRICE_ID_MONTHLY. */
export function stripePriceId(): string | null {
  return stripePriceIdForInterval('monthly');
}

export function stripePriceIdForInterval(interval: BillingInterval): string | null {
  if (interval === 'annual') {
    return process.env.STRIPE_PRICE_ID_ANNUAL?.trim() || null;
  }
  return (
    process.env.STRIPE_PRICE_ID_MONTHLY?.trim() ||
    process.env.STRIPE_PRICE_ID?.trim() ||
    null
  );
}

export function webhookSecret(): string | null {
  const s = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  return s || null;
}
