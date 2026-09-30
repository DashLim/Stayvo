# Stayvo identity & access (Check-in)

Developer reference for how host authentication and product access work in **Stayvo Check-in**, and how **Stayvo Core** will relate in the future.

## Current architecture (implemented)

```
Stayvo Check-in
└── Supabase Auth
    └── auth.users (identity source of truth for hosts)
```

- Hosts sign up, sign in, confirm email, and reset passwords through **Supabase Auth** only.
- Protected routes (`/dashboard`, `/properties`) require a valid Supabase session (see `lib/supabase/middleware.ts` and `proxy.ts`).
- **Stayvo Check-in is a free product** — no active subscription is required for host features.
- **Check-in product access** is modeled separately from billing: any signed-in Supabase user with a non-empty `auth.users.id` has full Check-in features (`lib/check-in-access.ts`).
- Host-facing data (properties, locations, guest links, media, iCal) is scoped by **`user_id` = `auth.uid()`** in Postgres RLS.
- Optional profile hint **`host_display_name`** is stored on **`auth.users` user metadata** (not a separate profiles table).

**Legacy Stripe (transitional — cleanup pending)**

- **`POST /api/stripe/checkout`** — disabled (410); new Pro checkout is not offered (`lib/stripe-legacy-billing.ts`).
- **`POST /api/stripe/portal`** and **`POST /api/webhooks/stripe`** — retained temporarily for legacy billing records and Stripe sync.
- **`host_plan`** table and signup trigger — retained temporarily; not used for Check-in feature gates. The app UI no longer exposes Pro/tier or legacy billing controls; see `lib/host-plan.ts` for server-side reads used by Stripe routes only.

```
Stayvo Core (separate product — not in this repo)
└── Firebase Auth
```

**Do not** migrate Check-in to Firebase Auth. **Do not** merge Check-in and Core databases.

## Future architecture (not implemented)

```
Stayvo Core user (Firebase Auth)
    → Stayvo provisioning / API layer
    → Check-in access decision
    → Supabase identity mapping (e.g. link Firebase uid ↔ auth.users)
```

This layer will decide when a Core user receives Check-in access and how their host identity is represented in Supabase. **None of this is built yet** in the Check-in app or database.

## Code map (Check-in)

| Concern | Location |
|--------|----------|
| Session refresh & route protection | `lib/supabase/middleware.ts`, `proxy.ts` |
| Server Supabase client | `lib/supabase/server.ts` |
| Check-in product access | `lib/check-in-access.ts` |
| Legacy billing tier (server/Stripe only) | `lib/host-plan.ts`, `host_plan` table |
| Check-in entitlements (limits) | `lib/host-tier.ts` |
| Dashboard host context | `app/dashboard/_components/CheckInHostProvider.tsx` |
| Profile (Check-in access only) | `app/dashboard/profile/*` |
| Legacy checkout (disabled) | `POST /api/stripe/checkout` → 410; see `lib/stripe-legacy-billing.ts` |
| Legacy portal (temporary) | `POST /api/stripe/portal` |
| Legacy Stripe webhooks (temporary) | `POST /api/webhooks/stripe` |
| Guest portal access | Token-based `/stay/[token]` — **unchanged**; not Supabase host auth |

## Coupling that affects future identity mapping

These are intentional today but will need design when Core provisioning exists:

1. **`auth.users.id` as sole host key** — All `properties.user_id`, `locations.user_id`, RLS policies, and storage paths assume the Supabase Auth UUID. A provisioned user will likely need a real or mapped `auth.users` row (or a schema extension — not added in Phase 4).

2. **No external identity column** — There is no `core_user_id`, `firebase_uid`, or provisioning table yet. Mapping must be added deliberately later (with migrations), not assumed.

3. **`host_display_name` in user metadata** — Convenient for guest URL slugs; provisioning should set or validate this when creating/linking users.

4. **`host_plan.user_id` → auth.users** — Billing is tied to the same UUID. Core provisioning should not conflate “has Check-in access” with “has Pro subscription.”

5. **Account deletion** — `deleteHostAccount` removes the Supabase Auth user via service role; Core-side lifecycle must stay coordinated externally until a unified account model exists.

6. **Middleware model** — Access is binary (session present or redirect to login). Future provisioning might require checking a claim, database flag, or edge call in addition to `getUser()`.

## Phase boundaries

- **Check-in access foundation:** Supabase Auth; Check-in access separate from billing; no Firebase in this repo.
- **Billing wind-down (in progress):** Checkout disabled; portal/webhook/`host_plan` retained until infrastructure removal is approved.
- **Not implemented:** Stayvo Core (Firebase Auth, separate database, provisioning/identity mapping API).
