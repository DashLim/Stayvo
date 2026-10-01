'use client';

import type { ReactNode } from 'react';
import { LayoutDashboard, Link2, Settings2, UserRound } from 'lucide-react';

export type HostNavTab = {
  href: string;
  label: string;
  match: (path: string) => boolean;
  icon: ReactNode;
};

const navIconClass = 'h-[18px] w-[18px] shrink-0';

export const HOST_NAV_TABS: HostNavTab[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    match: (p) => p === '/dashboard',
    icon: <LayoutDashboard className={navIconClass} aria-hidden />,
  },
  {
    href: '/dashboard/manage',
    label: 'Manage',
    match: (p) => p.startsWith('/dashboard/manage'),
    icon: <Settings2 className={navIconClass} aria-hidden />,
  },
  {
    href: '/dashboard/track',
    label: 'Track',
    match: (p) => p.startsWith('/dashboard/track'),
    icon: <Link2 className={navIconClass} aria-hidden />,
  },
  {
    href: '/dashboard/profile',
    label: 'Profile',
    match: (p) => p.startsWith('/dashboard/profile'),
    icon: <UserRound className={navIconClass} aria-hidden />,
  },
];
