# Stayvo Check-in

Stayvo Check-in is the digital guest portal product from **Stayvo** for short-term rental (STR) hosts.

Phase 1 includes:
- Host authentication (Supabase Auth: email/password)
- Host dashboard (properties list + live/draft badge)
- Property setup (create/edit property profile with nested instructions, rules, tips)

Phase 2 includes:
- Guest link generation (tokenized shareable links)
- Extend existing guest links (same token, updated expiry)
- Public guest portal page at `/stay/[token]`
- Link expiry handling (`checkout + 2 days`)

## Configure Supabase

1. Create a Supabase project.
2. Run SQL migrations in order:
   - `supabase/migrations/0001_host_portal_phase1.sql`
   - `supabase/migrations/0002_guest_links_phase2.sql`
3. In Supabase, configure authentication as needed (email confirmations may affect sign up UX).
4. Copy API keys to your `.env`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Run locally

1. Use **Node 20 or 22** (`node -v`). Node 24 often hangs `next dev` on macOS; the repo includes `.nvmrc` (22) for nvm/fnm.
2. Install dependencies: `npm install`
3. Start the dev server: `npm run dev` (opens on http://localhost:3000)
   - LAN / phone testing: `npm run dev:lan`
   - If dev is stuck, use production locally: `npm run build && npm start`

## Vercel deployment

Set the same environment variables in Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL` (your deployed domain, e.g. `https://app.stayvo.io`)
- Stripe (legacy Pro billing / wind-down): `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID_MONTHLY`, `STRIPE_PRICE_ID_ANNUAL`, `STRIPE_WEBHOOK_SECRET`, and `SUPABASE_SERVICE_ROLE_KEY` (webhook updates `host_plan`). Apply migration `supabase/migrations/0020_host_plan_stripe.sql`. Stayvo Check-in features do not require Stripe.

## Legal pages

Terms and Privacy: `app/terms/page.tsx`, `app/privacy/page.tsx`. When you change billing, pricing, data collection, or support contact, follow **`docs/legal-pages-checklist.md`** and bump each page’s `LAST_UPDATED` date.
