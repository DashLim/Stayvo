'use client';

import { usePathname } from 'next/navigation';
import { useLayoutEffect, useState, type ReactNode } from 'react';
import { tryCreateSupabaseBrowserClient } from '@/lib/supabase/client';
import { isRefreshTokenUnusable } from '@/lib/supabase/auth-errors';

function isLoginPath(pathname: string | null) {
  if (!pathname) return false;
  const p = pathname.replace(/\/$/, '') || '/';
  return p === '/login';
}

/**
 * Clears broken Supabase sessions (missing/invalid refresh token) in the browser.
 * `/login` waits for cleanup before paint; other routes run cleanup in the background.
 */
export default function SupabaseSessionRecovery({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const blockUntilReady = isLoginPath(pathname ?? null);
  const [ready, setReady] = useState(() => !blockUntilReady);

  useLayoutEffect(() => {
    let cancelled = false;

    void (async () => {
      const supabase = tryCreateSupabaseBrowserClient();
      if (!supabase) {
        if (!cancelled) setReady(true);
        return;
      }
      try {
        const { error } = await supabase.auth.getSession();
        if (error && isRefreshTokenUnusable(error)) {
          await supabase.auth.signOut({ scope: 'local' });
        }
      } catch (err) {
        if (isRefreshTokenUnusable(err as { message?: string; code?: string })) {
          await supabase.auth.signOut({ scope: 'local' });
        }
      }
      if (!cancelled) setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  if (blockUntilReady && !ready) return null;
  return <>{children}</>;
}
