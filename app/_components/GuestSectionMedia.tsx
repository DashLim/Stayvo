'use client';

import DriveMediaEmbed from '@/app/_components/DriveMediaEmbed';
import GuestHostedMedia from '@/app/_components/GuestHostedMedia';

/**
 * Prefers Supabase-hosted guest images; falls back to legacy Google Drive URL when present.
 */
export default function GuestSectionMedia({
  guestImagePath,
  driveMediaUrl,
  guestMediaPublicBase,
}: {
  guestImagePath?: string | null;
  driveMediaUrl?: string | null;
  guestMediaPublicBase?: string | null;
}) {
  const p = (guestImagePath ?? '').trim();
  if (p) return <GuestHostedMedia path={p} guestMediaPublicBase={guestMediaPublicBase} />;
  const d = (driveMediaUrl ?? '').trim();
  if (d) return <DriveMediaEmbed url={d} />;
  return null;
}
