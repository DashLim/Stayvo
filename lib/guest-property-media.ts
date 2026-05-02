import { getSupabasePublicEnv } from '@/lib/supabase/env';

export const GUEST_PROPERTY_MEDIA_BUCKET = 'guest-property-media';

/** Max original file size before client compression (2 MB). */
export const GUEST_IMAGE_MAX_BYTES = 2 * 1024 * 1024;

export function guestPropertyMediaPublicUrl(storagePath: string | null | undefined): string | null {
  const trimmed = (storagePath ?? '').trim();
  if (!trimmed) return null;
  const env = getSupabasePublicEnv();
  if (!env) return null;
  const encoded = trimmed.split('/').map((seg) => encodeURIComponent(seg)).join('/');
  return `${env.url}/storage/v1/object/public/${GUEST_PROPERTY_MEDIA_BUCKET}/${encoded}`;
}
