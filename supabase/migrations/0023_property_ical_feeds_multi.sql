-- Allow multiple iCal feeds per property

alter table public.property_ical_feeds
  drop constraint if exists property_ical_feeds_property_id_key;
