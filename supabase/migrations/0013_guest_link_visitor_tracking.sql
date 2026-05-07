-- Approximate open analytics: each browser stores a UUID in localStorage and reports it when the stay portal loads.

create table if not exists public.guest_link_visitors (
  id uuid primary key default gen_random_uuid(),
  guest_link_id uuid not null references public.guest_links (id) on delete cascade,
  visitor_key text not null,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  open_count integer not null default 1,
  constraint guest_link_visitors_visitor_key_format check (
    visitor_key ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  )
);

create unique index if not exists guest_link_visitors_link_visitor_uq
  on public.guest_link_visitors (guest_link_id, visitor_key);

create index if not exists idx_guest_link_visitors_guest_link_id
  on public.guest_link_visitors (guest_link_id);

alter table public.guest_link_visitors enable row level security;

revoke all on public.guest_link_visitors from public;
grant select on table public.guest_link_visitors to authenticated;

drop policy if exists "guest_link_visitors_select_own" on public.guest_link_visitors;
create policy "guest_link_visitors_select_own"
on public.guest_link_visitors
for select
to authenticated
using (
  exists (
    select 1
    from public.guest_links gl
    join public.properties p on p.id = gl.property_id
    where gl.id = guest_link_visitors.guest_link_id
      and p.user_id = auth.uid()
  )
);

-- Anonymous guests record opens via this RPC only (no direct inserts).
create or replace function public.record_guest_link_open(p_token text, p_visitor_key text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_link_id uuid;
  v_key text;
begin
  if p_token is null or length(trim(p_token)) < 1 then
    return false;
  end if;

  v_key := lower(trim(p_visitor_key));
  if v_key is null
     or v_key !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    return false;
  end if;

  select gl.id into v_link_id
  from public.guest_links gl
  where gl.token = trim(p_token)
    and (
      gl.is_permanent = true
      or gl.expires_at is null
      or gl.expires_at > now()
    );

  if v_link_id is null then
    return false;
  end if;

  insert into public.guest_link_visitors (
    guest_link_id,
    visitor_key,
    first_seen_at,
    last_seen_at,
    open_count
  )
  values (v_link_id, v_key, now(), now(), 1)
  on conflict (guest_link_id, visitor_key) do update
  set
    last_seen_at = now(),
    open_count = public.guest_link_visitors.open_count + 1;

  return true;
end;
$$;

grant execute on function public.record_guest_link_open(text, text) to anon, authenticated;

-- Host dashboard: aggregate stats (RLS applies via security invoker).
create or replace function public.get_guest_link_open_stats(p_link_ids uuid[])
returns table (
  guest_link_id uuid,
  device_count integer,
  total_opens bigint,
  last_open_at timestamptz
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    v.guest_link_id,
    count(*)::integer as device_count,
    coalesce(sum(v.open_count), 0)::bigint as total_opens,
    max(v.last_seen_at) as last_open_at
  from public.guest_link_visitors v
  where v.guest_link_id = any(p_link_ids)
  group by v.guest_link_id;
$$;

grant execute on function public.get_guest_link_open_stats(uuid[]) to authenticated;
