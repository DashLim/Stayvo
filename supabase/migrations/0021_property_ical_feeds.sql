-- OTA iCal feeds per property (one feed per property in MVP)

create table if not exists public.property_ical_feeds (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null unique references public.properties(id) on delete cascade,
  feed_url_encrypted text not null,
  source text not null default 'other'
    check (source in ('airbnb', 'booking', 'vrbo', 'other')),
  enabled boolean not null default true,
  last_synced_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_property_ical_feeds_property_id
  on public.property_ical_feeds(property_id);

alter table public.property_ical_feeds enable row level security;
grant all on table public.property_ical_feeds to authenticated;

drop policy if exists "property_ical_feeds_select_own" on public.property_ical_feeds;
drop policy if exists "property_ical_feeds_insert_own" on public.property_ical_feeds;
drop policy if exists "property_ical_feeds_update_own" on public.property_ical_feeds;
drop policy if exists "property_ical_feeds_delete_own" on public.property_ical_feeds;

create policy "property_ical_feeds_select_own"
on public.property_ical_feeds
for select
using (
  exists (
    select 1 from public.properties p
    where p.id = property_id and p.user_id = auth.uid()
  )
);

create policy "property_ical_feeds_insert_own"
on public.property_ical_feeds
for insert
with check (
  exists (
    select 1 from public.properties p
    where p.id = property_id and p.user_id = auth.uid()
  )
);

create policy "property_ical_feeds_update_own"
on public.property_ical_feeds
for update
using (
  exists (
    select 1 from public.properties p
    where p.id = property_id and p.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.properties p
    where p.id = property_id and p.user_id = auth.uid()
  )
);

create policy "property_ical_feeds_delete_own"
on public.property_ical_feeds
for delete
using (
  exists (
    select 1 from public.properties p
    where p.id = property_id and p.user_id = auth.uid()
  )
);

-- Guest links created or updated from iCal sync
alter table public.guest_links
  add column if not exists link_source text not null default 'manual'
    check (link_source in ('manual', 'ical'));

alter table public.guest_links
  add column if not exists ical_feed_id uuid
    references public.property_ical_feeds(id) on delete set null;

alter table public.guest_links
  add column if not exists ical_uid text;

alter table public.guest_links
  add column if not exists check_in_date date;

create unique index if not exists idx_guest_links_ical_feed_uid
  on public.guest_links(ical_feed_id, ical_uid)
  where ical_uid is not null and ical_feed_id is not null;

create index if not exists idx_guest_links_ical_feed_id
  on public.guest_links(ical_feed_id)
  where ical_feed_id is not null;
