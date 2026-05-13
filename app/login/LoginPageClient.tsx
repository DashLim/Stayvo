'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PressButton from '@/app/_components/PressButton';
import { tryCreateSupabaseBrowserClient } from '@/lib/supabase/client';

type AuthMode = 'login' | 'signup';

export default function LoginPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') ?? '/dashboard';
  const configError = searchParams.get('error') === 'config';
  const accountDeleted = searchParams.get('deleted') === '1';

  const supabase = useMemo(() => tryCreateSupabaseBrowserClient(), []);

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [agreedToLegal, setAgreedToLegal] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const hadDark = root.classList.contains('dark');
    if (hadDark) {
      root.classList.remove('dark');
    }
    return () => {
      if (hadDark) {
        root.classList.add('dark');
      }
    };
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const submittedEmail = String(formData.get('email') ?? '').trim();
    const submittedPassword = String(formData.get('password') ?? '');

    // iOS autofill can populate DOM inputs without triggering React onChange.
    // Sync state from submitted form values so login works consistently.
    setEmail(submittedEmail);
    setPassword(submittedPassword);

    setError(null);
    setInfo(null);
    if (!agreedToLegal) {
      setError('Please agree to the Terms of Service and Privacy Policy to continue.');
      return;
    }
    setSubmitting(true);
    try {
      if (!supabase) {
        throw new Error(
          'Server configuration is incomplete. Ask the deployer to set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY on Vercel, then redeploy.'
        );
      }
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: submittedEmail,
          password: submittedPassword,
        });
        if (error) throw error;
        router.replace(redirect);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: submittedEmail,
        password: submittedPassword,
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
          <Image
            src="/brand/stayvo-logo-lockup.png"
            alt="Stayvo"
            width={1024}
            height={449}
            priority
            className="h-14 w-auto sm:h-16"
          />
          <div className="mt-1 text-sm text-slate-600">Host portal login</div>
        </div>

        {accountDeleted ? (
          <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800">
            Your account was deleted. You can create a new one below if you need access again.
          </div>
        ) : null}

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
          <PressButton
            type="button"
            className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium transition ${
              mode === 'login'
                ? 'bg-brand text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
            onClick={() => setMode('login')}
          >
            Log in
          </PressButton>
          <PressButton
            type="button"
            className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium transition ${
              mode === 'signup'
                ? 'bg-brand text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
            onClick={() => setMode('signup')}
          >
            Sign up
          </PressButton>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-brand/30 focus:ring-2"
              type="email"
              name="email"
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
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-brand/30 focus:ring-2"
              type="password"
              name="password"
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

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={agreedToLegal}
              onChange={(e) => setAgreedToLegal(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 accent-brand"
              aria-required="true"
            />
            <span>
              I agree to the{' '}
              <Link href="/terms" className="font-semibold text-brand underline-offset-2 hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="font-semibold text-brand underline-offset-2 hover:underline">
                Privacy Policy
              </Link>
              .
            </span>
          </label>

          <PressButton
            disabled={submitting || !supabase || !agreedToLegal}
            className="w-full rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-60"
          >
            {submitting
              ? 'Please wait...'
              : mode === 'login'
                ? 'Log in'
                : 'Create account'}
          </PressButton>
        </form>
      </section>
    </main>
  );
}

