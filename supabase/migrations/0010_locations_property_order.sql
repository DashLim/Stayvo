-- Locations group properties; ordering for dashboard; draft properties hidden from main dashboard

create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_locations_user_sort on public.locations (user_id, sort_order);

-- Ensures updated_at is maintained (also defined in 0001; repeated here for DBs where 0001 differed).
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_locations_updated_at on public.locations;
create trigger trg_locations_updated_at
before update on public.locations
for each row execute function public.set_updated_at();

alter table public.properties
add column if not exists location_id uuid references public.locations(id) on delete restrict;

alter table public.properties
add column if not exists sort_order integer not null default 0;

-- Backfill: one "General" location per host that has properties
insert into public.locations (user_id, name, sort_order)
select distinct p.user_id, 'General', 0
from public.properties p
where not exists (
  select 1 from public.locations l where l.user_id = p.user_id
);

update public.properties p
set location_id = l.id
from public.locations l
where l.user_id = p.user_id
  and l.name = 'General'
  and p.location_id is null;

alter table public.properties alter column location_id set not null;

create index if not exists idx_properties_location_sort on public.properties (location_id, sort_order);

alter table public.locations enable row level security;

grant select, insert, update, delete on table public.locations to authenticated;

drop policy if exists "locations_select_own" on public.locations;
create policy "locations_select_own"
on public.locations for select
using (user_id = auth.uid());

drop policy if exists "locations_insert_own" on public.locations;
create policy "locations_insert_own"
on public.locations for insert
with check (user_id = auth.uid());

drop policy if exists "locations_update_own" on public.locations;
create policy "locations_update_own"
on public.locations for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "locations_delete_own" on public.locations;
create policy "locations_delete_own"
on public.locations for delete
using (user_id = auth.uid());

notify pgrst, 'reload schema';
