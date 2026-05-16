'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import {
  deleteHostAccount,
  signOutHost,
  updateHostDisplayName,
  updateHostProfileEmail,
  updateHostProfilePassword,
} from '@/app/actions/host-account';
import PressButton from '@/app/_components/PressButton';
import ThemeToggle from '@/app/_components/ThemeToggle';
import { guestPortalAbsoluteUrl, sanitizeHostDisplayNameInput } from '@/lib/guest-portal-url';
import type { HostTier } from '@/lib/host-tier';
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from '@/lib/support-email';

export default function ProfileClient({
  email,
  initialHostName,
  hostTier,
  checkoutBanner,
  canManageSubscription = false,
  paymentPastDue = false,
}: {
  email: string;
  initialHostName: string;
  hostTier: HostTier;
  checkoutBanner?: null | 'success' | 'canceled';
  canManageSubscription?: boolean;
  paymentPastDue?: boolean;
}) {
  const router = useRouter();
  const [hostName, setHostName] = useState(() =>
    sanitizeHostDisplayNameInput(initialHostName)
  );
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const exampleGuestLink = useMemo(
    () => guestPortalAbsoluteUrl(hostName, 'a3Kf9x'),
    [hostName]
  );

  async function openBillingPortal() {
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = (await res.json()) as { error?: string; url?: string };
      if (!res.ok) throw new Error(data.error ?? 'Could not open billing portal.');
      const url = data.url;
      if (!url) throw new Error('No portal URL returned.');
      window.location.assign(url);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not open billing portal.');
    } finally {
      setBusy(false);
    }
  }

  async function startProCheckout(interval: 'monthly' | 'annual') {
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interval }),
      });
      const data = (await res.json()) as { error?: string; url?: string };
      if (!res.ok) throw new Error(data.error ?? 'Could not start checkout.');
      const url = data.url;
      if (!url) throw new Error('No checkout URL returned.');
      window.location.assign(url);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Checkout failed.');
    } finally {
      setBusy(false);
    }
  }

  async function onSaveHostName(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      const res = await updateHostDisplayName(hostName);
      if (!res.ok) throw new Error(res.error);
      setInfo('Display name saved.');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not save.');
    } finally {
      setBusy(false);
    }
  }

  async function onChangeEmail(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      const res = await updateHostProfileEmail(newEmail);
      if (!res.ok) throw new Error(res.error);
      setInfo(res.message ?? 'Email update requested.');
      setNewEmail('');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not update email.');
    } finally {
      setBusy(false);
    }
  }

  async function onChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (password !== password2) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      const res = await updateHostProfilePassword(password);
      if (!res.ok) throw new Error(res.error);
      setInfo('Password updated.');
      setPassword('');
      setPassword2('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not update password.');
    } finally {
      setBusy(false);
    }
  }

  async function onSignOut() {
    setError(null);
    setBusy(true);
    const res = await signOutHost();
    if (!res.ok) {
      setError(res.error);
      setBusy(false);
      return;
    }
    router.push('/login');
    router.refresh();
  }

  async function onDeleteAccount() {
    const ok = window.confirm(
      'Delete your account permanently? All properties and guest links will be removed. This cannot be undone.'
    );
    if (!ok) return;
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      const res = await deleteHostAccount();
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push('/login?deleted=1');
      router.refresh();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong. Check the browser console and terminal logs.'
      );
      if (process.env.NODE_ENV === 'development') {
        console.error('[deleteHostAccount]', err);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto mt-8 w-full max-w-[600px] space-y-4 md:space-y-5">
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-3 text-sm text-rose-800 backdrop-blur-sm dark:border-rose-800/60 dark:bg-rose-950/50 dark:text-rose-400" role="alert">
          {error}
        </div>
      ) : null}
      {info ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3 text-sm text-emerald-800 backdrop-blur-sm dark:border-emerald-800/60 dark:bg-emerald-950/50 dark:text-emerald-400">
          {info}
        </div>
      ) : null}
      {checkoutBanner === 'success' ? (
        <div
          className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3 text-sm text-emerald-800 backdrop-blur-sm dark:border-emerald-800/60 dark:bg-emerald-950/50 dark:text-emerald-400"
          role="status"
        >
          Payment received. Stripe is updating your account — refresh in a moment if you still show
          as Free (usually a few seconds).
        </div>
      ) : null}
      {checkoutBanner === 'canceled' ? (
        <div
          className="rounded-2xl border border-slate-200 bg-slate-50/90 p-3 text-sm text-slate-700 backdrop-blur-sm dark:border-white/15 dark:bg-white/8 dark:text-slate-200"
          role="status"
        >
          Checkout was canceled. Nothing was charged.
        </div>
      ) : null}
      {paymentPastDue ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-sm text-amber-950 backdrop-blur-sm dark:border-amber-700/50 dark:bg-amber-950/40 dark:text-amber-100"
          role="alert"
        >
          <p className="font-semibold">Payment failed</p>
          <p className="mt-1 leading-relaxed text-amber-900/90 dark:text-amber-100/90">
            We couldn&apos;t charge your card for Pro. Stripe will retry automatically — update your
            payment method now to avoid losing Pro access when retries stop.
          </p>
          <PressButton
            type="button"
            disabled={busy}
            onClick={() => void openBillingPortal()}
            className="mt-3 w-full rounded-full bg-amber-800 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-900 disabled:opacity-60 dark:bg-amber-600 dark:hover:bg-amber-500 sm:w-auto"
          >
            Update payment method
          </PressButton>
        </div>
      ) : null}

      <section className="glass rounded-[20px] p-4 dark:bg-[#1a1b1f] dark:border-white/12 md:p-6">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 md:text-base">
          Current email
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{email || '—'}</p>
      </section>

      <section className="glass rounded-[20px] p-4 dark:bg-[#1a1b1f] dark:border-white/12 md:p-6">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 md:text-base">Plan</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          You are on the{' '}
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {hostTier === 'pro' ? 'Pro' : 'Free'}
          </span>{' '}
          plan.
        </p>
        {hostTier === 'free' ? (
          <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-500">
            Upgrade to Pro for unlimited properties, multiple locations, video uploads, FAQ, and more
            custom blocks.
          </p>
        ) : null}
        {hostTier === 'free' ? (
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <PressButton
              type="button"
              disabled={busy}
              onClick={() => void startProCheckout('monthly')}
              className="w-full rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-md disabled:opacity-60 sm:w-auto sm:min-w-[200px]"
            >
              Pro — $9/month
            </PressButton>
            <PressButton
              type="button"
              disabled={busy}
              onClick={() => void startProCheckout('annual')}
              className="w-full rounded-full border border-slate-200 bg-white/70 px-5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm backdrop-blur-sm transition hover:bg-white/90 disabled:opacity-60 dark:border-white/18 dark:bg-white/18 dark:text-slate-900 dark:hover:bg-white/28 sm:w-auto sm:min-w-[200px]"
            >
              Pro — $90/year
            </PressButton>
          </div>
        ) : null}
        {canManageSubscription ? (
          <>
            <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-500">
              Update your card, view invoices, or cancel your subscription in Stripe&apos;s secure
              billing portal.
            </p>
            <PressButton
              type="button"
              disabled={busy}
              onClick={() => void openBillingPortal()}
              className="mt-4 w-full rounded-full border border-slate-200 bg-white/70 px-5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm backdrop-blur-sm transition hover:bg-white/90 dark:border-white/18 dark:bg-white/18 dark:text-slate-900 dark:hover:bg-white/28 md:w-auto md:min-w-[200px]"
            >
              Manage subscription
            </PressButton>
          </>
        ) : hostTier === 'pro' ? (
          <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-500">
            Billing was set up outside Stripe checkout. Contact{' '}
            <a
              className="font-medium text-brand underline-offset-2 hover:underline"
              href={SUPPORT_MAILTO}
            >
              {SUPPORT_EMAIL}
            </a>{' '}
            to change your plan.
          </p>
        ) : null}
      </section>

      <form
        onSubmit={onSaveHostName}
        className="glass rounded-[20px] p-4 dark:bg-[#1a1b1f] dark:border-white/12 md:p-6"
      >
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 md:text-base">
          Host display name
        </h2>
        <input
          value={hostName}
          onChange={(e) => setHostName(sanitizeHostDisplayNameInput(e.target.value))}
          placeholder="Your name"
          autoComplete="nickname"
          className="mt-3 w-full rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-sm text-slate-900 outline-none ring-brand/30 focus:ring-2 dark:border-white/20 dark:bg-white/88 dark:text-slate-950 dark:placeholder-slate-500"
        />
        <p className="mt-2 break-all text-xs text-slate-500 dark:text-slate-500">
          <span className="font-semibold text-slate-600 dark:text-slate-400">Guest link example:</span>{' '}
          <span className="font-mono text-slate-700 dark:text-slate-300">{exampleGuestLink}</span>
        </p>
        <PressButton
          type="submit"
          disabled={busy}
          className="mt-3 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white shadow-md disabled:opacity-60"
        >
          Save name
        </PressButton>
      </form>

      <section className="glass rounded-[20px] p-4 dark:bg-[#1a1b1f] dark:border-white/12 md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 md:text-base">
              Appearance
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Switch between light and dark mode for the host dashboard.
            </p>
          </div>
          <ThemeToggle />
        </div>
      </section>

      <form
        onSubmit={onChangeEmail}
        className="glass rounded-[20px] p-4 dark:bg-[#1a1b1f] dark:border-white/12 md:p-6"
      >
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 md:text-base">Change email</h2>
        <input
          type="email"
          required
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="New email address"
          autoComplete="email"
          className="mt-3 w-full rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-sm text-slate-900 outline-none ring-brand/30 focus:ring-2 dark:border-white/20 dark:bg-white/88 dark:text-slate-950 dark:placeholder-slate-500"
        />
        <PressButton
          type="submit"
          disabled={busy}
          className="mt-3 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-md disabled:opacity-60 dark:bg-brand"
        >
          Update email
        </PressButton>
      </form>

      <form
        onSubmit={onChangePassword}
        className="glass rounded-[20px] p-4 dark:bg-[#1a1b1f] dark:border-white/12 md:p-6"
      >
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 md:text-base">
          Change password
        </h2>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New password (min 8 characters)"
          autoComplete="new-password"
          className="mt-3 w-full rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-sm text-slate-900 outline-none ring-brand/30 focus:ring-2 dark:border-white/20 dark:bg-white/88 dark:text-slate-950 dark:placeholder-slate-500"
        />
        <input
          type="password"
          required
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
          placeholder="Confirm new password"
          autoComplete="new-password"
          className="mt-3 w-full rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-sm text-slate-900 outline-none ring-brand/30 focus:ring-2 dark:border-white/20 dark:bg-white/88 dark:text-slate-950 dark:placeholder-slate-500"
        />
        <PressButton
          type="submit"
          disabled={busy}
          className="mt-3 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-md disabled:opacity-60 dark:bg-brand"
        >
          Update password
        </PressButton>
      </form>

      <div className="glass flex flex-col gap-3 rounded-[20px] p-4 dark:bg-[#1a1b1f] dark:border-white/12 md:p-6">
        <PressButton
          type="button"
          disabled={busy}
          onClick={() => void onSignOut()}
          className="rounded-full border border-slate-300 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-800 disabled:opacity-60 dark:border-white/18 dark:bg-white/18 dark:text-slate-900 dark:hover:bg-white/28 dark:hover:text-slate-950"
        >
          Log out
        </PressButton>
        <PressButton
          type="button"
          disabled={busy}
          onClick={() => void onDeleteAccount()}
          className="rounded-full border border-rose-300 bg-rose-50/70 px-4 py-2 text-sm font-semibold text-rose-800 disabled:opacity-60 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-400"
        >
          Delete account
        </PressButton>
      </div>

      <section className="glass rounded-[20px] p-4 dark:bg-[#1a1b1f] dark:border-white/12 md:p-6">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 md:text-base">Legal</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
          Review the latest Privacy Policy and Terms of Service.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href="/privacy"
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-white dark:border-white/18 dark:bg-white/18 dark:text-slate-900 dark:hover:bg-white/28 dark:hover:text-slate-950"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms"
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-white dark:border-white/18 dark:bg-white/18 dark:text-slate-900 dark:hover:bg-white/28 dark:hover:text-slate-950"
          >
            Terms of Service
          </Link>
        </div>
      </section>
    </div>
  );
}
