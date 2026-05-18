import { NextResponse } from 'next/server';

import {
  assertGuestMediaUploadAuth,
  isIncomingStoragePath,
  resolvedMediaMime,
} from '@/lib/guest-media-upload-api';
import { isGuestMediaR2Enabled } from '@/lib/guest-media-r2';
import { transcodeGuestVideoFromIncoming } from '@/lib/guest-media-transcode-server';

export const runtime = 'nodejs';
/** Video transcode can take 30–90s for ~10 MB clips on serverless. */
export const maxDuration = 120;

export async function POST(request: Request) {
  if (!isGuestMediaR2Enabled()) {
    return NextResponse.json({ error: 'Video compression is not configured.' }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const propertyId = String((body as { propertyId?: unknown }).propertyId ?? '').trim();
  const incomingPath = String((body as { incomingPath?: unknown }).incomingPath ?? '').trim();
  const mimeType = String((body as { mimeType?: unknown }).mimeType ?? '').trim();
  const fileName = String((body as { fileName?: unknown }).fileName ?? '').trim();

  if (!propertyId || !incomingPath) {
    return NextResponse.json({ error: 'Missing propertyId or incomingPath.' }, { status: 400 });
  }

  const auth = await assertGuestMediaUploadAuth(propertyId);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (!isIncomingStoragePath(auth.userId, incomingPath)) {
    return NextResponse.json({ error: 'Invalid incoming path.' }, { status: 400 });
  }

  const mime = resolvedMediaMime(mimeType, fileName);
  if (!mime?.startsWith('video/')) {
    return NextResponse.json({ error: 'Only videos can be transcoded.' }, { status: 400 });
  }

  if (!auth.allowVideo) {
    return NextResponse.json(
      { error: 'Video uploads are available on Stayvo Pro.' },
      { status: 403 }
    );
  }

  const result = await transcodeGuestVideoFromIncoming(
    auth.supabase,
    auth.userId,
    incomingPath
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    path: result.path,
    byteSize: result.byteSize,
    contentSha256: result.contentSha256,
    reused: result.reused,
    compressed: true,
  });
}
