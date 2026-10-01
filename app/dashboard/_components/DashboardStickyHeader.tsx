'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Filter, MapPin, Pencil, Plus, X } from 'lucide-react';
import {
  stayvoBtnIconClass,
  stayvoBtnIconPrimaryClass,
  stayvoHostHeaderClass,
  stayvoPageTitleClass,
} from '@/lib/stayvo-ui-classes';
import { cn } from '@/lib/utils';

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
    <header
      className={`${stayvoHostHeaderClass} -mx-4 px-4 pt-[env(safe-area-inset-top)] md:-mx-6 md:px-6 lg:-mx-8 lg:px-8`}
    >
      <div className="mx-auto flex h-14 w-full max-w-2xl items-center justify-between gap-3 md:max-w-6xl">
        <h1 className={`text-left ${stayvoPageTitleClass}`}>
          {title}
        </h1>

        {isDashboard ? (
          <motion.div className="flex items-center gap-2">
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            onClick={() => window.dispatchEvent(new Event('stayvo:dashboard-open-filter'))}
            className={`${stayvoBtnIconClass} md:h-10 md:w-auto md:px-3`}
            aria-label="Open filter"
            title="Filter"
          >
            <Filter className="h-4 w-4 shrink-0" aria-hidden />
            <span className="hidden text-sm font-medium md:inline">Filter</span>
          </motion.button>
          </motion.div>
        ) : null}

        {isManage ? (
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <motion.button
              type="button"
              whileTap={{ scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              onClick={() => window.dispatchEvent(new Event('stayvo:manage-toggle-edit'))}
              className={cn(stayvoBtnIconClass, 'md:h-10 md:w-auto md:px-3')}
              title={manageEditActive ? 'Exit edit mode' : 'Edit'}
              aria-label={manageEditActive ? 'Exit edit mode' : 'Edit'}
            >
              {manageEditActive ? (
                <X className="h-4 w-4 shrink-0" aria-hidden />
              ) : (
                <Pencil className="h-4 w-4 shrink-0" aria-hidden />
              )}
              <span className="hidden text-sm font-medium md:inline">Edit</span>
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              onClick={() => window.dispatchEvent(new Event('stayvo:manage-add-location'))}
              className={cn(stayvoBtnIconClass, 'md:h-10 md:w-auto md:px-3')}
              title="Add location"
              aria-label="Add location"
            >
              <MapPin className="h-4 w-4 shrink-0" aria-hidden />
              <span className="hidden text-sm font-medium md:inline">Add Location</span>
            </motion.button>
            <motion.div
              whileTap={{ scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
              <Link
                href={`/properties/new?returnTo=${encodeURIComponent('/dashboard/manage')}`}
                prefetch={false}
                className={cn(stayvoBtnIconPrimaryClass, 'md:h-10 md:w-auto md:px-3 md:gap-2')}
                title="Add property"
                aria-label="Add property"
              >
                <Plus className="h-4 w-4 shrink-0" aria-hidden />
                <span className="hidden text-sm font-medium md:inline">Add Property</span>
              </Link>
            </motion.div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
