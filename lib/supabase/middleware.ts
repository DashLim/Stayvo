import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { isRefreshTokenUnusable } from '@/lib/supabase/auth-errors';
import { getSupabasePublicEnv } from '@/lib/supabase/env';

export async function updateSession(request: NextRequest) {
  const env = getSupabasePublicEnv();
  if (!env) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('error', 'config');
    return NextResponse.redirect(url);
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    env.url,
    env.anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          // Sync cookies to the request (so subsequent middleware can access them),
          // then write cookies to the outgoing response.
          cookiesToSet.forEach(({ name, value }) => {
            // NextRequest cookies.set only accepts (name, value).
            request.cookies.set(name, value);
          });

          response = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });

          Object.entries(headers).forEach(([key, value]) => {
            response.headers.set(key, value);
          });
        },
      },
    }
  );

  // Keep session in sync; clear stale cookies so RSC does not throw AuthApiError.
  let user: { sub?: string } | undefined;
  try {
    const { data, error } = await supabase.auth.getClaims();
    if (error && isRefreshTokenUnusable(error)) {
      await supabase.auth.signOut({ scope: 'local' });
    } else {
      user = data?.claims;
    }
  } catch (err) {
    if (isRefreshTokenUnusable(err as { message?: string; code?: string })) {
      await supabase.auth.signOut({ scope: 'local' });
    }
  }

  const pathname = request.nextUrl.pathname;
  const isProtected =
    pathname.startsWith('/dashboard') || pathname.startsWith('/properties');

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

