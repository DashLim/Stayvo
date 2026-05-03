'use client';

import {
  removeGuestPropertyMedia,
  uploadGuestPropertyMedia,
} from '@/app/actions/guest-property-media';
import {
  GUEST_IMAGE_MAX_BYTES,
  guestPropertyMediaPublicUrl,
} from '@/lib/guest-property-media';
import imageCompression from 'browser-image-compression';
import { useId, useState } from 'react';

async function compressForGuestUpload(file: File): Promise<File> {
  if (file.size > GUEST_IMAGE_MAX_BYTES) {
    throw new Error('Image must be 2 MB or smaller.');
  }
  const mime = (file.type || '').toLowerCase();
  if (!mime.startsWith('image/') || mime.startsWith('video/')) {
    throw new Error('Only image files are allowed (no video).');
  }

  const options = {
    maxSizeMB: 0.85,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    initialQuality: 0.82,
    fileType: 'image/webp' as const,
  };

  let compressed: File;
  try {
    const out = await imageCompression(file, options);
    compressed =
      out instanceof File ? out : new File([out], 'photo.webp', { type: 'image/webp' });
  } catch {
    const fallback = await imageCompression(file, {
      ...options,
      fileType: 'image/jpeg' as const,
    });
    compressed =
      fallback instanceof File
        ? fallback
        : new File([fallback], 'photo.jpg', { type: 'image/jpeg' });
  }

  // Phone/camera JPEGs are often pre-optimized; re-encoding to WebP/JPEG can *increase* size.
  if (compressed.size < file.size) {
    return compressed;
  }
  return file;
}

export default function GuestImageSlot({
  propertyId,
  slot,
  value,
  onChange,
}: {
  propertyId: string | undefined;
  slot: string;
  value: string;
  onChange: (nextPath: string) => void;
}) {
  const hasPath = (value ?? '').trim().length > 0;
  const previewUrl = guestPropertyMediaPublicUrl(value);
  const inputId = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !propertyId) return;

    setError(null);
    setBusy(true);
    try {
      const compressed = await compressForGuestUpload(file);
      const fd = new FormData();
      fd.set('file', compressed);
      const res = await uploadGuestPropertyMedia(propertyId, slot, fd);
      if (!res.ok) throw new Error(res.error);
      onChange(res.path);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setBusy(false);
    }
  }

  async function onRemove() {
    if (!propertyId || !(value ?? '').trim()) {
      onChange('');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const res = await removeGuestPropertyMedia(propertyId, value.trim());
      if (!res.ok) throw new Error(res.error);
      onChange('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not remove image.');
    } finally {
      setBusy(false);
    }
  }

  const disabled = !propertyId;
  const canOpenPicker = !disabled && !busy;
  const uploadControlClassName =
    'inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 transition hover:bg-slate-50';

  return (
    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/90 px-3 py-2.5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="min-w-0 text-sm text-slate-800">
          <span className="font-semibold">Image</span>
          <span className="font-normal"> (max 2mb)</span>
        </span>
        <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-2">
          <input
            id={inputId}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            disabled={disabled || busy}
            onChange={onPick}
            aria-label="Upload image"
          />
          {canOpenPicker ? (
            <label htmlFor={inputId} className={`${uploadControlClassName} cursor-pointer`}>
              Upload
            </label>
          ) : (
            <span
              className={`${uploadControlClassName} opacity-50 ${
                disabled ? 'cursor-not-allowed' : 'cursor-wait'
              }`}
              aria-hidden={Boolean(busy)}
            >
              {busy ? 'Working…' : 'Upload'}
            </span>
          )}
          {hasPath && !disabled ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void onRemove()}
              className="inline-flex items-center justify-center rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
            >
              Remove
            </button>
          ) : null}
        </div>
      </div>

      {disabled ? (
        <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs text-amber-900">
          Save this property once, then edit it to upload photos.
        </p>
      ) : null}

      {previewUrl ? (
        <div className="mt-2 overflow-hidden rounded-lg border border-slate-200 bg-white">
          <img src={previewUrl} alt="" className="max-h-48 w-full object-contain" />
        </div>
      ) : null}

      {error ? (
        <p className="mt-2 text-xs text-rose-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
