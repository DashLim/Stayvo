import 'server-only';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isGuestMediaR2Enabled, r2GuestMediaExists } from '@/lib/guest-media-r2';
import { GUEST_PROPERTY_MEDIA_BUCKET } from '@/lib/guest-property-media';

export async function guestMediaObjectExists(path: string): Promise<boolean> {
  if (isGuestMediaR2Enabled()) {
    if (await r2GuestMediaExists(path)) return true;
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

export async function createSupabaseSignedVideoUpload(
  path: string
): Promise<{ ok: true; uploadUrl: string; token: string } | { ok: false; error: string }> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.storage
    .from(GUEST_PROPERTY_MEDIA_BUCKET)
    .createSignedUploadUrl(path);

  if (error || !data?.signedUrl) {
    return { ok: false, error: error?.message ?? 'Could not create upload URL.' };
  }

  return { ok: true, uploadUrl: data.signedUrl, token: data.token };
}
