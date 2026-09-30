/**
 * Legacy Stripe billing wind-down (Stayvo Check-in is permanently free).
 *
 * - New Pro subscription checkout is disabled (`POST /api/stripe/checkout` → 410).
 * - Webhook and Customer Portal routes remain temporarily for legacy subscribers and DB sync.
 */

export const LEGACY_CHECKOUT_DISABLED_HTTP_STATUS = 410;

export const LEGACY_CHECKOUT_DISABLED_ERROR =
  'Stayvo Check-in is free. Legacy subscription checkout is no longer available.';

export type LegacyCheckoutDisabledBody = {
  error: typeof LEGACY_CHECKOUT_DISABLED_ERROR;
};

export function legacyCheckoutDisabledPayload(): LegacyCheckoutDisabledBody {
  return { error: LEGACY_CHECKOUT_DISABLED_ERROR };
}
