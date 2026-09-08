-- Free-text calendar label (replaces OTA source dropdown in UI)

alter table public.property_ical_feeds
  add column if not exists calendar_name text;

update public.property_ical_feeds
set calendar_name = case source
  when 'airbnb' then 'Airbnb'
  when 'booking' then 'Booking.com'
  when 'vrbo' then 'VRBO'
  else 'Calendar'
end
where calendar_name is null or trim(calendar_name) = '';
