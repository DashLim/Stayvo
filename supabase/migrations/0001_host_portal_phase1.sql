-- Stayvo Phase 1: host portal + property setup

create extension if not exists pgcrypto;

-- Main property record (owned by the authenticated host).
create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  property_name text not null,
  full_address text not null,
  city text not null,
  state text not null,

  google_maps_url text,
  waze_url text,

  parking_details text,
  wifi_network_name text,
  wifi_password text,

  -- Host contact details shown in Phase 2 guest portal.
  host_name text not null,
  host_whatsapp_number text not null,
  host_response_time text not null,

  -- Phase 1 dashboard badge.
  is_live boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Check-in instructions (step-by-step).
create table if not exists public.property_check_in_steps (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  step_order integer not null,
  instruction text not null,
  created_at timestamptz not null default now(),
  unique(property_id, step_order)
);

-- House rules list.
create table if not exists public.property_house_rules (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  rule_order integer not null,
  rule_text text not null,
  created_at timestamptz not null default now(),
  unique(property_id, rule_order)
);

-- Guidebook tips shown in the Phase 2 guest portal.
create table if not exists public.property_guidebook_tips (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  tip_order integer not null,
  label text not null,
  description text not null default '',
  created_at timestamptz not null default now(),
  unique(property_id, tip_order)
);

-- Keep updated_at current.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_properties_updated_at on public.properties;
create trigger trg_properties_updated_at
before update on public.properties
for each row execute function public.set_updated_at();

-- Helpful indexes
create index if not exists idx_properties_user_id on public.properties(user_id);
create index if not exists idx_steps_property_id on public.property_check_in_steps(property_id);
create index if not exists idx_rules_property_id on public.property_house_rules(property_id);
create index if not exists idx_tips_property_id on public.property_guidebook_tips(property_id);

-- ------------------------
-- Row Level Security
-- ------------------------
alter table public.properties enable row level security;
alter table public.property_check_in_steps enable row level security;
alter table public.property_house_rules enable row level security;
alter table public.property_guidebook_tips enable row level security;

-- Ensure hosts (authenticated role) can access rows; RLS will restrict ownership.
grant all on table public.properties to authenticated;
grant all on table public.property_check_in_steps to authenticated;
grant all on table public.property_house_rules to authenticated;
grant all on table public.property_guidebook_tips to authenticated;

-- properties: hosts can only access their own rows.
create policy "properties_select_own"
on public.properties
for select
using (user_id = auth.uid());

create policy "properties_insert_own"
on public.properties
for insert
with check (user_id = auth.uid());

create policy "properties_update_own"
on public.properties
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "properties_delete_own"
on public.properties
for delete
using (user_id = auth.uid());

-- property_check_in_steps: permission is derived from the owning property.
create policy "steps_select_own"
on public.property_check_in_steps
for select
using (
  exists (
    select 1
    from public.properties p
    where p.id = property_id
      and p.user_id = auth.uid()
  )
);

create policy "steps_insert_own"
on public.property_check_in_steps
for insert
with check (
  exists (
    select 1
    from public.properties p
    where p.id = property_id
      and p.user_id = auth.uid()
  )
);

create policy "steps_update_own"
on public.property_check_in_steps
for update
using (
  exists (
    select 1
    from public.properties p
    where p.id = property_id
      and p.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.properties p
    where p.id = property_id
      and p.user_id = auth.uid()
  )
);

create policy "steps_delete_own"
on public.property_check_in_steps
for delete
using (
  exists (
    select 1
    from public.properties p
    where p.id = property_id
      and p.user_id = auth.uid()
  )
);

-- property_house_rules: permission is derived from the owning property.
create policy "rules_select_own"
on public.property_house_rules
for select
using (
  exists (
    select 1
    from public.properties p
    where p.id = property_id
      and p.user_id = auth.uid()
  )
);

create policy "rules_insert_own"
on public.property_house_rules
for insert
with check (
  exists (
    select 1
    from public.properties p
    where p.id = property_id
      and p.user_id = auth.uid()
  )
);

create policy "rules_update_own"
on public.property_house_rules
for update
using (
  exists (
    select 1
    from public.properties p
    where p.id = property_id
      and p.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.properties p
    where p.id = property_id
      and p.user_id = auth.uid()
  )
);

create policy "rules_delete_own"
on public.property_house_rules
for delete
using (
  exists (
    select 1
    from public.properties p
    where p.id = property_id
      and p.user_id = auth.uid()
  )
);

-- property_guidebook_tips: permission is derived from the owning property.
create policy "tips_select_own"
on public.property_guidebook_tips
for select
using (
  exists (
    select 1
    from public.properties p
    where p.id = property_id
      and p.user_id = auth.uid()
  )
);

create policy "tips_insert_own"
on public.property_guidebook_tips
for insert
with check (
  exists (
    select 1
    from public.properties p
    where p.id = property_id
      and p.user_id = auth.uid()
  )
);

create policy "tips_update_own"
on public.property_guidebook_tips
for update
using (
  exists (
    select 1
    from public.properties p
    where p.id = property_id
      and p.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.properties p
    where p.id = property_id
      and p.user_id = auth.uid()
  )
);

create policy "tips_delete_own"
on public.property_guidebook_tips
for delete
using (
  exists (
    select 1
    from public.properties p
    where p.id = property_id
      and p.user_id = auth.uid()
  )
);

