'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'stayvo.guestLegalAck.v1';

export default function GuestCookieNotice({
  stackAboveQuickNav = true,
}: {
  /** When false (e.g. expired-link page), sit flush to the bottom — no section quick nav. */
  stackAboveQuickNav?: boolean;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === '1') return;
    } catch {
      return;
    }
    setVisible(true);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (visible) {
      root.classList.add('stayvo-guest-cookie-open');
    } else {
      root.classList.remove('stayvo-guest-cookie-open');
    }
    return () => root.classList.remove('stayvo-guest-cookie-open');
  }, [visible]);

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // ignore
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Privacy notice"
      className={`fixed inset-x-0 bottom-0 z-[60] border-t border-slate-200/80 bg-white/95 px-4 py-3 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] backdrop-blur-md pt-3 md:pb-[calc(0.75rem+env(safe-area-inset-bottom))] ${
        stackAboveQuickNav ? 'max-md:bottom-[var(--stayvo-guest-quick-nav-offset)] max-md:pb-3' : 'pb-[calc(0.75rem+env(safe-area-inset-bottom))]'
      }`}
    >
      <div className="mx-auto flex max-w-[1100px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <p className="text-center text-xs leading-relaxed text-slate-600 sm:text-left">
          We use essential storage and limited analytics so this page works and your host can see
          link opens. See our{' '}
          <Link href="/privacy" className="font-semibold text-brand underline-offset-2 hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-full bg-brand px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:opacity-90 active:scale-[0.98]"
        >
          OK
        </button>
      </div>
    </div>
  );
}
