/** Hostname of the app deployment (e.g. app.stayvo.io), from NEXT_PUBLIC_APP_URL. */
export function getAppHostname(): string | null {
  const raw = process.env.NEXT_PUBLIC_APP_URL;
  if (!raw) return null;
  try {
    return new URL(raw).hostname;
  } catch {
    return null;
  }
}

/**
 * Marketing hostnames (apex + www). Override with NEXT_PUBLIC_MARKETING_HOSTS=comma,separated
 */
export function getMarketingHostnames(): string[] {
  const extra = process.env.NEXT_PUBLIC_MARKETING_HOSTS;
  if (extra?.trim()) {
    return extra
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return ['stayvo.io', 'www.stayvo.io'];
}

/** Skip apex/www split when developing on localhost or LAN IP. */
export function isLocalDevHostname(host: string): boolean {
  if (host === 'localhost' || host.startsWith('127.')) return true;
  return /^192\.168\.\d+\.\d+$/.test(host);
}
