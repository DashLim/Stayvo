import { CHECKIN_MAX_CUSTOM_BLOCKS } from '@/lib/host-tier';

/** Validates custom block count for Stayvo Check-in (not tier-based). */
export function validateCustomBlockCountForCheckIn(
  count: number
): { ok: true } | { ok: false; error: string } {
  if (count > CHECKIN_MAX_CUSTOM_BLOCKS) {
    return {
      ok: false,
      error: `You can have at most ${CHECKIN_MAX_CUSTOM_BLOCKS} custom blocks per property.`,
    };
  }
  return { ok: true };
}
