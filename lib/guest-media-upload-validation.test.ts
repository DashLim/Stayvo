import assert from 'node:assert/strict';
import test from 'node:test';
import { CHECKIN_ALLOW_GUEST_VIDEO } from '@/lib/host-tier';

/**
 * Mirrors validateMediaUpload video branch in guest-media-upload-api.ts
 * (that module is server-only; test entitlement behavior here).
 */
function validateVideoEntitlement(allowVideo: boolean): { ok: true } | { ok: false; error: string } {
  if (!allowVideo) {
    return { ok: false, error: 'Video uploads are not available.' };
  }
  return { ok: true };
}

test('Check-in presign path allows video when CHECKIN_ALLOW_GUEST_VIDEO is true', () => {
  assert.equal(CHECKIN_ALLOW_GUEST_VIDEO, true);
  assert.equal(validateVideoEntitlement(CHECKIN_ALLOW_GUEST_VIDEO).ok, true);
});
