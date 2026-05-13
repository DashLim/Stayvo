/** Mirrors `stayvo-theme` localStorage for optional future SSR; non-HttpOnly. */
export const THEME_COOKIE_NAME = 'stayvo-theme';

export function setClientThemeCookie(value: 'light' | 'dark'): void {
  if (typeof document === 'undefined') return;
  const secure = typeof location !== 'undefined' && location.protocol === 'https:';
  document.cookie = `${THEME_COOKIE_NAME}=${value}; path=/; max-age=31536000; samesite=lax${
    secure ? '; secure' : ''
  }`;
}
