import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CHECKIN_ALLOW_GUEST_VIDEO,
  CHECKIN_MAX_CUSTOM_BLOCKS,
  maxCustomBlocksForCheckIn,
} from '@/lib/host-tier';

test('Check-in custom block cap', () => {
  assert.equal(CHECKIN_MAX_CUSTOM_BLOCKS, 15);
  assert.equal(maxCustomBlocksForCheckIn(), 15);
});

test('guest video is enabled for all Check-in users', () => {
  assert.equal(CHECKIN_ALLOW_GUEST_VIDEO, true);
});
