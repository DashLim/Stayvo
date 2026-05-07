-- Deduplicate uploads per user by content hash (same bytes → one storage object).

alter table public.host_media_assets
add column if not exists content_sha256 text;

create unique index if not exists idx_host_media_assets_user_sha256
on public.host_media_assets (user_id, content_sha256)
where content_sha256 is not null;

notify pgrst, 'reload schema';
