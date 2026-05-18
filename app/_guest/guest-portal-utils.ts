export function toTitleCase(str: string) {
  return str.replace(/\S+/g, (word) => word.charAt(0).toUpperCase() + word.slice(1));
}

export function formatDate(dateValue: string) {
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return dateValue;
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function hasText(value: string | null | undefined) {
  return (value ?? '').trim().length > 0;
}

export function toTelHref(phone: string | null | undefined) {
  const raw = (phone ?? '').trim();
  if (!raw) return null;
  const cleaned = raw.replace(/[^\d+]/g, '');
  const normalized = cleaned.startsWith('00') ? `+${cleaned.slice(2)}` : cleaned;
  return normalized.length > 0 ? `tel:${normalized}` : null;
}

export function toWhatsappHref(phone: string | null | undefined) {
  const raw = (phone ?? '').trim();
  if (!raw) return null;
  let digits = raw.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('00')) digits = digits.slice(2);
  return `https://wa.me/${digits}`;
}
