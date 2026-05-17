'use client';

import { removeGuestPropertyMedia, uploadGuestPropertyMedia } from '@/app/actions/guest-property-media';
import PressButton from '@/app/_components/PressButton';
import {
  GUEST_IMAGE_MAX_BYTES,
  GUEST_VIDEO_MAX_BYTES,
  guestPropertyMediaPublicUrl,
  isVideoStoragePath,
} from '@/lib/guest-property-media';
import imageCompression from 'browser-image-compression';
import { useId, useState } from 'react';

function looksLikeImageFile(file: File): boolean {
  const t = (file.type || '').toLowerCase();
  if (t.startsWith('image/') && !t.startsWith('video/')) return true;
  // iOS Safari often leaves type empty for camera-roll picks
  return /\.(jpe?g|png|gif|webp|heic|heif|bmp)$/i.test(file.name || '');
}

function looksLikeVideoFile(file: File): boolean {
  const t = (file.type || '').toLowerCase();
  if (t.startsWith('video/')) return true;
  return /\.(mp4|webm|ogg|mov|m4v|avi|mkv)$/i.test(file.name || '');
}

async function prepareMediaForGuestUpload(
  file: File,
  options: { allowVideo: boolean }
): Promise<File> {
  if (looksLikeImageFile(file)) {
    if (file.size > GUEST_IMAGE_MAX_BYTES) {
      throw new Error('Image must be 5 MB or smaller.');
    }
    // Keep visual quality while shrinking payload for faster uploads.
    return imageCompression(file, {
      maxSizeMB: 5,
      maxWidthOrHeight: 2560,
      useWebWorker: true,
      initialQuality: 0.9,
    });
  }

  if (looksLikeVideoFile(file)) {
    if (!options.allowVideo) {
      throw new Error('Video uploads are available on Stayvo Pro.');
    }
    if (file.size > GUEST_VIDEO_MAX_BYTES) {
      throw new Error('Video must be 30 MB or smaller.');
    }
    // Client-side video transcoding is expensive/unreliable on mobile; keep original.
    return file;
  }

  throw new Error(options.allowVideo ? 'Only image/video files are allowed.' : 'Only image files are allowed on your plan.');
}

function formatUploadError(err: unknown): string {
  const msg = err instanceof Error ? err.message : 'Upload failed.';
  if (msg.includes('unexpected response was received from the server')) {
    return 'Upload failed because the file is too large for the server. Try a video under 30 MB, save the property, and upload again. If this continues, email support@stayvo.io.';
  }
  return msg;
}

async function uploadVideoDirectToR2(
  propertyId: string,
  file: File
): Promise<{ path: string }> {
  const presignRes = await fetch('/api/guest-media/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      propertyId,
      mimeType: file.type,
      fileName: file.name,
      byteSize: file.size,
    }),
  });
  const presignData = (await presignRes.json()) as {
    error?: string;
    uploadUrl?: string;
    path?: string;
    headers?: { 'Content-Type'?: string };
  };
  if (!presignRes.ok) {
    throw new Error(presignData.error ?? 'Could not start video upload.');
  }
  const { uploadUrl, path, headers } = presignData;
  if (!uploadUrl || !path) {
    throw new Error('Could not start video upload.');
  }

  const putRes = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': (headers?.['Content-Type'] ?? file.type) || 'application/octet-stream',
    },
  });
  if (!putRes.ok) {
    throw new Error('Video upload to storage failed. Try again or use a smaller file.');
  }

  const completeRes = await fetch('/api/guest-media/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      propertyId,
      path,
      mimeType: file.type,
      fileName: file.name,
      byteSize: file.size,
    }),
  });
  const completeData = (await completeRes.json()) as { error?: string; path?: string; ok?: boolean };
  if (!completeRes.ok) {
    throw new Error(completeData.error ?? 'Could not finish video upload.');
  }
  if (!completeData.path) {
    throw new Error('Could not finish video upload.');
  }
  return { path: completeData.path };
}

export default function GuestImageSlot({
  propertyId,
  slot = 'detail:0',
  value,
  onChange,
  allowVideo = false,
  guestMediaPublicBase,
}: {
  propertyId: string | undefined;
  slot?: string;
  value: string;
  onChange: (nextPath: string) => void;
  /** When false (Free tier), only images may be uploaded. */
  allowVideo?: boolean;
  /** Server-resolved public origin for stored paths (R2 or Supabase); avoids wrong URLs in the browser. */
  guestMediaPublicBase?: string | null;
}) {
  const hasPath = (value ?? '').trim().length > 0;
  const previewUrl = guestPropertyMediaPublicUrl(
    value,
    guestMediaPublicBase !== undefined ? { resolvedPublicBase: guestMediaPublicBase } : undefined
  );
  const inputId = useId();
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'upload'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setError(null);
    setBusy(true);
    try {
      if (!propertyId) {
        throw new Error('Please save property first, then upload media.');
      }
      const processed = await prepareMediaForGuestUpload(file, { allowVideo });
      setPhase('upload');

      if (looksLikeVideoFile(processed)) {
        const { path } = await uploadVideoDirectToR2(propertyId, processed);
        onChange(path);
      } else {
        const fd = new FormData();
        fd.set('file', processed);
        const res = await uploadGuestPropertyMedia(propertyId, slot, fd);
        if (!res.ok) throw new Error(res.error);
        onChange(res.path);
      }
    } catch (err: unknown) {
      setError(formatUploadError(err));
    } finally {
      setBusy(false);
      setPhase('idle');
    }
  }

  async function onRemove() {
    if (!(value ?? '').trim()) {
      onChange('');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const res = await removeGuestPropertyMedia(propertyId ?? '', value.trim());
      if (!res.ok) throw new Error(res.error);
      onChange('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not remove media.');
    } finally {
      setBusy(false);
    }
  }

  const canInteract = !busy;
  const uploadControlClassName =
    'inline-flex min-h-[2.25rem] items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-white/15 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/15';

  return (
    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/90 px-3 py-2.5 dark:border-white/10 dark:bg-white/[0.06]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-snug text-slate-800 dark:text-slate-200">
            <span className="font-semibold">Media</span>
            <span className="font-normal text-slate-600 dark:text-slate-400">
              {allowVideo ? (
                <>
                  {' '}
                  <span className="block sm:inline">Image max 5MB; video max 30MB.</span>
                </>
              ) : (
                <>
                  {' '}
                  <span className="block sm:inline">Images only, max 5MB.</span>
                </>
              )}
            </span>
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
          <input
            id={inputId}
            type="file"
            accept={allowVideo ? 'image/*,video/*' : 'image/*'}
            className="sr-only"
            disabled={!canInteract}
            onChange={onPick}
            aria-label={hasPath ? 'Replace media' : 'Upload media'}
          />
          {canInteract ? (
            <label htmlFor={inputId} className={`${uploadControlClassName} cursor-pointer`}>
              {hasPath ? 'Replace' : 'Upload'}
            </label>
          ) : (
            <span className={`${uploadControlClassName} cursor-wait opacity-60`} aria-live="polite">
              {phase === 'upload' ? 'Uploading…' : 'Processing…'}
            </span>
          )}
          {hasPath ? (
            <PressButton
              type="button"
              disabled={busy}
              onClick={() => void onRemove()}
              className="inline-flex min-h-[2.25rem] items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-4 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50 dark:border-rose-800/50 dark:bg-rose-950/45 dark:text-rose-300 dark:hover:bg-rose-950/70"
            >
              Remove
            </PressButton>
          ) : null}
        </div>
      </div>

      {previewUrl ? (
        <div className="mt-2 overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-white/10 dark:bg-black/40">
          {isVideoStoragePath(value) ? (
            <video
              src={previewUrl}
              className="max-h-56 min-h-[140px] w-full bg-black object-contain"
              controls
              playsInline
              preload="metadata"
              onError={() =>
                setError(
                  'Preview failed to load. Check NEXT_PUBLIC_GUEST_MEDIA_URL on the server and that the file exists on R2.'
                )
              }
            />
          ) : (
            <img
              src={previewUrl}
              alt=""
              className="max-h-48 min-h-[120px] w-full object-contain"
              onError={() =>
                setError(
                  'Preview failed to load. Check NEXT_PUBLIC_GUEST_MEDIA_URL on the server and that the file exists on R2.'
                )
              }
            />
          )}
        </div>
      ) : null}

      {error ? (
        <p className="mt-2 text-sm font-medium text-rose-600 dark:text-rose-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
