'use server';

import { SUPPORT_EMAIL } from '@/lib/support-email';

import { revalidatePath } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getSupabasePublicEnv } from '@/lib/supabase/env';
import {
  isForbiddenHostDisplayNameForGuestPath,
  sanitizeHostDisplayNameInput,
} from '@/lib/guest-portal-url';

function normalize(s: string | null | undefined) {
  return (s ?? '').trim();
}

export async function updateHostProfileEmail(newEmail: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: 'Not signed in.' };

  const email = normalize(newEmail);
  if (!email) return { ok: false as const, error: 'Email is required.' };

  const { error } = await supabase.auth.updateUser({ email });
  if (error) return { ok: false as const, error: error.message };

  revalidatePath('/dashboard/profile');
  return { ok: true as const, message: 'If your project requires email confirmation, check your inbox to confirm the new address.' };
}

export async function updateHostProfilePassword(newPassword: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: 'Not signed in.' };

  const password = normalize(newPassword);
  if (password.length < 8) {
    return { ok: false as const, error: 'Password must be at least 8 characters.' };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { ok: false as const, error: error.message };

  revalidatePath('/dashboard/profile');
  return { ok: true as const };
}

/** Stored on auth user metadata; optional hint for your account (listing names stay per-property). */
export async function updateHostDisplayName(displayName: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: 'Not signed in.' };

  const name = sanitizeHostDisplayNameInput(normalize(displayName));
  if (isForbiddenHostDisplayNameForGuestPath(name)) {
    return {
      ok: false as const,
      error:
        'That name maps to a reserved URL path. Use letters and numbers that are not a system path (e.g. api, login, dashboard).',
    };
  }
  const { error } = await supabase.auth.updateUser({
    data: { host_display_name: name || null },
  });
  if (error) return { ok: false as const, error: error.message };

  revalidatePath('/dashboard/profile');
  return { ok: true as const };
}

export async function signOutHost() {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();
  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/', 'layout');
  return { ok: true as const };
}

export async function deleteHostAccount() {
  const env = getSupabasePublicEnv();
  if (!env) return { ok: false as const, error: 'Configuration error.' };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: 'Not signed in.' };

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceKey) {
    return {
      ok: false as const,
      error:
        `Self-service deletion is not configured. Add SUPABASE_SERVICE_ROLE_KEY on the server or email ${SUPPORT_EMAIL}.`,
    };
  }

  const admin = createClient(env.url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return { ok: false as const, error: error.message };

  try {
    await supabase.auth.signOut();
  } catch {
    /* User row is gone; session cleanup may fail — still treat delete as success */
  }
  return { ok: true as const };
}
