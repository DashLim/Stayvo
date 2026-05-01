-- Phase 2 tweak: internal property name and optional legacy fields

alter table public.properties
add column if not exists internal_name text;

-- Legacy fields no longer shown in UI. Keep data model backward-compatible.
alter table public.properties
alter column city drop not null;

alter table public.properties
alter column state drop not null;

alter table public.properties
alter column host_response_time drop not null;

