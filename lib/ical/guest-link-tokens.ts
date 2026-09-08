import { randomBytes } from 'crypto';

const SHORT_TOKEN_LEN = 6;
const TOKEN_ALPHABET =
  'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

export function generateShortGuestLinkToken() {
  const bytes = randomBytes(SHORT_TOKEN_LEN);
  let out = '';
  for (let i = 0; i < SHORT_TOKEN_LEN; i++) {
    out += TOKEN_ALPHABET[bytes[i]! % TOKEN_ALPHABET.length];
  }
  return out;
}

export function isUniqueViolation(message: string) {
  return (
    message.includes('duplicate') ||
    message.includes('unique') ||
    message.includes('23505')
  );
}
