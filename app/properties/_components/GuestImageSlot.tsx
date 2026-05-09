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

async function prepareMediaForGuestUpload(file: File): Promise<File> {
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
    if (file.size > GUEST_VIDEO_MAX_BYTES) {
      throw new Error('Video must be 20 MB or smaller.');
    }
    // Client-side video transcoding is expensive/unreliable on mobile; keep original.
    return file;
  }

  throw new Error('Only image/video files are allowed.');
}

export default function GuestImageSlot({
  propertyId,
  slot = 'detail:0',
  value,
  onChange,
}: {
  propertyId: string | undefined;
  slot?: string;
  value: string;
  onChange: (nextPath: string) => void;
}) {
  const hasPath = (value ?? '').trim().length > 0;
  const previewUrl = guestPropertyMediaPublicUrl(value);
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
      const processed = await prepareMediaForGuestUpload(file);
      setPhase('upload');
      const fd = new FormData();
      fd.set('file', processed);
      if (!propertyId) {
        throw new Error('Please save property first, then upload media.');
      }
      const res = await uploadGuestPropertyMedia(propertyId, slot, fd);
      if (!res.ok) throw new Error(res.error);
      onChange(res.path);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
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
    'inline-flex min-h-[2.25rem] items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-800 transition hover:bg-slate-50';

  return (
    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/90 px-3 py-2.5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="min-w-0 text-sm text-slate-800">
          <span className="font-semibold">Media</span>
          <span className="font-normal"> (image max 5MB, video max 20MB)</span>
        </span>
        <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-2">
          <input
            id={inputId}
            type="file"
            accept="image/*,video/*"
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
              className="inline-flex min-h-[2.25rem] items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-4 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
            >
              Remove
            </PressButton>
          ) : null}
        </div>
      </div>

      {previewUrl ? (
        <div className="mt-2 overflow-hidden rounded-lg border border-slate-200 bg-white">
          {isVideoStoragePath(value) ? (
            <video
              src={previewUrl}
              className="max-h-56 min-h-[140px] w-full bg-black object-contain"
              controls
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
        <p className="mt-2 text-sm font-medium text-rose-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
