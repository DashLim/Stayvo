-- Stayvo Phase 2: guest links + public portal read function

create table if not exists public.guest_links (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  guest_name text not null,
  checkout_date date not null,
  expires_at timestamptz not null,
  token text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists idx_guest_links_property_id on public.guest_links(property_id);
create index if not exists idx_guest_links_token on public.guest_links(token);
create index if not exists idx_guest_links_expires_at on public.guest_links(expires_at);

alter table public.guest_links enable row level security;
grant all on table public.guest_links to authenticated;

drop policy if exists "guest_links_select_own" on public.guest_links;
drop policy if exists "guest_links_insert_own" on public.guest_links;
drop policy if exists "guest_links_update_own" on public.guest_links;
drop policy if exists "guest_links_delete_own" on public.guest_links;

create policy "guest_links_select_own"
on public.guest_links
for select
using (
  exists (
    select 1
    from public.properties p
    where p.id = property_id
      and p.user_id = auth.uid()
  )
);

create policy "guest_links_insert_own"
on public.guest_links
for insert
with check (
  exists (
    select 1
    from public.properties p
    where p.id = property_id
      and p.user_id = auth.uid()
  )
);

create policy "guest_links_update_own"
on public.guest_links
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

create policy "guest_links_delete_own"
on public.guest_links
for delete
using (
  exists (
    select 1
    from public.properties p
    where p.id = property_id
      and p.user_id = auth.uid()
  )
);

-- Public read function for /stay/[token]. This avoids exposing broad anon table
-- policies while still allowing anyone with the token to access portal content.
create or replace function public.get_guest_portal_by_token(p_token text)
returns table (
  property_id uuid,
  property_name text,
  full_address text,
  city text,
  state text,
  google_maps_url text,
  waze_url text,
  parking_details text,
  wifi_network_name text,
  wifi_password text,
  host_name text,
  host_whatsapp_number text,
  host_response_time text,
  guest_name text,
  checkout_date date,
  expires_at timestamptz,
  check_in_steps jsonb,
  house_rules jsonb,
  guidebook_tips jsonb
)
language sql
security definer
set search_path = public
as $$
  select
    p.id as property_id,
    p.property_name,
    p.full_address,
    p.city,
    p.state,
    p.google_maps_url,
    p.waze_url,
    p.parking_details,
    p.wifi_network_name,
    p.wifi_password,
    p.host_name,
    p.host_whatsapp_number,
    p.host_response_time,
    gl.guest_name,
    gl.checkout_date,
    gl.expires_at,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'step_order', s.step_order,
            'instruction', s.instruction
          )
          order by s.step_order
        )
        from public.property_check_in_steps s
        where s.property_id = p.id
      ),
      '[]'::jsonb
    ) as check_in_steps,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'rule_order', r.rule_order,
            'rule_text', r.rule_text
          )
          order by r.rule_order
        )
        from public.property_house_rules r
        where r.property_id = p.id
      ),
      '[]'::jsonb
    ) as house_rules,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'tip_order', t.tip_order,
            'label', t.label,
            'description', t.description
          )
          order by t.tip_order
        )
        from public.property_guidebook_tips t
        where t.property_id = p.id
      ),
      '[]'::jsonb
    ) as guidebook_tips
  from public.guest_links gl
  join public.properties p on p.id = gl.property_id
  where gl.token = p_token
  limit 1;
$$;

revoke all on function public.get_guest_portal_by_token(text) from public;
grant execute on function public.get_guest_portal_by_token(text) to anon;
grant execute on function public.get_guest_portal_by_token(text) to authenticated;

