import { NextResponse } from 'next/server';
import {
  LEGACY_CHECKOUT_DISABLED_HTTP_STATUS,
  legacyCheckoutDisabledPayload,
} from '@/lib/stripe-legacy-billing';

/**
 * Stayvo Check-in is permanently free. New legacy Stayvo Pro subscriptions are disabled here.
 *
 * Stripe webhook (`/api/webhooks/stripe`) and Customer Portal (`/api/stripe/portal`) remain
 * temporarily for legacy cleanup and transition — intentional until billing infrastructure is removed.
 */
export async function POST() {
  return NextResponse.json(legacyCheckoutDisabledPayload(), {
    status: LEGACY_CHECKOUT_DISABLED_HTTP_STATUS,
  });
}
