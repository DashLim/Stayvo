export type HostTier = 'free' | 'pro';

/**
 * Stayvo Check-in entitlements: limits and flags for product features.
 * Access is granted by Supabase Auth session (`lib/check-in-access.ts`), not by Free/Pro billing.
 * {@link getHostTier} in lib/host-plan.ts is legacy Stripe billing only.
 */

/** Max custom blocks per property for every Check-in user (former Pro cap). */
export const CHECKIN_MAX_CUSTOM_BLOCKS = 15;

/** All Check-in users may upload guest videos (size/MIME rules still apply). */
export const CHECKIN_ALLOW_GUEST_VIDEO = true;

/** @deprecated Legacy Free tier cap — not used for Check-in feature access. */
export const FREE_TIER_MAX_PROPERTIES = 3;

/** @deprecated Legacy Free tier cap — not used for Check-in feature access. */
export const FREE_TIER_MAX_CUSTOM_BLOCKS = 3;

/** @deprecated Alias of {@link CHECKIN_MAX_CUSTOM_BLOCKS}. */
export const PRO_TIER_MAX_CUSTOM_BLOCKS = CHECKIN_MAX_CUSTOM_BLOCKS;

/** Billing tier helper — not for Check-in feature gates. */
export function isProTier(tier: HostTier): boolean {
  return tier === 'pro';
}

/** Custom block limit for property CMS and server validation. */
export function maxCustomBlocksForCheckIn(): number {
  return CHECKIN_MAX_CUSTOM_BLOCKS;
}

/**
 * @deprecated Tier no longer affects Check-in entitlements; use {@link maxCustomBlocksForCheckIn}.
 */
export function maxCustomBlocksForTier(_tier?: HostTier): number {
  return CHECKIN_MAX_CUSTOM_BLOCKS;
}
