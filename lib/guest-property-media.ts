import { getSupabasePublicEnv } from '@/lib/supabase/env';

export const GUEST_PROPERTY_MEDIA_BUCKET = 'guest-property-media';

/** Max original file size before client compression (5 MB). */
export const GUEST_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

/**
 * Public URL for a stored object key (`userId/dedup/...` or `userId/{propertyId}/...`).
 *
 * When **NEXT_PUBLIC_GUEST_MEDIA_URL** is set (R2 public domain or custom domain, no trailing
 * slash), URLs point at Cloudflare R2. Otherwise Supabase Storage public URL is used.
 */
export function guestPropertyMediaPublicUrl(storagePath: string | null | undefined): string | null {
  const trimmed = (storagePath ?? '').trim();
  if (!trimmed) return null;

  const r2Base = process.env.NEXT_PUBLIC_GUEST_MEDIA_URL?.trim().replace(/\/$/, '');
  if (r2Base) {
    const encoded = trimmed.split('/').map((seg) => encodeURIComponent(seg)).join('/');
    return `${r2Base}/${encoded}`;
  }

  const env = getSupabasePublicEnv();
  if (!env) return null;
  const encoded = trimmed.split('/').map((seg) => encodeURIComponent(seg)).join('/');
  return `${env.url}/storage/v1/object/public/${GUEST_PROPERTY_MEDIA_BUCKET}/${encoded}`;
}
