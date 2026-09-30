import assert from 'node:assert/strict';
import test from 'node:test';
import {
  checkInAccessDeniedMessage,
  hasCheckInAccessForAuthUser,
} from '@/lib/check-in-access';

test('hasCheckInAccessForAuthUser is true for non-empty auth user ids', () => {
  assert.equal(hasCheckInAccessForAuthUser('00000000-0000-4000-8000-000000000001'), true);
});

test('hasCheckInAccessForAuthUser is false without a user id', () => {
  assert.equal(hasCheckInAccessForAuthUser(null), false);
  assert.equal(hasCheckInAccessForAuthUser(undefined), false);
  assert.equal(hasCheckInAccessForAuthUser(''), false);
  assert.equal(hasCheckInAccessForAuthUser('   '), false);
});

test('checkInAccessDeniedMessage is stable copy', () => {
  assert.match(checkInAccessDeniedMessage(), /Sign in/i);
});
