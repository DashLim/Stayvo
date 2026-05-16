'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { signOutHost } from '@/app/actions/host-account';
import { HOST_NAV_TABS } from '@/app/dashboard/_components/host-nav-config';

export default function HostDesktopSidebar({
  displayName,
  email,
}: {
  displayName: string;
  email: string;
}) {
  const pathname = usePathname() ?? '/dashboard';
  const path = pathname.replace(/\/$/, '') || '/';
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onLogout() {
    setError(null);
    startTransition(async () => {
      const res = await signOutHost();
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push('/login');
      router.refresh();
    });
  }

  return (
    <aside
      className="sticky top-0 z-40 hidden h-screen min-h-[100dvh] w-[220px] shrink-0 flex-col border-r border-black/[0.08] bg-[rgba(253,246,236,0.92)] backdrop-blur-xl dark:border-white/10 dark:bg-[rgba(17,16,20,0.92)] md:flex"
      aria-label="Host navigation"
    >
      <div className="flex flex-1 flex-col px-3 pt-6">
        <Link
          href="/dashboard"
          className="mb-6 block px-2 outline-none ring-brand/30 focus-visible:ring-2 rounded-lg"
          aria-label="Stayvo home"
        >
          <Image
            src="/brand/stayvo-wordmark.png"
            alt="Stayvo"
            width={512}
            height={200}
            className="h-8 w-auto max-w-[180px] dark:hidden"
            priority
          />
          <Image
            src="/brand/stayvo-logo-lockup-darkmode-transparent.png"
            alt="Stayvo"
            width={512}
            height={200}
            className="hidden h-8 w-auto max-w-[180px] dark:block"
            priority
          />
        </Link>

        <nav className="flex flex-1 flex-col gap-1">
          {HOST_NAV_TABS.map((tab) => {
            const active = tab.match(path);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                prefetch
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-full px-3 py-2.5 text-sm font-semibold transition-colors ${
                  active
                    ? 'bg-brand font-bold text-amber-950 shadow-sm dark:text-amber-950'
                    : 'text-slate-700 hover:bg-white/60 dark:text-slate-200 dark:hover:bg-white/10'
                }`}
              >
                <span className={active ? 'text-amber-950' : 'text-slate-600 dark:text-slate-400'}>{tab.icon}</span>
                {tab.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-black/[0.08] px-2 py-4 dark:border-white/10">
          <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100">{displayName || 'Host'}</p>
          {email ? (
            <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-slate-400">{email}</p>
          ) : null}
          <button
            type="button"
            disabled={pending}
            onClick={() => onLogout()}
            className="mt-3 w-full rounded-full border border-slate-200/90 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-white disabled:opacity-50 dark:border-white/15 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15"
          >
            {pending ? 'Signing out…' : 'Log out'}
          </button>
          {error ? <p className="mt-2 text-[11px] text-rose-600 dark:text-rose-400">{error}</p> : null}
        </div>
      </div>
    </aside>
  );
}
