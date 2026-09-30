-- Legacy Stayvo Pro billing: drop live host_plan after archive export (e.g. host_plan_archive_20260930).
-- Do NOT drop or modify archive tables. Migrations 0019 and 0020 remain historical record only.
-- Apply only after app deploy no longer reads/writes host_plan and Stripe webhook is disabled.

drop trigger if exists on_auth_user_created_host_plan on auth.users;

drop function if exists public.handle_new_user_host_plan();

drop policy if exists "host_plan_select_own" on public.host_plan;

drop index if exists public.host_plan_stripe_subscription_idx;
drop index if exists public.host_plan_tier_idx;

drop table if exists public.host_plan;
