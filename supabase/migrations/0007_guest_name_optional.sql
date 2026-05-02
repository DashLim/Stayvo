-- Allow guest links without a guest name (guest portal shows generic welcome)

alter table public.guest_links
alter column guest_name drop not null;
