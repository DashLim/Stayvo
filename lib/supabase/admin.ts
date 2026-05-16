import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/** Service-role client for webhooks only; respects RLS bypass. Never import in client bundles. */
export function getServiceRoleSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
