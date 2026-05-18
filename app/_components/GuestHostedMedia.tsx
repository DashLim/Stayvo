'use client';

import GuestUploadedImage from '@/app/_components/GuestUploadedImage';
import {
  guestPropertyMediaPublicUrl,
  isVideoStoragePath,
} from '@/lib/guest-property-media';

/** R2 / Supabase hosted path — image lightbox or inline video for guest portal. */
export default function GuestHostedMedia({
  path,
  guestMediaPublicBase,
}: {
  path: string;
  guestMediaPublicBase?: string | null;
}) {
  const trimmed = path.trim();
  if (!trimmed) return null;

  if (isVideoStoragePath(trimmed)) {
    const url = guestPropertyMediaPublicUrl(trimmed, {
      resolvedPublicBase: guestMediaPublicBase,
    });
    if (!url) return null;

    return (
      <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-black dark:border-white/10">
        <video
          src={url}
          className="aspect-video w-full object-contain"
          controls
          playsInline
          preload="metadata"
        />
      </div>
    );
  }

  return <GuestUploadedImage path={trimmed} guestMediaPublicBase={guestMediaPublicBase} />;
}
