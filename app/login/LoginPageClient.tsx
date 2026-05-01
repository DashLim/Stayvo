'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { tryCreateSupabaseBrowserClient } from '@/lib/supabase/client';

type AuthMode = 'login' | 'signup';

export default function LoginPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') ?? '/dashboard';
  const configError = searchParams.get('error') === 'config';

  const supabase = useMemo(() => tryCreateSupabaseBrowserClient(), []);

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSubmitting(true);
    try {
      if (!supabase) {
        throw new Error(
          'Server configuration is incomplete. Ask the deployer to set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY on Vercel, then redeploy.'
        );
      }
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.replace(redirect);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;

      if (data?.session) {
        router.replace(redirect);
        return;
      }

      setInfo(
        'Account created. If email confirmations are enabled, please check your inbox to log in.'
      );
    } catch (err: any) {
      setError(err?.message ?? 'Unable to authenticate. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-[70vh] flex items-center justify-center">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <div className="text-xl font-semibold tracking-tight">Stayvo</div>
          <div className="mt-1 text-sm text-slate-600">Host portal login</div>
        </div>

        {!supabase || configError ? (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <p className="font-medium">Supabase environment variables are missing</p>
            <p className="mt-1 text-amber-800">
              In the Vercel project, add{' '}
              <code className="rounded bg-amber-100 px-1">NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
              <code className="rounded bg-amber-100 px-1">
                NEXT_PUBLIC_SUPABASE_ANON_KEY
              </code>{' '}
              (from Supabase → Project Settings → API), save, then redeploy the latest commit.
            </p>
          </div>
        ) : null}

        <div className="mb-4 flex gap-2">
          <button
            type="button"
            className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium transition ${
              mode === 'login'
                ? 'bg-brand text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
            onClick={() => setMode('login')}
          >
            Log in
          </button>
          <button
            type="button"
            className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium transition ${
              mode === 'signup'
                ? 'bg-brand text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
            onClick={() => setMode('signup')}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand/30 focus:ring-2"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand/30 focus:ring-2"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={
                mode === 'login' ? 'current-password' : 'new-password'
              }
            />
          </div>

          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}
          {info ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              {info}
            </div>
          ) : null}

          <button
            disabled={submitting || !supabase}
            className="w-full rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-60"
          >
            {submitting
              ? 'Please wait...'
              : mode === 'login'
                ? 'Log in'
                : 'Create account'}
          </button>
        </form>
      </section>
    </main>
  );
}

