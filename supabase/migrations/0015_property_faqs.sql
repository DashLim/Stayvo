-- FAQ items per property (shown in guest portal accordion)
create table if not exists public.property_faqs (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  faq_order integer not null,
  question text not null,
  answer text not null,
  created_at timestamptz not null default now(),
  unique(property_id, faq_order)
);

create index if not exists idx_property_faqs_property_id on public.property_faqs(property_id);

alter table public.property_faqs enable row level security;
grant all on table public.property_faqs to authenticated;

drop policy if exists "faqs_select_own" on public.property_faqs;
create policy "faqs_select_own"
on public.property_faqs
for select
using (
  exists (
    select 1
    from public.properties p
    where p.id = property_id
      and p.user_id = auth.uid()
  )
);

drop policy if exists "faqs_insert_own" on public.property_faqs;
create policy "faqs_insert_own"
on public.property_faqs
for insert
with check (
  exists (
    select 1
    from public.properties p
    where p.id = property_id
      and p.user_id = auth.uid()
  )
);

drop policy if exists "faqs_update_own" on public.property_faqs;
create policy "faqs_update_own"
on public.property_faqs
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

drop policy if exists "faqs_delete_own" on public.property_faqs;
create policy "faqs_delete_own"
on public.property_faqs
for delete
using (
  exists (
    select 1
    from public.properties p
    where p.id = property_id
      and p.user_id = auth.uid()
  )
);

-- Recreate RPC to include faqs payload for guest portal
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
  host_whatsapp_message text,
  host_response_time text,
  guest_name text,
  checkout_date date,
  expires_at timestamptz,
  is_permanent boolean,
  guest_section_order jsonb,
  hero_image_path text,
  check_in_steps jsonb,
  house_rules jsonb,
  guidebook_tips jsonb,
  faqs jsonb,
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
    p.host_whatsapp_message,
    p.host_response_time,
    gl.guest_name,
    gl.checkout_date,
    gl.expires_at,
    gl.is_permanent,
    p.guest_section_order,
    p.hero_image_path,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'step_order', s.step_order,
            'instruction', s.instruction,
            'is_displayed', s.is_displayed,
            'drive_media_url', s.drive_media_url,
            'guest_image_path', s.guest_image_path
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
            'rule_text', r.rule_text,
            'is_displayed', r.is_displayed
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
            'description', t.description,
            'drive_media_url', t.drive_media_url,
            'guest_image_path', t.guest_image_path
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
            'faq_order', f.faq_order,
            'question', f.question,
            'answer', f.answer
          )
          order by f.faq_order
        )
        from public.property_faqs f
        where f.property_id = p.id
      ),
      '[]'::jsonb
    ) as faqs,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', d.id,
            'detail_order', d.detail_order,
            'title', d.title,
            'message', d.message,
            'is_displayed', d.is_displayed,
            'drive_media_url', d.drive_media_url,
            'guest_image_path', d.guest_image_path
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
