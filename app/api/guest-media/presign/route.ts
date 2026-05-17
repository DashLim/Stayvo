import { NextResponse } from 'next/server';

import {
  assertGuestMediaUploadAuth,
  buildDirectUploadStoragePath,
  resolvedMediaMime,
  validateMediaUpload,
} from '@/lib/guest-media-upload-api';
import { isGuestMediaR2Enabled, r2PresignedPutGuestMedia } from '@/lib/guest-media-r2';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!isGuestMediaR2Enabled()) {
    // Client falls back to server-action upload (Supabase Storage or R2 via server).
    return NextResponse.json({ useServerUpload: true as const });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const propertyId = String((body as { propertyId?: unknown }).propertyId ?? '').trim();
  const mimeType = String((body as { mimeType?: unknown }).mimeType ?? '').trim();
  const fileName = String((body as { fileName?: unknown }).fileName ?? '').trim();
  const byteSize = Number((body as { byteSize?: unknown }).byteSize);

  if (!propertyId || !Number.isFinite(byteSize) || byteSize <= 0) {
    return NextResponse.json({ error: 'Missing propertyId or byteSize.' }, { status: 400 });
  }

  const auth = await assertGuestMediaUploadAuth(propertyId);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const mime = resolvedMediaMime(mimeType, fileName);
  if (!mime) {
    return NextResponse.json({ error: 'Only image/video files are allowed.' }, { status: 400 });
  }

  if (!mime.startsWith('video/')) {
    return NextResponse.json(
      { error: 'Direct upload is only used for videos. Use the normal upload for images.' },
      { status: 400 }
    );
  }

  const validation = validateMediaUpload(mime, byteSize, auth.allowVideo);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const path = buildDirectUploadStoragePath(auth.userId, mime);
  const signed = await r2PresignedPutGuestMedia(path, mime);
  if (!signed.ok) {
    return NextResponse.json({ error: signed.error }, { status: 502 });
  }

  return NextResponse.json({
    uploadUrl: signed.uploadUrl,
    path,
    method: 'PUT',
    headers: { 'Content-Type': mime },
  });
}
