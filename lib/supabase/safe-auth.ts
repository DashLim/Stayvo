import type { User } from '@supabase/supabase-js';
import { isRefreshTokenUnusable } from '@/lib/supabase/auth-errors';

type AuthClient = {
  auth: {
    getUser: () => Promise<{
      data: { user: User | null };
      error: { message?: string; code?: string } | null;
    }>;
    signOut: (options?: { scope?: 'local' | 'global' }) => Promise<unknown>;
  };
};

/** getUser that clears broken cookies instead of throwing (SSR / middleware). */
export async function safeGetUser(supabase: AuthClient): Promise<User | null> {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      if (isRefreshTokenUnusable(error)) {
        await supabase.auth.signOut({ scope: 'local' });
      }
      return null;
    }
    return data.user;
  } catch (err) {
    if (isRefreshTokenUnusable(err as { message?: string; code?: string })) {
      await supabase.auth.signOut({ scope: 'local' });
    }
    return null;
  }
}
