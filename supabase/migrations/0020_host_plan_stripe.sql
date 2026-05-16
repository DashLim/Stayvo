-- Stripe linkage for subscriptions; tier still driven by Stripe webhooks via service role.

alter table public.host_plan
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists subscription_status text,
  add column if not exists current_period_end timestamptz;

create index if not exists host_plan_stripe_subscription_idx
  on public.host_plan (stripe_subscription_id)
  where stripe_subscription_id is not null;

comment on column public.host_plan.stripe_customer_id is 'Stripe customer id (cus_...); set by Stripe webhook.';
comment on column public.host_plan.stripe_subscription_id is 'Stripe subscription id (sub_...); set by Stripe webhook.';
comment on column public.host_plan.subscription_status is 'Stripe subscription.status mirror; used with tier.';
comment on column public.host_plan.current_period_end is 'End of current billing period from Stripe.';
