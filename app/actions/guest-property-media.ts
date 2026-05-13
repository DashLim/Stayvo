'use server';

import { createHash } from 'node:crypto';

import { getHostTier } from '@/lib/host-plan';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  r2DeleteGuestMedia,
  r2DeleteKeysWithPrefix,
  r2GuestMediaExists,
  r2PutGuestMedia,
  isGuestMediaR2Enabled,
} from '@/lib/guest-media-r2';
import {
  GUEST_PROPERTY_MEDIA_BUCKET,
  GUEST_IMAGE_MAX_BYTES,
  GUEST_VIDEO_MAX_BYTES,
} from '@/lib/guest-property-media';
import { DEDUP_SEGMENT, isSharedDedupStoragePath } from '@/lib/host-media-library';

/** iOS often omits `file.type` for camera-roll picks; infer from filename when needed. */
function resolvedMediaMime(file: File): string | null {
  const t = (file.type || '').trim().toLowerCase();
  if (t.startsWith('image/') || t.startsWith('video/')) return t;
  const n = (file.name || '').toLowerCase();
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

function extFromMediaMime(mime: string): string {
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

function validateMediaFile(file: File): { ok: true; mime: string } | { ok: false; error: string } {
  const mime = resolvedMediaMime(file);
  if (!mime) {
    return {
      ok: false,
      error: 'Only image/video files are allowed.',
    };
  }
  if (mime.startsWith('image/')) {
    if (file.size > GUEST_IMAGE_MAX_BYTES) {
      return { ok: false, error: 'Image must be 5 MB or smaller.' };
    }
    return { ok: true, mime };
  }
  if (mime.startsWith('video/')) {
    if (file.size > GUEST_VIDEO_MAX_BYTES) {
      return { ok: false, error: 'Video must be 30 MB or smaller.' };
    }
    return { ok: true, mime };
  }
  return { ok: false, error: 'Only image/video files are allowed.' };
}

function warnIfR2PublicUrlMissing() {
  if (
    process.env.NODE_ENV === 'development' &&
    isGuestMediaR2Enabled() &&
    !process.env.NEXT_PUBLIC_GUEST_MEDIA_URL?.trim() &&
    !process.env.GUEST_MEDIA_PUBLIC_URL?.trim()
  ) {
    console.warn(
      '[Stayvo] R2 is configured but neither NEXT_PUBLIC_GUEST_MEDIA_URL nor GUEST_MEDIA_PUBLIC_URL is set. ' +
        'Set NEXT_PUBLIC_GUEST_MEDIA_URL (or server-only GUEST_MEDIA_PUBLIC_URL) to your R2 public base URL (no trailing slash) and restart `npm run dev`.'
    );
  }
}

function validateSlot(slot: string) {
  return /^(checkin|tip|detail):\d+$/.test(slot);
}

function sha256Hex(buffer: Buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

async function uploadBufferToGuestMedia(
  path: string,
  buffer: Buffer,
  contentType: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isGuestMediaR2Enabled()) {
    return r2PutGuestMedia(path, buffer, contentType);
  }
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.storage
    .from(GUEST_PROPERTY_MEDIA_BUCKET)
    .upload(path, buffer, {
      cacheControl: '31536000',
      upsert: false,
      contentType,
    });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

async function deleteGuestMediaObject(path: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isGuestMediaR2Enabled()) {
    return r2DeleteGuestMedia(path);
  }
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.storage.from(GUEST_PROPERTY_MEDIA_BUCKET).remove([path]);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

async function guestMediaObjectExists(path: string): Promise<boolean> {
  if (isGuestMediaR2Enabled()) {
    return r2GuestMediaExists(path);
  }
  const supabase = await createSupabaseServerClient();
  const slashIdx = path.lastIndexOf('/');
  const prefix = slashIdx > -1 ? path.slice(0, slashIdx) : '';
  const filename = slashIdx > -1 ? path.slice(slashIdx + 1) : path;
  const { data, error } = await supabase.storage
    .from(GUEST_PROPERTY_MEDIA_BUCKET)
    .list(prefix, { limit: 100, search: filename });
  if (error) return false;
  return (data ?? []).some((item) => item.name === filename);
}

async function deleteGuestMediaFolderPrefix(userId: string, propertyId: string): Promise<void> {
  const prefix = `${userId}/${propertyId}`;
  if (isGuestMediaR2Enabled()) {
    await r2DeleteKeysWithPrefix(prefix);
    return;
  }
  const supabase = await createSupabaseServerClient();
  const { data: items, error: listError } = await supabase.storage
    .from(GUEST_PROPERTY_MEDIA_BUCKET)
    .list(prefix, { limit: 1000 });

  if (listError || !items?.length) {
    return;
  }

  const paths = items.map((item) => `${prefix}/${item.name}`);
  await supabase.storage.from(GUEST_PROPERTY_MEDIA_BUCKET).remove(paths);
}

/**
 * Upload image for guest portal sections. Same file bytes as a prior upload reuse the
 * existing storage path (no duplicate object). Catalog row in host_media_assets keyed by
 * (user_id, content_sha256).
 */
export async function uploadGuestImageDeduped(formData: FormData) {
  warnIfR2PublicUrlMissing();
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false as const, error: 'Unauthorized' };
  }

  const tier = await getHostTier(supabase, user.id);
  const allowVideo = tier === 'pro';

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return { ok: false as const, error: 'No file uploaded.' };
  }
  const validation = validateMediaFile(file);
  if (!validation.ok) return { ok: false as const, error: validation.error };
  const mime = validation.mime;
  if (!allowVideo && mime.startsWith('video/')) {
    return { ok: false as const, error: 'Video uploads are available on Stayvo Pro.' };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const hash = sha256Hex(buffer);

  const { data: existing } = await supabase
    .from('host_media_assets')
    .select('storage_path')
    .eq('user_id', user.id)
    .eq('content_sha256', hash)
    .maybeSingle();

  if (existing?.storage_path) {
    const exists = await guestMediaObjectExists(existing.storage_path);
    if (!exists) {
      await supabase
        .from('host_media_assets')
        .delete()
        .eq('user_id', user.id)
        .eq('content_sha256', hash);
    } else {
    return {
      ok: true as const,
      path: existing.storage_path as string,
      reused: true as const,
    };
    }
  }

  const ext = extFromMediaMime(mime);

  const assetId = crypto.randomUUID();
  const filename = `${hash}.${ext}`;
  const path = `${user.id}/${DEDUP_SEGMENT}/${filename}`;

  const { error: insertError } = await supabase.from('host_media_assets').insert({
    id: assetId,
    user_id: user.id,
    storage_path: path,
    filename,
    mime_type: mime,
    byte_size: buffer.length,
    content_sha256: hash,
  });

  if (insertError) {
    if ((insertError as { code?: string }).code === '23505') {
      const { data: raceRow } = await supabase
        .from('host_media_assets')
        .select('storage_path')
        .eq('user_id', user.id)
        .eq('content_sha256', hash)
        .maybeSingle();
      if (raceRow?.storage_path) {
        const exists = await guestMediaObjectExists(raceRow.storage_path);
        if (!exists) {
          await supabase
            .from('host_media_assets')
            .delete()
            .eq('user_id', user.id)
            .eq('content_sha256', hash);
        } else {
        return {
          ok: true as const,
          path: raceRow.storage_path as string,
          reused: true as const,
        };
        }
      }
    }
    return { ok: false as const, error: insertError.message };
  }

  const upError = await uploadBufferToGuestMedia(path, buffer, mime);

  if (!upError.ok) {
    await supabase.from('host_media_assets').delete().eq('id', assetId).eq('user_id', user.id);
    const msg = upError.error;
    if (msg.includes('already exists') || msg.includes('Duplicate') || msg.includes('409')) {
      const { data: raceRow } = await supabase
        .from('host_media_assets')
        .select('storage_path')
        .eq('user_id', user.id)
        .eq('content_sha256', hash)
        .maybeSingle();
      if (raceRow?.storage_path) {
        return {
          ok: true as const,
          path: raceRow.storage_path as string,
          reused: true as const,
        };
      }
    }
    return { ok: false as const, error: msg };
  }

  return { ok: true as const, path, reused: false as const };
}

async function uploadGuestPropertyMediaDeduped(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
  file: File,
  options?: { allowVideo?: boolean }
): Promise<{ ok: true; path: string; reused: boolean } | { ok: false; error: string }> {
  const validation = validateMediaFile(file);
  if (!validation.ok) return { ok: false, error: validation.error };

  const mime = validation.mime;
  const allowVideo = Boolean(options?.allowVideo);
  if (!allowVideo && mime.startsWith('video/')) {
    return { ok: false, error: 'Video uploads are available on Stayvo Pro.' };
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const hash = sha256Hex(buffer);

  const { data: existing } = await supabase
    .from('host_media_assets')
    .select('storage_path')
    .eq('user_id', userId)
    .eq('content_sha256', hash)
    .maybeSingle();

  if (existing?.storage_path) {
    const exists = await guestMediaObjectExists(existing.storage_path);
    if (exists) {
      return { ok: true, path: existing.storage_path as string, reused: true };
    }
    await supabase
      .from('host_media_assets')
      .delete()
      .eq('user_id', userId)
      .eq('content_sha256', hash);
  }

  const ext = extFromMediaMime(mime);
  const filename = `${hash}.${ext}`;
  const path = `${userId}/${DEDUP_SEGMENT}/${filename}`;
  const assetId = crypto.randomUUID();

  const { error: insertError } = await supabase.from('host_media_assets').insert({
    id: assetId,
    user_id: userId,
    storage_path: path,
    filename,
    mime_type: mime,
    byte_size: buffer.length,
    content_sha256: hash,
  });

  if (insertError) {
    if ((insertError as { code?: string }).code === '23505') {
      const { data: raceRow } = await supabase
        .from('host_media_assets')
        .select('storage_path')
        .eq('user_id', userId)
        .eq('content_sha256', hash)
        .maybeSingle();
      if (raceRow?.storage_path) {
        return { ok: true, path: raceRow.storage_path as string, reused: true };
      }
    }
    return { ok: false, error: insertError.message };
  }

  const uploaded = await uploadBufferToGuestMedia(path, buffer, mime);
  if (!uploaded.ok) {
    await supabase.from('host_media_assets').delete().eq('id', assetId).eq('user_id', userId);
    return { ok: false, error: uploaded.error };
  }

  return { ok: true, path, reused: false };
}

/** Upload media from the host form with per-user content-hash dedupe. */
export async function uploadGuestPropertyMedia(
  propertyId: string,
  slot: string,
  formData: FormData
) {
  warnIfR2PublicUrlMissing();
  if (!validateSlot(slot)) {
    return { ok: false as const, error: 'Invalid slot.' };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false as const, error: 'Unauthorized' };
  }

  const { data: row, error: propError } = await supabase
    .from('properties')
    .select('id')
    .eq('id', propertyId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (propError || !row) {
    return { ok: false as const, error: 'Property not found.' };
  }

  const tier = await getHostTier(supabase, user.id);
  const allowVideo = tier === 'pro';

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return { ok: false as const, error: 'No file uploaded.' };
  }

  const uploaded = await uploadGuestPropertyMediaDeduped(supabase, user.id, file, {
    allowVideo,
  });
  if (!uploaded.ok) return { ok: false as const, error: uploaded.error };
  return { ok: true as const, path: uploaded.path, reused: uploaded.reused };
}

export async function removeGuestPropertyMedia(propertyId: string, storagePath: string) {
  const trimmed = (storagePath ?? '').trim();
  if (!trimmed) {
    return { ok: false as const, error: 'Nothing to remove.' };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false as const, error: 'Unauthorized' };
  }

  if (isSharedDedupStoragePath(user.id, trimmed)) {
    if (!trimmed.startsWith(`${user.id}/`)) {
      return { ok: false as const, error: 'Invalid path.' };
    }
    return { ok: true as const };
  }

  const prefix = `${user.id}/${propertyId}/`;
  if (!trimmed.startsWith(prefix)) {
    return { ok: false as const, error: 'Invalid path.' };
  }

  const del = await deleteGuestMediaObject(trimmed);
  if (!del.ok) {
    return { ok: false as const, error: del.error };
  }

  return { ok: true as const };
}

/** Remove all uploaded guest images for a property (call before deleting the property row). */
export async function deleteGuestMediaFolderForProperty(
  propertyId: string,
  userId: string
) {
  await deleteGuestMediaFolderPrefix(userId, propertyId);
}
