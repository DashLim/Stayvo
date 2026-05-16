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

export function stripePriceId(): string | null {
  const id = process.env.STRIPE_PRICE_ID?.trim();
  return id || null;
}

export function webhookSecret(): string | null {
  const s = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  return s || null;
}
