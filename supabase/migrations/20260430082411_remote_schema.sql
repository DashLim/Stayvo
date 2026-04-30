drop extension if exists "pg_net";

drop trigger if exists "trg_properties_updated_at" on "public"."properties";

drop policy "guest_links_delete_own" on "public"."guest_links";

drop policy "guest_links_insert_own" on "public"."guest_links";

drop policy "guest_links_select_own" on "public"."guest_links";

drop policy "guest_links_update_own" on "public"."guest_links";

revoke delete on table "public"."guest_links" from "anon";

revoke insert on table "public"."guest_links" from "anon";

revoke references on table "public"."guest_links" from "anon";

revoke select on table "public"."guest_links" from "anon";

revoke trigger on table "public"."guest_links" from "anon";

revoke truncate on table "public"."guest_links" from "anon";

revoke update on table "public"."guest_links" from "anon";

revoke delete on table "public"."guest_links" from "authenticated";

revoke insert on table "public"."guest_links" from "authenticated";

revoke references on table "public"."guest_links" from "authenticated";

revoke select on table "public"."guest_links" from "authenticated";

revoke trigger on table "public"."guest_links" from "authenticated";

revoke truncate on table "public"."guest_links" from "authenticated";

revoke update on table "public"."guest_links" from "authenticated";

revoke delete on table "public"."guest_links" from "service_role";

revoke insert on table "public"."guest_links" from "service_role";

revoke references on table "public"."guest_links" from "service_role";

revoke select on table "public"."guest_links" from "service_role";

revoke trigger on table "public"."guest_links" from "service_role";

revoke truncate on table "public"."guest_links" from "service_role";

revoke update on table "public"."guest_links" from "service_role";

alter table "public"."guest_links" drop constraint "guest_links_property_id_fkey";

alter table "public"."guest_links" drop constraint "guest_links_token_key";

drop function if exists "public"."get_guest_portal_by_token"(p_token text);

drop function if exists "public"."set_updated_at"();

alter table "public"."guest_links" drop constraint "guest_links_pkey";

drop index if exists "public"."guest_links_pkey";

drop index if exists "public"."guest_links_token_key";

drop index if exists "public"."idx_guest_links_expires_at";

drop index if exists "public"."idx_guest_links_property_id";

drop index if exists "public"."idx_guest_links_token";

drop index if exists "public"."idx_properties_user_id";

drop table "public"."guest_links";


