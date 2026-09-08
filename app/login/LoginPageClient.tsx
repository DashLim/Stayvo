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
  const requestedMode = searchParams.get('mode');
  const initialMode: AuthMode = requestedMode === 'signup' ? 'signup' : 'login';
  const configError = searchParams.get('error') === 'config';
  const authLinkError = searchParams.get('error') === 'auth';
  const accountDeleted = searchParams.get('deleted') === '1';

  const supabase = useMemo(() => tryCreateSupabaseBrowserClient(), []);

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

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

        {authLinkError ? (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            That sign-in or reset link is invalid or has expired.{' '}
            <Link href="/login/forgot-password" className="font-semibold underline-offset-2 hover:underline">
              Request a new password reset
            </Link>
            .
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
            <div className="mb-1 flex items-center justify-between gap-2">
              <label className="block text-sm font-medium text-slate-700">Password</label>
              {mode === 'login' ? (
                <Link
                  href="/login/forgot-password"
                  className="text-xs font-semibold text-brand underline-offset-2 hover:underline"
                >
                  Forgot password?
                </Link>
              ) : null}
            </div>
            <div className="relative">
              <input
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-11 text-sm text-slate-900 outline-none ring-brand/30 focus:ring-2"
                type={showPassword ? 'text' : 'password'}
                name="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={
                  mode === 'login' ? 'current-password' : 'new-password'
                }
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 z-10 flex w-11 items-center justify-center rounded-r-xl text-slate-600 transition hover:text-slate-900"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                )}
              </button>
            </div>
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

