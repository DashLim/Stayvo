import type { IcalFeedSource } from '@/lib/ical/types';

export function icalFeedSourceLabel(source: IcalFeedSource | string | null | undefined) {
  switch (source) {
    case 'airbnb':
      return 'Airbnb';
    case 'booking':
      return 'Booking.com';
    case 'vrbo':
      return 'VRBO';
    default:
      return 'Calendar';
  }
}

export function icalFeedDisplayName(feed: {
  calendar_name?: string | null;
  source?: IcalFeedSource | string | null;
}) {
  const name = (feed.calendar_name ?? '').trim();
  if (name) return name;
  return icalFeedSourceLabel(feed.source);
}
