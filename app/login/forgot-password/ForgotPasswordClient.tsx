'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import PressButton from '@/app/_components/PressButton';
import { buildAuthConfirmRedirect, RESET_PASSWORD_PATH } from '@/lib/auth-callback-url';
import { tryCreateSupabaseBrowserClient } from '@/lib/supabase/client';

export default function ForgotPasswordClient() {
  const supabase = useMemo(() => tryCreateSupabaseBrowserClient(), []);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (!supabase) {
        throw new Error(
          'Server configuration is incomplete. Ask the deployer to set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY on Vercel, then redeploy.'
        );
      }
      const submittedEmail = String(new FormData(e.currentTarget).get('email') ?? '').trim();
      setEmail(submittedEmail);
      if (!submittedEmail) {
        throw new Error('Email is required.');
      }

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(submittedEmail, {
        redirectTo: buildAuthConfirmRedirect(RESET_PASSWORD_PATH),
      });
      if (resetError) throw resetError;
      setSent(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unable to send reset email. Please try again.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
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
          <div className="mt-1 text-sm text-slate-600">Reset your password</div>
        </div>

        {sent ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              If an account exists for <span className="font-semibold">{email}</span>, we sent a
              password reset link. Check your inbox and spam folder.
            </div>
            <p className="text-sm text-slate-600">
              The link opens Stayvo so you can choose a new password, then takes you to the
              dashboard.
            </p>
            <Link
              href="/login"
              className="inline-block text-sm font-semibold text-brand underline-offset-2 hover:underline"
            >
              Back to log in
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-3">
            <p className="text-sm text-slate-600">
              Enter the email for your host account. We&apos;ll send a link to reset your password.
            </p>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
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
            {error ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}
            <PressButton
              disabled={submitting || !supabase}
              className="w-full rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-60"
            >
              {submitting ? 'Sending…' : 'Send reset link'}
            </PressButton>
            <Link
              href="/login"
              className="block text-center text-sm font-medium text-slate-600 underline-offset-2 hover:text-slate-900 hover:underline"
            >
              Back to log in
            </Link>
          </form>
        )}
      </section>
    </main>
  );
}
