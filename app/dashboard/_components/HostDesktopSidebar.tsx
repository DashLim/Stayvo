'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { signOutHost } from '@/app/actions/host-account';
import { HOST_NAV_TABS } from '@/app/dashboard/_components/host-nav-config';
import {
  stayvoBtnSecondaryClass,
  stayvoNavLinkActiveClass,
  stayvoNavLinkClass,
  stayvoSidebarClass,
} from '@/lib/stayvo-ui-classes';

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
    <aside className={stayvoSidebarClass} aria-label="Host navigation">
      <div className="flex flex-1 flex-col px-3 pt-6">
        <Link
          href="/dashboard"
          className="mb-6 block px-2 outline-none ring-brand/30 focus-visible:ring-2 rounded-lg"
          aria-label="Stayvo Check-in home"
        >
          <Image
            src="/brand/stayvo-wordmark.png"
            alt="Stayvo Check-in"
            width={512}
            height={200}
            className="h-8 w-auto max-w-[180px] dark:hidden"
            priority
          />
          <Image
            src="/brand/stayvo-logo-lockup-darkmode-transparent.png"
            alt="Stayvo Check-in"
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
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active ? stayvoNavLinkActiveClass : stayvoNavLinkClass
                }`}
              >
                <span className={active ? 'text-sidebar-accent-foreground' : 'text-muted-foreground'}>
                  {tab.icon}
                </span>
                {tab.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-border px-2 py-4">
          <p className="truncate text-xs font-semibold text-foreground">{displayName || 'Host'}</p>
          {email ? (
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{email}</p>
          ) : null}
          <button
            type="button"
            disabled={pending}
            onClick={() => onLogout()}
            className={`mt-3 w-full py-2 text-xs ${stayvoBtnSecondaryClass}`}
          >
            {pending ? 'Signing out…' : 'Log out'}
          </button>
          {error ? <p className="mt-2 text-[11px] text-rose-600 dark:text-rose-400">{error}</p> : null}
        </div>
      </div>
    </aside>
  );
}
