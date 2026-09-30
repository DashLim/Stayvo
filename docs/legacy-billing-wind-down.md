# Legacy Stripe billing wind-down (Stayvo Check-in)

Operational checklist for removing legacy **Stayvo Pro** billing infrastructure while **Stayvo Check-in** remains permanently free.

## Current state (application)

| Area | Status |
|------|--------|
| Check-in product | **Free** — full host features for any signed-in Supabase user (`lib/check-in-access.ts`). |
| New Stripe subscriptions | **Disabled** — `POST /api/stripe/checkout` returns **HTTP 410** (`lib/stripe-legacy-billing.ts`). |
| Check-in UI | **No** links or controls for billing, Pro tier, or Manage subscription. |
| Legacy portal | **`POST /api/stripe/portal`** still exists (no in-app caller; authenticated API only). |
| Legacy webhook | **`POST /api/webhooks/stripe`** still exists; syncs Stripe subscription events to `host_plan` via service role. |
| Database | **`public.host_plan`** table and **`on_auth_user_created_host_plan`** trigger on `auth.users` still active. |
| Migrations | **`0019_host_plan.sql`**, **`0020_host_plan_stripe.sql`** — historical; **never edit or delete**. Final drop uses a **new forward migration**. |

## Audit notes (Sep 2026)

- No **active / trialing / past_due** Stripe subscriptions were reported during the pre-cleanup audit.
- **`getHostTier()` / `lib/host-plan.ts`** were removed as dead code; tier is written by webhooks only, not read for Check-in gates.
- Check-in entitlements use **`lib/host-tier.ts`** constants (not `host_plan.tier`).

## Before destructive database cleanup

1. **Export / archive `host_plan`** (CSV or Supabase table dump) for support, disputes, and retention policy.
2. **Re-verify in Stripe Dashboard** that no subscriptions remain in billable states.
3. **Disable the Stripe webhook** endpoint pointing at `/api/webhooks/stripe` **before** removing the webhook route from the app (avoid orphaned events or failed deliveries during deploy windows).

## Remaining wind-down stages (TODO)

Use this order unless a step explicitly depends on the previous one.

- [ ] **Export / archive** current `host_plan` rows (all columns including Stripe IDs).
- [ ] **Verify Stripe** — zero active/trialing/past_due subscriptions (Dashboard + optional API export).
- [ ] **Disable Stripe webhook** in Dashboard (after last needed sync event, or immediately before route removal deploy).
- [ ] **Remove application routes:** `/api/stripe/portal`, `/api/webhooks/stripe`, `/api/stripe/checkout` (and dependent `lib/stripe-*` modules except any shared utilities).
- [ ] **Remove Stripe libraries** from the codebase (`lib/stripe-customer.ts`, `lib/stripe-sync-host-plan.ts`, `lib/stripe-legacy-billing.ts`, `lib/stripe-server.ts`, tests tied to removed routes).
- [ ] **Remove `stripe` npm package** from `package.json` / lockfile after build passes without imports.
- [ ] **Remove Stripe env vars** from deployment and `.env.example` (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, price ID vars if unused).
- [ ] **Forward Supabase migration:** drop trigger `on_auth_user_created_host_plan`, function `handle_new_user_host_plan`, RLS policy `host_plan_select_own`, indexes, then table `host_plan`. Do **not** modify migrations `0019` or `0020`.
- [ ] **Final legal / docs cleanup** — Terms §11, Privacy §3/§6, `docs/legal-pages-checklist.md`, README Stripe section, after infra is gone (separate from app-only dead-code passes).

## What stays unchanged until the stages above

- **`HostTier`** type in `lib/host-tier.ts` (used by `lib/stripe-sync-host-plan.ts` until webhook code is removed).
- **Stripe package and env vars** in production until routes are removed and webhook is disabled.
- **Terms / Privacy** historical legacy billing language until the dedicated legal update.

## Related docs

- `docs/stayvo-identity.md` — Check-in access vs billing separation.
- `docs/legal-pages-checklist.md` — legal copy vs product behavior (update after wind-down completes).
