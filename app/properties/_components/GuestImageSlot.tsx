'use client';

import { removeGuestPropertyMedia, uploadGuestPropertyMedia } from '@/app/actions/guest-property-media';
import {
  GUEST_IMAGE_MAX_BYTES,
  guestPropertyMediaPublicUrl,
} from '@/lib/guest-property-media';
import { useId, useState } from 'react';

function looksLikeImageFile(file: File): boolean {
  const t = (file.type || '').toLowerCase();
  if (t.startsWith('image/') && !t.startsWith('video/')) return true;
  // iOS Safari often leaves type empty for camera-roll picks
  return /\.(jpe?g|png|gif|webp|heic|heif|bmp)$/i.test(file.name || '');
}

async function compressForGuestUpload(file: File): Promise<File> {
  if (file.size > GUEST_IMAGE_MAX_BYTES) {
    throw new Error('Image must be 5 MB or smaller.');
  }
  if (!looksLikeImageFile(file)) {
    throw new Error('Only image files are allowed (no video).');
  }

  return file;
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
    // #region agent log
    fetch('http://127.0.0.1:7263/ingest/ecff1dbe-677d-4e22-b37a-377dc7a9119f',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'326deb'},body:JSON.stringify({sessionId:'326deb',runId:'pre-fix',hypothesisId:'H1',location:'GuestImageSlot.tsx:onPick',message:'Client selected file for upload',data:{fileSize:file.size,fileType:file.type || null,maxBytes:GUEST_IMAGE_MAX_BYTES},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    setError(null);
    setBusy(true);
    try {
      const compressed = await compressForGuestUpload(file);
      // #region agent log
      fetch('http://127.0.0.1:7263/ingest/ecff1dbe-677d-4e22-b37a-377dc7a9119f',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'326deb'},body:JSON.stringify({sessionId:'326deb',runId:'pre-fix',hypothesisId:'H2',location:'GuestImageSlot.tsx:onPick',message:'Client compressed file before server action',data:{originalSize:file.size,compressedSize:compressed.size},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      setPhase('upload');
      const fd = new FormData();
      fd.set('file', compressed);
      if (!propertyId) {
        throw new Error('Please save property first, then upload image.');
      }
      const res = await uploadGuestPropertyMedia(propertyId, slot, fd);
      if (!res.ok) throw new Error(res.error);
      onChange(res.path);
    } catch (err: unknown) {
      // #region agent log
      fetch('http://127.0.0.1:7263/ingest/ecff1dbe-677d-4e22-b37a-377dc7a9119f',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'326deb'},body:JSON.stringify({sessionId:'326deb',runId:'pre-fix',hypothesisId:'H3',location:'GuestImageSlot.tsx:onPick',message:'Client upload flow failed',data:{errorMessage:err instanceof Error ? err.message : String(err)},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
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
      setError(err instanceof Error ? err.message : 'Could not remove image.');
    } finally {
      setBusy(false);
    }
  }

  const canInteract = !busy;
  const uploadControlClassName =
    'inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 transition hover:bg-slate-50';

  return (
    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/90 px-3 py-2.5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="min-w-0 text-sm text-slate-800">
          <span className="font-semibold">Image</span>
          <span className="font-normal"> (max 5MB)</span>
        </span>
        <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-2">
          <input
            id={inputId}
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={!canInteract}
            onChange={onPick}
            aria-label="Upload image"
          />
          {canInteract ? (
            <label htmlFor={inputId} className={`${uploadControlClassName} cursor-pointer`}>
              Upload
            </label>
          ) : (
            <span className={`${uploadControlClassName} cursor-wait opacity-60`} aria-live="polite">
              {phase === 'upload' ? 'Uploading…' : 'Processing…'}
            </span>
          )}
          {hasPath ? (
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

      {previewUrl ? (
        <div className="mt-2 overflow-hidden rounded-lg border border-slate-200 bg-white">
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
