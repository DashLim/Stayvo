import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getSupabasePublicEnv } from '@/lib/supabase/env';

export async function createSupabaseServerClient() {
  const env = getSupabasePublicEnv();
  if (!env) {
    redirect('/login?error=config');
  }

  const cookieStore = await cookies();

  return createServerClient(
    env.url,
    env.anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet, _headers) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Cookie writes can fail inside Server Components. Middleware/proxy
            // should refresh sessions and persist cookies when needed.
          }
        },
      },
    }
  );
}

