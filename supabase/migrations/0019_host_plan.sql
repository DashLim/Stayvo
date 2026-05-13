-- Host subscription tier (Free / Pro). Only service role or SQL should set tier = 'pro';
-- authenticated users may read their own row.

create table if not exists public.host_plan (
  user_id uuid primary key references auth.users (id) on delete cascade,
  tier text not null default 'free' check (tier in ('free', 'pro')),
  updated_at timestamptz not null default now()
);

create index if not exists host_plan_tier_idx on public.host_plan (tier);

alter table public.host_plan enable row level security;

create policy "host_plan_select_own"
  on public.host_plan
  for select
  to authenticated
  using (auth.uid() = user_id);

-- New signups: default Free plan row (security definer bypasses RLS).
create or replace function public.handle_new_user_host_plan()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.host_plan (user_id, tier)
  values (new.id, 'free')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_host_plan on auth.users;
create trigger on_auth_user_created_host_plan
  after insert on auth.users
  for each row
  execute function public.handle_new_user_host_plan();

-- Existing accounts before this migration
insert into public.host_plan (user_id, tier)
select id, 'free' from auth.users
on conflict (user_id) do nothing;

comment on table public.host_plan is 'Host subscription tier; pro is set via admin/service role only.';
