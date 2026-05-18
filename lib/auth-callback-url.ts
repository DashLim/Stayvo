/** Where Supabase sends users after email links (password reset, etc.). */
export const AUTH_CONFIRM_PATH = '/auth/confirm';

export const RESET_PASSWORD_PATH = '/login/reset-password';

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
