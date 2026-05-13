'use client';

import { usePathname } from 'next/navigation';
import { useLayoutEffect, useState, type ReactNode } from 'react';
import { tryCreateSupabaseBrowserClient } from '@/lib/supabase/client';

function isRefreshTokenUnusable(err: { message?: string } | null): boolean {
  if (!err?.message) return false;
  const m = err.message;
  return (
    m.includes('Invalid Refresh Token') || m.includes('Refresh Token Not Found')
  );
}

function isLoginPath(pathname: string | null) {
  if (!pathname) return false;
  const p = pathname.replace(/\/$/, '') || '/';
  return p === '/login';
}

/**
 * Clears broken Supabase sessions (missing/invalid refresh token) before any page
 * creates a browser client — avoids AuthApiError spam from `LoginPageClient` mounting
 * before recovery ran.
 *
 * Only gates `/login` so marketing routes (e.g. `/`) keep full SSR HTML.
 */
export default function SupabaseSessionRecovery({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const needsClientCleanup = isLoginPath(pathname ?? null);
  const [ready, setReady] = useState(() => !needsClientCleanup);

  useLayoutEffect(() => {
    if (!needsClientCleanup) {
      setReady(true);
      return;
    }

    setReady(false);
    let cancelled = false;

    void (async () => {
      const supabase = tryCreateSupabaseBrowserClient();
      if (!supabase) {
        if (!cancelled) setReady(true);
        return;
      }
      const { error } = await supabase.auth.getSession();
      if (cancelled) return;
      if (error && isRefreshTokenUnusable(error)) {
        await supabase.auth.signOut({ scope: 'local' });
      }
      setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [needsClientCleanup]);

  if (!ready) return null;
  return <>{children}</>;
}
