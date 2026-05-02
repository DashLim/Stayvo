/**
 * Parse a Google Drive file URL and return an embeddable /preview URL (iframe-safe).
 * Only allows google drive file IDs we extract — never pass arbitrary URLs to iframes.
 */
export function googleDriveFileIdFromUrl(raw: string | null | undefined): string | null {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) return null;

  try {
    const u = new URL(trimmed);
    const host = u.hostname.replace(/^www\./, '');
    if (host !== 'drive.google.com') return null;

    const fileInPath = u.pathname.match(/\/file\/d\/([^/]+)/);
    if (fileInPath?.[1]) return fileInPath[1];

    const idParam = u.searchParams.get('id');
    if (idParam) return idParam;

    return null;
  } catch {
    return null;
  }
}

export function googleDrivePreviewEmbedUrl(raw: string | null | undefined): string | null {
  const id = googleDriveFileIdFromUrl(raw);
  if (!id) return null;
  return `https://drive.google.com/file/d/${id}/preview`;
}

/** Direct image URL for public Drive files (works in an img element when the file is a public image). */
export function googleDriveImageViewUrl(fileId: string): string {
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
}
