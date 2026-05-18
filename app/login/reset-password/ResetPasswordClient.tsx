'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import PressButton from '@/app/_components/PressButton';
import { tryCreateSupabaseBrowserClient } from '@/lib/supabase/client';

export default function ResetPasswordClient() {
  const router = useRouter();
  const supabase = useMemo(() => tryCreateSupabaseBrowserClient(), []);
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!supabase) {
        if (!cancelled) {
          setHasSession(false);
          setCheckingSession(false);
        }
        return;
      }
      const { data } = await supabase.auth.getSession();
      if (!cancelled) {
        setHasSession(Boolean(data.session));
        setCheckingSession(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== password2) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      if (!supabase) {
        throw new Error('Supabase is not configured.');
      }
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      router.replace('/dashboard');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Unable to update password. Please try again.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (checkingSession) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center">
        <p className="text-sm text-slate-600">Loading…</p>
      </main>
    );
  }

  if (!hasSession) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center">
        <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h1 className="text-lg font-semibold text-slate-900">Reset link expired or invalid</h1>
          <p className="mt-2 text-sm text-slate-600">
            Request a new password reset email and open the latest link from your inbox.
          </p>
          <Link
            href="/login/forgot-password"
            className="mt-4 inline-block text-sm font-semibold text-brand underline-offset-2 hover:underline"
          >
            Send reset link again
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-[70vh] items-center justify-center">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <Image
            src="/brand/stayvo-logo-lockup.png"
            alt="Stayvo"
            width={1024}
            height={449}
            priority
            className="h-14 w-auto sm:h-16"
          />
          <div className="mt-1 text-sm text-slate-600">Choose a new password</div>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">New password</label>
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-brand/30 focus:ring-2"
              type="password"
              name="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Confirm new password
            </label>
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-brand/30 focus:ring-2"
              type="password"
              name="password2"
              required
              minLength={8}
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}
          <PressButton
            disabled={submitting}
            className="w-full rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-60"
          >
            {submitting ? 'Saving…' : 'Update password'}
          </PressButton>
        </form>
      </section>
    </main>
  );
}
