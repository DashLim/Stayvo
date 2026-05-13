export type HostTier = 'free' | 'pro';

/** Free plan: max properties per account. */
export const FREE_TIER_MAX_PROPERTIES = 3;

/** Free plan: max custom blocks (non-empty rows) per property. */
export const FREE_TIER_MAX_CUSTOM_BLOCKS = 3;

/** Pro plan: max custom blocks per property (existing app cap). */
export const PRO_TIER_MAX_CUSTOM_BLOCKS = 15;

export function isProTier(tier: HostTier): boolean {
  return tier === 'pro';
}

export function maxCustomBlocksForTier(tier: HostTier): number {
  return tier === 'pro' ? PRO_TIER_MAX_CUSTOM_BLOCKS : FREE_TIER_MAX_CUSTOM_BLOCKS;
}
