/**
 * Public guest portal URLs: `/{pathSlug}/{token}`.
 * Path slug comes from profile “Host display name” (alphanumeric, lowercased, spaces removed).
 * If empty, `stay` is used (legacy-friendly). `/stay/{token}` remains valid via the `stay` route.
 */

export const DEFAULT_GUEST_PORTAL_SLUG = 'stay';

const RESERVED_GUEST_PATH_SLUGS = new Set(
  [
    'api',
    'dashboard',
    'login',
    'properties',
    'stay',
    'manifest',
    'icon',
    'apple-icon',
    'opengraph-image',
    'twitter-image',
    'robots',
    'sitemap',
    '_next',
    'favicon',
    'dev',
    'ingest',
    'www',
  ].map((s) => s.toLowerCase())
);

export function isReservedGuestPortalSlug(slug: string): boolean {
  return RESERVED_GUEST_PATH_SLUGS.has(slug.trim().toLowerCase());
}

/**
 * For `app/[hostSlug]/[token]`: block URLs like `/api/{token}` but allow `/stay/{token}`
 * when this dynamic route is matched (same page as `app/stay/[token]`).
 */
export function slugBlocksCustomGuestPortalRoute(slug: string): boolean {
  const s = slug.trim().toLowerCase();
  if (s === DEFAULT_GUEST_PORTAL_SLUG) return false;
  return isReservedGuestPortalSlug(s);
}

/**
 * Profile names that slugify to a reserved segment (except the default `stay`) cannot be saved —
 * those URLs would 404 or collide with app routes.
 */
export function isForbiddenHostDisplayNameForGuestPath(displayName: string | null | undefined): boolean {
  const slug = hostDisplayNameToPathSlug(displayName);
  if (slug === DEFAULT_GUEST_PORTAL_SLUG) return false;
  return isReservedGuestPortalSlug(slug);
}

/** Slug used in the public URL (lowercase, no spaces, [a-z0-9] only). */
export function hostDisplayNameToPathSlug(displayName: string | null | undefined): string {
  const compact = (displayName ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '');
  if (compact.length > 0) return compact;
  return DEFAULT_GUEST_PORTAL_SLUG;
}

/** Allow only letters and numbers while typing in profile. */
export function sanitizeHostDisplayNameInput(input: string): string {
  return input.replace(/[^a-zA-Z0-9]/g, '');
}

export function guestPortalRelativePathForToken(
  hostDisplayName: string | null | undefined,
  token: string
): string {
  const slug = hostDisplayNameToPathSlug(hostDisplayName);
  return `/${slug}/${token}`;
}

export function guestPortalAbsoluteUrl(
  hostDisplayName: string | null | undefined,
  token: string,
  options?: { baseUrl?: string; origin?: string }
): string {
  const path = guestPortalRelativePathForToken(hostDisplayName, token);
  const base =
    (options?.baseUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '') || '';
  if (base) return `${base}${path}`;
  if (options?.origin) return `${options.origin.replace(/\/$/, '')}${path}`;
  if (typeof window !== 'undefined') return `${window.location.origin}${path}`;
  return path;
}
