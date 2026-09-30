/**
 * Stayvo Check-in entitlements: limits and flags for product features.
 * Access is granted by Supabase Auth session (`lib/check-in-access.ts`), not billing tier.
 */

/** Max custom blocks per property for every Check-in user. */
export const CHECKIN_MAX_CUSTOM_BLOCKS = 15;

/** All Check-in users may upload guest videos (size/MIME rules still apply). */
export const CHECKIN_ALLOW_GUEST_VIDEO = true;

/** Custom block limit for property CMS and server validation. */
export function maxCustomBlocksForCheckIn(): number {
  return CHECKIN_MAX_CUSTOM_BLOCKS;
}
