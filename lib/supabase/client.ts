import { createBrowserClient } from '@supabase/ssr';
import { getSupabasePublicEnv } from '@/lib/supabase/env';

type BrowserSupabaseClient = ReturnType<typeof createBrowserClient>;
let browserClient: BrowserSupabaseClient | null | undefined;

/**
 * Single browser Supabase client per tab so auth recovery and login share one instance
 * (avoids duplicate refresh attempts).
 */
export function tryCreateSupabaseBrowserClient() {
  if (typeof window === 'undefined') return null;
  if (browserClient !== undefined) return browserClient;
  const env = getSupabasePublicEnv();
  if (!env) {
    browserClient = null;
    return null;
  }
  browserClient = createBrowserClient(env.url, env.anonKey);
  return browserClient;
}

export function createSupabaseBrowserClient() {
  const client = tryCreateSupabaseBrowserClient();
  if (!client) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
  }
  return client;
}

