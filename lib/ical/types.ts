export type IcalFeedSource = 'airbnb' | 'booking' | 'vrbo' | 'other';

export type ParsedIcalBooking = {
  uid: string;
  summary: string;
  guestName: string | null;
  checkInDate: string;
  checkoutDate: string;
};

export type IcalFeedSummary = {
  property_id: string;
  source: IcalFeedSource;
  calendar_name: string | null;
  last_synced_at: string | null;
  last_error: string | null;
};
