import { NextResponse } from 'next/server';

import {
  assertGuestMediaUploadAuth,
  extFromMediaMime,
  resolvedMediaMime,
  validateMediaUpload,
} from '@/lib/guest-media-upload-api';
import { DEDUP_SEGMENT } from '@/lib/host-media-library';
import { r2GuestMediaExists } from '@/lib/guest-media-r2';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const propertyId = String((body as { propertyId?: unknown }).propertyId ?? '').trim();
  const path = String((body as { path?: unknown }).path ?? '').trim();
  const mimeType = String((body as { mimeType?: unknown }).mimeType ?? '').trim();
  const fileName = String((body as { fileName?: unknown }).fileName ?? '').trim();
  const byteSize = Number((body as { byteSize?: unknown }).byteSize);
  const contentSha256 = String((body as { contentSha256?: unknown }).contentSha256 ?? '')
    .trim()
    .toLowerCase();

  if (!propertyId || !path || !Number.isFinite(byteSize) || byteSize <= 0) {
    return NextResponse.json({ error: 'Missing propertyId, path, or byteSize.' }, { status: 400 });
  }

  if (!/^[a-f0-9]{64}$/.test(contentSha256)) {
    return NextResponse.json({ error: 'Missing or invalid contentSha256.' }, { status: 400 });
  }

  const auth = await assertGuestMediaUploadAuth(propertyId);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (!path.startsWith(`${auth.userId}/${DEDUP_SEGMENT}/`)) {
    return NextResponse.json({ error: 'Invalid storage path.' }, { status: 400 });
  }

  const mime = resolvedMediaMime(mimeType, fileName);
  if (!mime) {
    return NextResponse.json({ error: 'Only image/video files are allowed.' }, { status: 400 });
  }

  const validation = validateMediaUpload(mime, byteSize, auth.allowVideo);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const exists = await r2GuestMediaExists(path);
  if (!exists) {
    return NextResponse.json(
      { error: 'Upload not found in storage. Try uploading again.' },
      { status: 400 }
    );
  }

  const filename = path.split('/').pop() ?? `media.${extFromMediaMime(mime)}`;
  const assetId = crypto.randomUUID();

  const { error: insertError } = await auth.supabase.from('host_media_assets').insert({
    id: assetId,
    user_id: auth.userId,
    storage_path: path,
    filename,
    mime_type: mime,
    byte_size: Math.round(byteSize),
    content_sha256: contentSha256,
  });

  if (insertError) {
    if ((insertError as { code?: string }).code === '23505') {
      return NextResponse.json({ ok: true, path, reused: true });
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, path, reused: false });
}
