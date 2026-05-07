-- Reusable host media: one file in storage, many property sections can reference the same path.

create table if not exists public.host_media_assets (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  storage_path text not null,
  filename text not null,
  mime_type text,
  byte_size integer,
  created_at timestamptz not null default now(),
  unique (user_id, storage_path)
);

create index if not exists idx_host_media_assets_user_created
  on public.host_media_assets (user_id, created_at desc);

alter table public.host_media_assets enable row level security;

grant select, insert, update, delete on table public.host_media_assets to authenticated;

drop policy if exists "host_media_assets_select_own" on public.host_media_assets;
create policy "host_media_assets_select_own"
on public.host_media_assets for select
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "host_media_assets_insert_own" on public.host_media_assets;
create policy "host_media_assets_insert_own"
on public.host_media_assets for insert
to authenticated
with check (user_id = (select auth.uid()));

drop policy if exists "host_media_assets_delete_own" on public.host_media_assets;
create policy "host_media_assets_delete_own"
on public.host_media_assets for delete
to authenticated
using (user_id = (select auth.uid()));

-- Hosts may update metadata only on own rows (optional; mainly for future use).
drop policy if exists "host_media_assets_update_own" on public.host_media_assets;
create policy "host_media_assets_update_own"
on public.host_media_assets for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

notify pgrst, 'reload schema';
