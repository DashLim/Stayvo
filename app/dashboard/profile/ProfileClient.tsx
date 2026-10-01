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
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from '@/lib/support-email';
import {
  stayvoBtnPrimaryClass,
  stayvoBtnSecondaryClass,
  stayvoHostCardClass,
  stayvoInputClass,
  stayvoMutedTextClass,
  stayvoSectionTitleClass,
} from '@/lib/stayvo-ui-classes';

export default function ProfileClient({
  email,
  initialHostName,
  checkInAccess,
}: {
  email: string;
  initialHostName: string;
  checkInAccess: boolean;
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
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive" role="alert">
          {error}
        </div>
      ) : null}
      {info ? (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-800 dark:text-emerald-200">
          {info}
        </div>
      ) : null}
      <section className={`${stayvoHostCardClass} p-4 md:p-6`}>
        <h2 className={`${stayvoSectionTitleClass} text-sm md:text-base`}>
          Current email
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{email || '—'}</p>
      </section>

      <section
        id="check-in-access"
        className={`${stayvoHostCardClass} scroll-mt-24 p-4 md:p-6`}
      >
        <h2 className={`${stayvoSectionTitleClass} text-sm md:text-base`}>Stayvo Check-in access</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          {checkInAccess ? (
            <>
              Your account has{' '}
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                full Stayvo Check-in access
              </span>{' '}
              at no cost — properties, guest links, guest portal content, iCal, and related host
              tools.
            </>
          ) : (
            <>Sign in to use Stayvo Check-in.</>
          )}
        </p>
        <p className={`mt-3 ${stayvoMutedTextClass} text-xs leading-relaxed`}>
          Includes unlimited properties, multiple locations, FAQ, guest video uploads, up to 15 custom
          blocks per property, guest links, and OTA iCal sync.
        </p>
      </section>

      <form
        onSubmit={onSaveHostName}
        className={`${stayvoHostCardClass} p-4 md:p-6`}
      >
        <h2 className={`${stayvoSectionTitleClass} text-sm md:text-base`}>
          Host display name
        </h2>
        <input
          value={hostName}
          onChange={(e) => setHostName(sanitizeHostDisplayNameInput(e.target.value))}
          placeholder="Your name"
          autoComplete="nickname"
          className={`mt-3 ${stayvoInputClass}`}
        />
        <p className="mt-2 break-all text-xs text-slate-500 dark:text-slate-500">
          <span className="font-semibold text-slate-600 dark:text-slate-400">Guest link example:</span>{' '}
          <span className="font-mono text-slate-700 dark:text-slate-300">{exampleGuestLink}</span>
        </p>
        <PressButton
          type="submit"
          disabled={busy}
          className={`mt-3 ${stayvoBtnPrimaryClass} disabled:opacity-60`}
        >
          Save name
        </PressButton>
      </form>

      <section className={`${stayvoHostCardClass} p-4 md:p-6`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className={`${stayvoSectionTitleClass} text-sm md:text-base`}>
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
        className={`${stayvoHostCardClass} p-4 md:p-6`}
      >
        <h2 className={`${stayvoSectionTitleClass} text-sm md:text-base`}>Change email</h2>
        <input
          type="email"
          required
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="New email address"
          autoComplete="email"
          className={`mt-3 ${stayvoInputClass}`}
        />
        <PressButton
          type="submit"
          disabled={busy}
          className={`mt-3 ${stayvoBtnPrimaryClass} disabled:opacity-60`}
        >
          Update email
        </PressButton>
      </form>

      <form
        onSubmit={onChangePassword}
        className={`${stayvoHostCardClass} p-4 md:p-6`}
      >
        <h2 className={`${stayvoSectionTitleClass} text-sm md:text-base`}>
          Change password
        </h2>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New password (min 8 characters)"
          autoComplete="new-password"
          className={`mt-3 ${stayvoInputClass}`}
        />
        <input
          type="password"
          required
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
          placeholder="Confirm new password"
          autoComplete="new-password"
          className={`mt-3 ${stayvoInputClass}`}
        />
        <PressButton
          type="submit"
          disabled={busy}
          className={`mt-3 ${stayvoBtnPrimaryClass} disabled:opacity-60`}
        >
          Update password
        </PressButton>
      </form>

      <div className={`${stayvoHostCardClass} flex flex-col gap-3 p-4 md:p-6`}>
        <PressButton
          type="button"
          disabled={busy}
          onClick={() => void onSignOut()}
          className={`${stayvoBtnSecondaryClass} disabled:opacity-60`}
        >
          Log out
        </PressButton>
        <PressButton
          type="button"
          disabled={busy}
          onClick={() => void onDeleteAccount()}
          className="inline-flex h-10 items-center justify-center rounded-md border border-destructive/40 bg-destructive/10 px-4 text-sm font-medium text-destructive disabled:opacity-60"
        >
          Delete account
        </PressButton>
      </div>

      <section className={`${stayvoHostCardClass} p-4 md:p-6`}>
        <h2 className={`${stayvoSectionTitleClass} text-sm md:text-base`}>Legal</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
          Review the latest Privacy Policy and Terms of Service.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href="/privacy"
            className={stayvoBtnSecondaryClass}
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms"
            className={stayvoBtnSecondaryClass}
          >
            Terms of Service
          </Link>
        </div>
      </section>
    </div>
  );
}
