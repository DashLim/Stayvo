import assert from 'node:assert/strict';
import test from 'node:test';
import {
  LEGACY_CHECKOUT_DISABLED_ERROR,
  LEGACY_CHECKOUT_DISABLED_HTTP_STATUS,
  legacyCheckoutDisabledPayload,
} from '@/lib/stripe-legacy-billing';

test('legacy checkout disabled uses HTTP 410 and user-facing message', () => {
  assert.equal(LEGACY_CHECKOUT_DISABLED_HTTP_STATUS, 410);
  assert.deepEqual(legacyCheckoutDisabledPayload(), {
    error: LEGACY_CHECKOUT_DISABLED_ERROR,
  });
  assert.match(LEGACY_CHECKOUT_DISABLED_ERROR, /free/i);
  assert.doesNotMatch(LEGACY_CHECKOUT_DISABLED_ERROR, /STRIPE_|sk_|whsec_/);
});
