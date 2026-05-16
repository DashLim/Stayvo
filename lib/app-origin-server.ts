import 'server-only';

/** Absolute origin for redirects and Stripe return URLs — from NEXT_PUBLIC_APP_URL. */
export function getServerAppOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!raw) return 'http://localhost:3000';
  const prefixed = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  return prefixed.replace(/\/$/, '');
}
