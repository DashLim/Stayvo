-- Guest layout ordering + host-defined custom detail boxes

alter table public.properties
add column if not exists guest_section_order jsonb not null default
  '["address","parking","checkin","wifi","rules","guidebook","host"]'::jsonb;

create table if not exists public.property_custom_details (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  detail_order integer not null,
  title text not null,
  message text not null default '',
  created_at timestamptz not null default now(),
  unique(property_id, detail_order)
);

create index if not exists idx_custom_details_property_id
  on public.property_custom_details(property_id);

alter table public.property_custom_details enable row level security;
grant all on table public.property_custom_details to authenticated;

drop policy if exists "custom_details_select_own" on public.property_custom_details;
drop policy if exists "custom_details_insert_own" on public.property_custom_details;
drop policy if exists "custom_details_update_own" on public.property_custom_details;
drop policy if exists "custom_details_delete_own" on public.property_custom_details;

create policy "custom_details_select_own"
on public.property_custom_details
for select
using (
  exists (
    select 1
    from public.properties p
    where p.id = property_id
      and p.user_id = auth.uid()
  )
);

create policy "custom_details_insert_own"
on public.property_custom_details
for insert
with check (
  exists (
    select 1
    from public.properties p
    where p.id = property_id
      and p.user_id = auth.uid()
  )
);

create policy "custom_details_update_own"
on public.property_custom_details
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

create policy "custom_details_delete_own"
on public.property_custom_details
for delete
using (
  exists (
    select 1
    from public.properties p
    where p.id = property_id
      and p.user_id = auth.uid()
  )
);

-- Public portal: include host-managed section order and custom details.
drop function if exists public.get_guest_portal_by_token(text);

create function public.get_guest_portal_by_token(p_token text)
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
  is_permanent boolean,
  guest_section_order jsonb,
  check_in_steps jsonb,
  house_rules jsonb,
  guidebook_tips jsonb,
  custom_details jsonb
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
    gl.is_permanent,
    p.guest_section_order,
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
    ) as guidebook_tips,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', d.id,
            'detail_order', d.detail_order,
            'title', d.title,
            'message', d.message
          )
          order by d.detail_order
        )
        from public.property_custom_details d
        where d.property_id = p.id
      ),
      '[]'::jsonb
    ) as custom_details
  from public.guest_links gl
  join public.properties p on p.id = gl.property_id
  where gl.token = p_token
    and (
      gl.is_permanent = true
      or (gl.expires_at is not null and gl.expires_at > now())
    )
  limit 1;
$$;

revoke all on function public.get_guest_portal_by_token(text) from public;
grant execute on function public.get_guest_portal_by_token(text) to anon;
grant execute on function public.get_guest_portal_by_token(text) to authenticated;

notify pgrst, 'reload schema';
