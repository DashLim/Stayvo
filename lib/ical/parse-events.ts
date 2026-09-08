import ical from 'node-ical';
import type { ParsedIcalBooking } from '@/lib/ical/types';

const BLOCKED_SUMMARY_PATTERNS = [
  'not available',
  'blocked',
  'unavailable',
  'airbnb (not available)',
];

function normalizeString(value: string | null | undefined) {
  return (value ?? '').trim();
}

function toDateOnlyUtc(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** iCal VALUE=DATE has no timezone — recover the calendar day regardless of server TZ. */
function toDateOnlyFloating(d: Date): string {
  const adjusted = new Date(d.getTime() - d.getTimezoneOffset() * 60_000);
  return adjusted.toISOString().slice(0, 10);
}

function eventToDateOnly(
  value: Date | string | undefined | null,
  dateType: 'date' | 'date-time' = 'date-time'
): string | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return dateType === 'date' ? toDateOnlyFloating(d) : toDateOnlyUtc(d);
}

function eventDescription(event: ical.VEvent): string {
  const raw = event.description;
  if (typeof raw === 'string') return raw;
  if (raw && typeof raw === 'object' && 'val' in raw) {
    return String((raw as { val?: string }).val ?? '');
  }
  return '';
}

/** Airbnb exports real stays as SUMMARY:Reserved; blocks use Airbnb (Not available). */
function isLikelyBlocked(
  summary: string,
  source: string,
  description: string
): boolean {
  const s = summary.toLowerCase().trim();
  if (!s) return true;
  if (s === 'airbnb') return true;

  if (s === 'reserved') {
    if (source === 'airbnb' || /reservation url/i.test(description)) {
      return false;
    }
    return true;
  }

  for (const p of BLOCKED_SUMMARY_PATTERNS) {
    if (s.includes(p)) return true;
  }
  return false;
}

function extractGuestName(summary: string, source: string, description: string): string | null {
  const raw = normalizeString(summary);
  if (!raw || isLikelyBlocked(raw, source, description)) return null;

  const airbnbMatch = raw.match(/reserved\s*[-–—:]\s*(.+)/i);
  if (airbnbMatch?.[1]) {
    const name = normalizeString(airbnbMatch[1]);
    if (name && !isLikelyBlocked(name, source, description)) return name;
  }

  if (source === 'booking' && raw.length > 2 && !/^booking$/i.test(raw)) {
    return raw;
  }

  if (raw.length >= 2 && !/^(reserved|blocked|not available)$/i.test(raw)) {
    return raw;
  }

  return null;
}

export function parseIcalBookings(
  icsText: string,
  source: string,
  todayUtc: string
): ParsedIcalBooking[] {
  const parsed = ical.sync.parseICS(icsText);
  const today = todayUtc.slice(0, 10);
  const bookings: ParsedIcalBooking[] = [];
  const seenUids = new Set<string>();

  for (const item of Object.values(parsed)) {
    if (!item || item.type !== 'VEVENT') continue;
    const event = item as ical.VEvent;

    if (event.status === 'CANCELLED') continue;

    const uid = normalizeString(event.uid);
    if (!uid || seenUids.has(uid)) continue;

    const description = eventDescription(event);
    const summary = normalizeString(event.summary) || 'Guest';
    if (isLikelyBlocked(summary, source, description)) continue;

    const dateType = event.datetype ?? 'date-time';
    const start = eventToDateOnly(event.start, dateType);
    let end = eventToDateOnly(event.end, dateType);
    if (!start || !end) continue;

    // All-day DTEND is exclusive; checkout day for stays is typically the end date.
    if (end <= start) continue;

    // Skip stays that ended before today
    if (end < today) continue;

    seenUids.add(uid);
    bookings.push({
      uid,
      summary,
      guestName: extractGuestName(summary, source, description),
      checkInDate: start,
      checkoutDate: end,
    });
  }

  return bookings;
}
