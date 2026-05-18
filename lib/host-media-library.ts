/**
 * Shared storage prefixes: removing an image from one property slot must not delete the
 * object if other slots still reference it. Legacy `library/` paths remain supported.
 */
export const DEDUP_SEGMENT = 'dedup';
export const LEGACY_LIBRARY_SEGMENT = 'library';

export function isSharedDedupStoragePath(userId: string, storagePath: string | null | undefined) {
  const p = (storagePath ?? '').trim();
  if (!p || !userId) return false;
  return (
    p.startsWith(`${userId}/${DEDUP_SEGMENT}/`) ||
    p.startsWith(`${userId}/${LEGACY_LIBRARY_SEGMENT}/`)
  );
}
