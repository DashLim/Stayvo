import { getSupabasePublicEnv } from '@/lib/supabase/env';

export const GUEST_PROPERTY_MEDIA_BUCKET = 'guest-property-media';

/** Max original file size before client compression (5 MB). */
export const GUEST_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
/** Max video file size before upload (15 MB). */
export const GUEST_VIDEO_MAX_BYTES = 15 * 1024 * 1024;

function normalizeGuestMediaBase(raw: string | undefined): string | null {
  const t = raw?.trim().replace(/\/$/, '');
  return t || null;
}

function isGuestMediaR2EnvConfigured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID?.trim() &&
      process.env.R2_ACCESS_KEY_ID?.trim() &&
      process.env.R2_SECRET_ACCESS_KEY?.trim() &&
      process.env.R2_BUCKET_NAME?.trim()
  );
}

export function isVideoStoragePath(storagePath: string | null | undefined): boolean {
  const path = (storagePath ?? '').toLowerCase();
  return /\.(mp4|webm|ogg|mov|m4v|avi|mkv)$/i.test(path);
}

/**
 * Resolve the public base URL for guest/property media (call from Server Components).
 *
 * Prefer **NEXT_PUBLIC_GUEST_MEDIA_URL**, then server-only **GUEST_MEDIA_PUBLIC_URL** (same R2
 * public origin; use when you cannot rely on NEXT_PUBLIC being present in client bundles).
 * When R2 upload credentials are set but neither URL is configured, returns **null** so callers
 * do not incorrectly fall back to Supabase Storage URLs.
 */
export function guestPropertyMediaResolvedPublicBase(): string | null {
  const nextPublic = normalizeGuestMediaBase(process.env.NEXT_PUBLIC_GUEST_MEDIA_URL);
  if (nextPublic) return nextPublic;

  const serverOnly = normalizeGuestMediaBase(process.env.GUEST_MEDIA_PUBLIC_URL);
  if (serverOnly) return serverOnly;

  if (isGuestMediaR2EnvConfigured()) {
    return null;
  }

  const env = getSupabasePublicEnv();
  if (!env) return null;
  return `${env.url}/storage/v1/object/public/${GUEST_PROPERTY_MEDIA_BUCKET}`;
}

export type GuestPropertyMediaUrlOptions = {
  /**
   * From **guestPropertyMediaResolvedPublicBase()** on the server. When **null**, no public URL
   * can be built (e.g. R2 without a configured public base).
   */
  resolvedPublicBase?: string | null;
};

/**
 * Public URL for a stored object key (`userId/dedup/...` or `userId/{propertyId}/...`).
 *
 * When **NEXT_PUBLIC_GUEST_MEDIA_URL** is set (R2 public domain or custom domain, no trailing
 * slash), URLs point at Cloudflare R2. Otherwise Supabase Storage public URL is used.
 *
 * Pass **resolvedPublicBase** from the server when hosting media on R2 so client previews work even
 * if NEXT_PUBLIC was not available at build time.
 */
export function guestPropertyMediaPublicUrl(
  storagePath: string | null | undefined,
  options?: GuestPropertyMediaUrlOptions
): string | null {
  const trimmed = (storagePath ?? '').trim();
  if (!trimmed) return null;

  if (options !== undefined && 'resolvedPublicBase' in options) {
    const base = options.resolvedPublicBase;
    if (base === null) return null;
    const normalized = normalizeGuestMediaBase(base ?? undefined);
    if (normalized) {
      const encoded = trimmed.split('/').map((seg) => encodeURIComponent(seg)).join('/');
      return `${normalized}/${encoded}`;
    }
  }

  const r2Base = normalizeGuestMediaBase(process.env.NEXT_PUBLIC_GUEST_MEDIA_URL);
  if (r2Base) {
    const encoded = trimmed.split('/').map((seg) => encodeURIComponent(seg)).join('/');
    return `${r2Base}/${encoded}`;
  }

  const env = getSupabasePublicEnv();
  if (!env) return null;
  const encoded = trimmed.split('/').map((seg) => encodeURIComponent(seg)).join('/');
  return `${env.url}/storage/v1/object/public/${GUEST_PROPERTY_MEDIA_BUCKET}/${encoded}`;
}
