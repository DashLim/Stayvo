import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CHECKIN_ALLOW_GUEST_VIDEO,
  CHECKIN_MAX_CUSTOM_BLOCKS,
  FREE_TIER_MAX_CUSTOM_BLOCKS,
  maxCustomBlocksForCheckIn,
  maxCustomBlocksForTier,
} from '@/lib/host-tier';

test('Check-in custom block cap is the former Pro maximum', () => {
  assert.equal(CHECKIN_MAX_CUSTOM_BLOCKS, 15);
  assert.equal(maxCustomBlocksForCheckIn(), 15);
});

test('maxCustomBlocksForTier ignores billing tier (Check-in entitlements)', () => {
  assert.equal(maxCustomBlocksForTier('free'), CHECKIN_MAX_CUSTOM_BLOCKS);
  assert.equal(maxCustomBlocksForTier('pro'), CHECKIN_MAX_CUSTOM_BLOCKS);
  assert.ok(
    maxCustomBlocksForTier('free') > FREE_TIER_MAX_CUSTOM_BLOCKS,
    'free billing tier still gets full custom block cap'
  );
});

test('guest video is enabled for all Check-in users', () => {
  assert.equal(CHECKIN_ALLOW_GUEST_VIDEO, true);
});
