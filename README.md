# Stayvo (Phase 1 + Phase 2)

Stayvo is a digital guest portal for short-term rental (STR) hosts.

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

1. Install dependencies.
2. Start the dev server:
   - `npm run dev`

## Vercel deployment

Set the same environment variables in Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL` (your deployed domain)

