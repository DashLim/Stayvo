import assert from 'node:assert/strict';
import test from 'node:test';
import { CHECKIN_MAX_CUSTOM_BLOCKS } from '@/lib/host-tier';
import { validateCustomBlockCountForCheckIn } from '@/lib/check-in-property-limits';

test('validateCustomBlockCountForCheckIn allows more than legacy Free limit', () => {
  assert.equal(validateCustomBlockCountForCheckIn(4).ok, true);
  assert.equal(validateCustomBlockCountForCheckIn(CHECKIN_MAX_CUSTOM_BLOCKS).ok, true);
});

test('validateCustomBlockCountForCheckIn rejects above product maximum', () => {
  const result = validateCustomBlockCountForCheckIn(CHECKIN_MAX_CUSTOM_BLOCKS + 1);
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.error, /15/);
  }
});
