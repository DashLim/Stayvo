import 'server-only';

import { getHostTier } from '@/lib/host-plan';
import { DEDUP_SEGMENT } from '@/lib/host-media-library';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  GUEST_IMAGE_MAX_BYTES,
  GUEST_VIDEO_MAX_BYTES,
} from '@/lib/guest-property-media';

export function extFromMediaMime(mime: string): string {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/gif') return 'gif';
  if (mime === 'image/heic') return 'heic';
  if (mime === 'image/heif') return 'heif';
  if (mime === 'image/bmp') return 'bmp';
  if (mime === 'video/mp4') return 'mp4';
  if (mime === 'video/webm') return 'webm';
  if (mime === 'video/ogg') return 'ogg';
  if (mime === 'video/quicktime') return 'mov';
  if (mime === 'video/x-m4v') return 'm4v';
  return 'jpg';
}

export function resolvedMediaMime(
  mimeType: string | undefined,
  fileName: string | undefined
): string | null {
  const t = (mimeType || '').trim().toLowerCase();
  if (t.startsWith('image/') || t.startsWith('video/')) return t;
  const n = (fileName || '').toLowerCase();
  const extToMime: [string, string][] = [
    ['.heic', 'image/heic'],
    ['.heif', 'image/heif'],
    ['.png', 'image/png'],
    ['.gif', 'image/gif'],
    ['.webp', 'image/webp'],
    ['.jpg', 'image/jpeg'],
    ['.jpeg', 'image/jpeg'],
    ['.bmp', 'image/bmp'],
    ['.mp4', 'video/mp4'],
    ['.webm', 'video/webm'],
    ['.ogg', 'video/ogg'],
    ['.mov', 'video/quicktime'],
    ['.m4v', 'video/x-m4v'],
  ];
  for (const [ext, mime] of extToMime) {
    if (n.endsWith(ext)) return mime;
  }
  return null;
}

export function validateMediaUpload(
  mime: string,
  byteSize: number,
  allowVideo: boolean
): { ok: true } | { ok: false; error: string } {
  if (mime.startsWith('image/')) {
    if (byteSize > GUEST_IMAGE_MAX_BYTES) {
      return { ok: false, error: 'Image must be 5 MB or smaller.' };
    }
    return { ok: true };
  }
  if (mime.startsWith('video/')) {
    if (!allowVideo) {
      return { ok: false, error: 'Video uploads are available on Stayvo Pro.' };
    }
    if (byteSize > GUEST_VIDEO_MAX_BYTES) {
      return { ok: false, error: 'Video must be 15 MB or smaller.' };
    }
    return { ok: true };
  }
  return { ok: false, error: 'Only image/video files are allowed.' };
}

export async function assertGuestMediaUploadAuth(propertyId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false as const, error: 'Unauthorized', status: 401 as const };
  }

  const { data: row, error: propError } = await supabase
    .from('properties')
    .select('id')
    .eq('id', propertyId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (propError || !row) {
    return { ok: false as const, error: 'Property not found.', status: 404 as const };
  }

  const tier = await getHostTier(supabase, user.id);
  return {
    ok: true as const,
    supabase,
    userId: user.id,
    allowVideo: tier === 'pro',
  };
}

export function buildDedupStoragePath(
  userId: string,
  mime: string,
  contentSha256: string
): string {
  const hash = contentSha256.trim().toLowerCase();
  const ext = extFromMediaMime(mime);
  return `${userId}/${DEDUP_SEGMENT}/${hash}.${ext}`;
}
