'use client';

import DriveMediaEmbed from '@/app/_components/DriveMediaEmbed';
import GuestUploadedImage from '@/app/_components/GuestUploadedImage';

/**
 * Prefers Supabase-hosted guest images; falls back to legacy Google Drive URL when present.
 */
export default function GuestSectionMedia({
  guestImagePath,
  driveMediaUrl,
}: {
  guestImagePath?: string | null;
  driveMediaUrl?: string | null;
}) {
  const p = (guestImagePath ?? '').trim();
  if (p) return <GuestUploadedImage path={p} />;
  const d = (driveMediaUrl ?? '').trim();
  if (d) return <DriveMediaEmbed url={d} />;
  return null;
}
