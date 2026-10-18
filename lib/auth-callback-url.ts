/** Where Supabase sends users after email links (password reset, etc.). */
export const AUTH_CONFIRM_PATH = '/auth/confirm';

export const RESET_PASSWORD_PATH = '/login/reset-password';

const INTERNAL_REDIRECT_ORIGIN = 'https://stayvo.invalid';
const DEFAULT_NEXT_PATH = '/dashboard';

/**
 * Accept only same-origin, root-relative callback destinations. Repeated
 * decoding catches encoded slash/backslash authority tricks before URL parsing.
 */
export function safeNextPath(raw: string | null): string {
  if (!raw || raw.length > 2048 || !raw.startsWith('/') || raw.startsWith('//')) {
    return DEFAULT_NEXT_PATH;
  }

  let decoded = raw;
  for (let depth = 0; depth < 8; depth += 1) {
    if (decoded.includes('\\') || /[\u0000-\u001f\u007f]/.test(decoded)) {
      return DEFAULT_NEXT_PATH;
    }

    let next: string;
    try {
      next = decodeURIComponent(decoded);
    } catch {
      return DEFAULT_NEXT_PATH;
    }

    if (next === decoded) break;
    decoded = next;
    if (depth === 7) return DEFAULT_NEXT_PATH;
  }

  if (
    decoded.includes('\\') ||
    decoded.startsWith('//') ||
    /[\u0000-\u001f\u007f]/.test(decoded)
  ) {
    return DEFAULT_NEXT_PATH;
  }

  try {
    const target = new URL(raw, INTERNAL_REDIRECT_ORIGIN);
    if (
      target.origin !== INTERNAL_REDIRECT_ORIGIN ||
      target.username.length > 0 ||
      target.password.length > 0
    ) {
      return DEFAULT_NEXT_PATH;
    }
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return DEFAULT_NEXT_PATH;
  }
}

export function getAppOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (raw) {
    const prefixed = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    return prefixed.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'http://localhost:3000';
}

/** Full redirect URL registered in Supabase Auth → Redirect URLs. */
export function buildAuthConfirmRedirect(nextPath: string): string {
  const origin = getAppOrigin();
  const next = nextPath.startsWith('/') ? nextPath : `/${nextPath}`;
  return `${origin}${AUTH_CONFIRM_PATH}?next=${encodeURIComponent(next)}`;
}
