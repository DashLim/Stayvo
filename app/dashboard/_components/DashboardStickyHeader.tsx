'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import ThemeToggle from '@/app/_components/ThemeToggle';
import { useHostDashboardLimits } from '@/app/dashboard/_components/HostTierProvider';
import { FREE_TIER_MAX_PROPERTIES } from '@/lib/host-tier';

const headerByPath: Array<{ match: (path: string) => boolean; title: string }> = [
  { match: (path) => path === '/dashboard', title: 'Dashboard' },
  { match: (path) => path.startsWith('/dashboard/manage'), title: 'Manage' },
  { match: (path) => path.startsWith('/dashboard/track'), title: 'Track' },
  { match: (path) => path.startsWith('/dashboard/profile'), title: 'Profile' },
];

export default function DashboardStickyHeader() {
  const pathname = usePathname() ?? '/dashboard';
  const normalizedPath = pathname.replace(/\/$/, '') || '/';
  const active = headerByPath.find((item) => item.match(normalizedPath));
  const title = active?.title ?? 'Dashboard';
  const isDashboard = normalizedPath === '/dashboard';
  const isManage = normalizedPath.startsWith('/dashboard/manage');
  const { tier, propertyCount } = useHostDashboardLimits();
  const atPropertyLimit = tier === 'free' && propertyCount >= FREE_TIER_MAX_PROPERTIES;
  const canAddLocations = tier === 'pro';

  const [manageEditActive, setManageEditActive] = useState(false);

  useEffect(() => {
    const onManageEditState = (e: Event) => {
      const ce = e as CustomEvent<{ active?: boolean }>;
      setManageEditActive(Boolean(ce.detail?.active));
    };
    window.addEventListener('stayvo:manage-edit-state', onManageEditState);
    return () => window.removeEventListener('stayvo:manage-edit-state', onManageEditState);
  }, []);

  useEffect(() => {
    if (!isManage) setManageEditActive(false);
  }, [isManage]);

  return (
    <header className="glass-header sticky top-0 z-30 -mx-4 px-4 pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-3 py-3">
        <h1 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">{title}</h1>

        {isDashboard ? (
          <div className="flex items-center gap-2">
          <ThemeToggle />
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            onClick={() => window.dispatchEvent(new Event('stayvo:dashboard-open-filter'))}
            className="glass inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-600 dark:text-slate-300 transition hover:text-slate-900 dark:hover:text-slate-100"
            aria-label="Open filter"
            title="Filter"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
              <path
                d="M5.5 6.5h13M7.5 12h9M9.5 17.5h5"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
            </svg>
          </motion.button>
          </div>
        ) : null}

        {isManage ? (
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <motion.button
              type="button"
              whileTap={{ scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              onClick={() => window.dispatchEvent(new Event('stayvo:manage-toggle-edit'))}
              className="glass inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-600 transition hover:text-slate-900 dark:text-slate-200 dark:hover:text-slate-50"
              title={manageEditActive ? 'Exit edit mode' : 'Edit'}
              aria-label={manageEditActive ? 'Exit edit mode' : 'Edit'}
            >
              {manageEditActive ? (
                <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" aria-hidden>
                  <path
                    d="M5 5l10 10M15 5L5 15"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              ) : (
                <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" aria-hidden>
                  <path
                    d="M10 3H5.5A2.5 2.5 0 0 0 3 5.5v9A2.5 2.5 0 0 0 5.5 17h9A2.5 2.5 0 0 0 17 14.5V10"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="m12.5 3.5 2.5 2.5m-2.5-2.5-4 4-.5 2.5 2.5-.5 4-4a1 1 0 0 0 0-1.4l-1.1-1.1a1 1 0 0 0-1.4 0Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              onClick={() => {
                if (!canAddLocations) {
                  window.alert(
                    'Additional locations are available on Stayvo Pro.'
                  );
                  return;
                }
                window.dispatchEvent(new Event('stayvo:manage-add-location'));
              }}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand text-white shadow-md transition hover:opacity-90"
              title={canAddLocations ? 'Add location' : 'Additional locations (Pro)'}
              aria-label="Add location"
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden>
                {/* Pin body */}
                <path
                  d="M11 2a6.5 6.5 0 0 0-6.5 6.5C4.5 13 11 20 11 20s6.5-7 6.5-11.5A6.5 6.5 0 0 0 11 2Z"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Inner ring */}
                <circle cx="11" cy="8.5" r="2.4" stroke="currentColor" strokeWidth="2.2" />
                {/* Plus cross badge */}
                <path d="M18 13.5v6M15 16.5h6" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
              </svg>
            </motion.button>
            <motion.div
              whileTap={{ scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
              {atPropertyLimit ? (
                <button
                  type="button"
                  onClick={() =>
                    window.alert(
                      `Free accounts can have up to ${FREE_TIER_MAX_PROPERTIES} properties. Stayvo Pro includes unlimited properties.`
                    )
                  }
                  className="inline-flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-full bg-brand/45 text-base font-bold text-white shadow-md"
                  title="Property limit reached"
                  aria-label="Add property unavailable"
                >
                  <svg viewBox="0 0 20 20" className="h-6 w-6" fill="none" aria-hidden>
                    <path
                      d="M10 4.5v11M4.5 10h11"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              ) : (
                <Link
                  href={`/properties/new?returnTo=${encodeURIComponent('/dashboard/manage')}`}
                  prefetch={false}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand text-base font-bold text-white shadow-md transition hover:opacity-90"
                  title="Add property"
                  aria-label="Add property"
                >
                  <svg viewBox="0 0 20 20" className="h-6 w-6" fill="none" aria-hidden>
                    <path
                      d="M10 4.5v11M4.5 10h11"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </Link>
              )}
            </motion.div>
          </div>
        ) : null}

        {!isDashboard && !isManage ? <ThemeToggle /> : null}
      </div>
    </header>
  );
}
