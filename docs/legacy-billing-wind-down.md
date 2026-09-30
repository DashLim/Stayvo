# Legacy Stripe billing wind-down (Stayvo Check-in)

Operational record for removing legacy **Stayvo Pro** billing while **Stayvo Check-in** stays permanently free.

## Current state

| Area | Status |
|------|--------|
| Check-in product | **Free** — full host features for signed-in Supabase users (`lib/check-in-access.ts`). |
| New Stripe subscriptions | **Not possible** — checkout/portal/webhook **removed from app**; Stripe webhook **disabled** in Dashboard. |
| Check-in UI | No billing, Pro tier, or subscription controls. |
| Application Stripe code | **Removed** (no `/api/stripe/*`, no `stripe` npm package, no `STRIPE_*` in `.env.example`). |
| Stripe Dashboard | **0** active subscriptions (verified); **Stayvo Pro webhook** **disabled**. |
| Live database `host_plan` | **Still present** until migration **`0024_remove_legacy_host_plan.sql`** is **applied** in Supabase (not applied from repo-only work). |
| Auth trigger | **`on_auth_user_created_host_plan`** still runs on new signups in live DB until **`0024`** is applied. |
| Historical archive | **`public.host_plan_archive_20260930`** — **17 rows** (matches source export); **must be retained**; **do not drop** in `0024`. |
| Historical migrations | **`0019_host_plan.sql`**, **`0020_host_plan_stripe.sql`** — never edit or delete. |

## Prepared migration (NOT applied)

**File:** `supabase/migrations/0024_remove_legacy_host_plan.sql`

Drops (when applied):

- Trigger `on_auth_user_created_host_plan` on `auth.users`
- Function `public.handle_new_user_host_plan()`
- RLS policy `host_plan_select_own`
- Indexes `host_plan_stripe_subscription_idx`, `host_plan_tier_idx`
- Table `public.host_plan`

Does **not** reference or drop `host_plan_archive_20260930`.

**Apply only after:** this app version is deployed (no Stripe routes), archive verified, Stripe webhook already disabled.

## Completed wind-down checklist

- [x] Export / archive `host_plan` → `host_plan_archive_20260930`
- [x] Verify Stripe zero active subscriptions
- [x] Disable Stripe webhook in Dashboard
- [x] Remove portal / webhook / checkout routes and Stripe libraries from app
- [x] Remove `stripe` npm package
- [x] Remove Stripe env vars from `.env.example`
- [x] Prepare forward DB migration **`0024`** (do not apply until deploy + ops sign-off)
- [ ] **Apply `0024` on Supabase** (production/staging as appropriate)
- [ ] Remove obsolete **`STRIPE_*`** from Vercel/host env (manual; not done in app commit)
- [ ] Final legal/docs pass if any copy still implies live Stripe integration

## Related docs

- `docs/stayvo-identity.md` — Check-in access vs legacy billing data.
- `docs/legal-pages-checklist.md` — Terms/Privacy vs product behavior.
- Terms §11 / Privacy — historical Stripe and legacy Pro context retained; support contact for legacy billing questions.
