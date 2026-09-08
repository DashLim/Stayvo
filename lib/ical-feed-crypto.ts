import 'server-only';

import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

const PREFIX = 'v1:';

function getKey(): Buffer | null {
  const raw = process.env.ICAL_FEED_ENCRYPTION_KEY?.trim();
  if (!raw) return null;
  return createHash('sha256').update(raw).digest();
}

/** Encrypt iCal feed URL for storage. Requires ICAL_FEED_ENCRYPTION_KEY in production. */
export function encryptFeedUrl(url: string): string {
  const key = getKey();
  if (!key) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ICAL_FEED_ENCRYPTION_KEY is not configured.');
    }
    return `${PREFIX}b64:${Buffer.from(url, 'utf8').toString('base64url')}`;
  }
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(url, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString('base64url')}.${tag.toString('base64url')}.${enc.toString('base64url')}`;
}

export function decryptFeedUrl(stored: string): string {
  if (stored.startsWith(`${PREFIX}b64:`)) {
    return Buffer.from(stored.slice(`${PREFIX}b64:`.length), 'base64url').toString('utf8');
  }
  if (!stored.startsWith(PREFIX)) {
    throw new Error('Invalid encrypted feed URL format.');
  }
  const key = getKey();
  if (!key) {
    throw new Error('ICAL_FEED_ENCRYPTION_KEY is not configured.');
  }
  const payload = stored.slice(PREFIX.length);
  const [ivB64, tagB64, dataB64] = payload.split('.');
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error('Invalid encrypted feed URL payload.');
  }
  const iv = Buffer.from(ivB64, 'base64url');
  const tag = Buffer.from(tagB64, 'base64url');
  const data = Buffer.from(dataB64, 'base64url');
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}
