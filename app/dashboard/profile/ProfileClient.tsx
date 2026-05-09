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
import { guestPortalAbsoluteUrl, sanitizeHostDisplayNameInput } from '@/lib/guest-portal-url';

export default function ProfileClient({
  email,
  initialHostName,
}: {
  email: string;
  initialHostName: string;
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
    () => guestPortalAbsoluteUrl(hostName, 'zCqWY5WeiP'),
    [hostName]
  );

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
    <div className="mt-8 max-w-md space-y-4">
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-3 text-sm text-rose-800 backdrop-blur-sm" role="alert">
          {error}
        </div>
      ) : null}
      {info ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3 text-sm text-emerald-800 backdrop-blur-sm">
          {info}
        </div>
      ) : null}

      <section className="glass rounded-[20px] p-4">
        <h2 className="text-sm font-semibold text-slate-900">Current email</h2>
        <p className="mt-1 text-sm text-slate-600">{email || '—'}</p>
      </section>

      <form onSubmit={onSaveHostName} className="glass rounded-[20px] p-4">
        <h2 className="text-sm font-semibold text-slate-900">Host display name</h2>
        <input
          value={hostName}
          onChange={(e) => setHostName(sanitizeHostDisplayNameInput(e.target.value))}
          placeholder="Your name"
          autoComplete="nickname"
          className="mt-3 w-full rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-sm outline-none ring-brand/30 focus:ring-2"
        />
        <p className="mt-2 break-all text-xs text-slate-500">
          <span className="font-semibold text-slate-600">Guest link example:</span>{' '}
          <span className="font-mono text-slate-700">{exampleGuestLink}</span>
        </p>
        <PressButton
          type="submit"
          disabled={busy}
          className="mt-3 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white shadow-md disabled:opacity-60"
        >
          Save name
        </PressButton>
      </form>

      <form onSubmit={onChangeEmail} className="glass rounded-[20px] p-4">
        <h2 className="text-sm font-semibold text-slate-900">Change email</h2>
        <input
          type="email"
          required
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="New email address"
          autoComplete="email"
          className="mt-3 w-full rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-sm outline-none ring-brand/30 focus:ring-2"
        />
        <PressButton
          type="submit"
          disabled={busy}
          className="mt-3 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-md disabled:opacity-60"
        >
          Update email
        </PressButton>
      </form>

      <form onSubmit={onChangePassword} className="glass rounded-[20px] p-4">
        <h2 className="text-sm font-semibold text-slate-900">Change password</h2>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New password (min 8 characters)"
          autoComplete="new-password"
          className="mt-3 w-full rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-sm outline-none ring-brand/30 focus:ring-2"
        />
        <input
          type="password"
          required
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
          placeholder="Confirm new password"
          autoComplete="new-password"
          className="mt-3 w-full rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-sm outline-none ring-brand/30 focus:ring-2"
        />
        <PressButton
          type="submit"
          disabled={busy}
          className="mt-3 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-md disabled:opacity-60"
        >
          Update password
        </PressButton>
      </form>

      <div className="glass flex flex-col gap-3 rounded-[20px] p-4">
        <PressButton
          type="button"
          disabled={busy}
          onClick={() => void onSignOut()}
          className="rounded-full border border-slate-300 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-800 disabled:opacity-60"
        >
          Log out
        </PressButton>
        <PressButton
          type="button"
          disabled={busy}
          onClick={() => void onDeleteAccount()}
          className="rounded-full border border-rose-300 bg-rose-50/70 px-4 py-2 text-sm font-semibold text-rose-800 disabled:opacity-60"
        >
          Delete account
        </PressButton>
      </div>

      <section className="glass rounded-[20px] p-4">
        <h2 className="text-sm font-semibold text-slate-900">Legal</h2>
        <p className="mt-1 text-xs text-slate-500">
          Review the latest Privacy Policy and Terms of Service.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href="/privacy"
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-white"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms"
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-white"
          >
            Terms of Service
          </Link>
        </div>
      </section>
    </div>
  );
}
