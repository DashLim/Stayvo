'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  GUEST_PROPERTY_MEDIA_BUCKET,
  GUEST_IMAGE_MAX_BYTES,
} from '@/lib/guest-property-media';

const IMAGE_PREFIX = /^image\//;

function validateSlot(slot: string) {
  return /^(checkin|tip|detail):\d+$/.test(slot);
}

/** Upload a compressed image from the host form. Path is `{userId}/{propertyId}/{slot}-{uuid}.ext`. */
export async function uploadGuestPropertyMedia(
  propertyId: string,
  slot: string,
  formData: FormData
) {
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

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return { ok: false as const, error: 'No file uploaded.' };
  }

  if (file.size > GUEST_IMAGE_MAX_BYTES) {
    return { ok: false as const, error: 'Image must be 2 MB or smaller.' };
  }

  const mime = (file.type || '').toLowerCase();
  if (!IMAGE_PREFIX.test(mime) || mime.startsWith('video/')) {
    return { ok: false as const, error: 'Only image files are allowed (no video).' };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext =
    mime === 'image/png'
      ? 'png'
      : mime === 'image/webp'
        ? 'webp'
        : mime === 'image/gif'
          ? 'gif'
          : 'jpg';

  const safeSlot = slot.replace(/:/g, '-');
  const filename = `${safeSlot}-${crypto.randomUUID()}.${ext}`;
  const path = `${user.id}/${propertyId}/${filename}`;

  const { error: upError } = await supabase.storage
    .from(GUEST_PROPERTY_MEDIA_BUCKET)
    .upload(path, buffer, {
      cacheControl: '31536000',
      upsert: false,
      contentType: mime || 'image/jpeg',
    });

  if (upError) {
    return { ok: false as const, error: upError.message };
  }

  return { ok: true as const, path };
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

  const prefix = `${user.id}/${propertyId}/`;
  if (!trimmed.startsWith(prefix)) {
    return { ok: false as const, error: 'Invalid path.' };
  }

  const { error } = await supabase.storage
    .from(GUEST_PROPERTY_MEDIA_BUCKET)
    .remove([trimmed]);

  if (error) {
    return { ok: false as const, error: error.message };
  }

  return { ok: true as const };
}

/** Remove all uploaded guest images for a property (call before deleting the property row). */
export async function deleteGuestMediaFolderForProperty(
  propertyId: string,
  userId: string
) {
  const supabase = await createSupabaseServerClient();
  const folder = `${userId}/${propertyId}`;
  const { data: items, error: listError } = await supabase.storage
    .from(GUEST_PROPERTY_MEDIA_BUCKET)
    .list(folder, { limit: 1000 });

  if (listError || !items?.length) {
    return;
  }

  const paths = items.map((item) => `${folder}/${item.name}`);
  await supabase.storage.from(GUEST_PROPERTY_MEDIA_BUCKET).remove(paths);
}
