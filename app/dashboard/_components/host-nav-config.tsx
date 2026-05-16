import type { ReactNode } from 'react';

export type HostNavTab = {
  href: string;
  label: string;
  match: (path: string) => boolean;
  icon: ReactNode;
};

const iconDashboard = (
  <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" aria-hidden>
    <rect x="5" y="3.5" width="14" height="17" rx="2.5" stroke="currentColor" strokeWidth="2.6" />
    <path d="M7 10h10M7 15h10" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
  </svg>
);

const iconManage = (
  <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" aria-hidden>
    <path
      d="M10.12 2.73a2 2 0 0 1 3.76 0l.25.67a2 2 0 0 0 2.31 1.23l.7-.13a2 2 0 0 1 2.66 2.66l-.13.7a2 2 0 0 0 1.23 2.31l.67.25a2 2 0 0 1 0 3.76l-.67.25a2 2 0 0 0-1.23 2.31l.13.7a2 2 0 0 1-2.66 2.66l-.7-.13a2 2 0 0 0-2.31 1.23l-.25.67a2 2 0 0 1-3.76 0l-.25-.67a2 2 0 0 0-2.31-1.23l-.7.13a2 2 0 0 1-2.66-2.66l.13-.7a2 2 0 0 0-1.23-2.31l-.67-.25a2 2 0 0 1 0-3.76l.67-.25a2 2 0 0 0 1.23-2.31l-.13-.7a2 2 0 0 1 2.66-2.66l.7.13a2 2 0 0 0 2.31-1.23l.25-.67Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12" r="2.75" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const iconTrack = (
  <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" aria-hidden>
    <circle cx="12" cy="12" r="2.2" stroke="currentColor" strokeWidth="2.2" />
    <path d="M12 3.5v6.3" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M12 9.8 18.7 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M20 14.5a8.5 8.5 0 1 1-1.4-7.8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const iconProfile = (
  <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" aria-hidden>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.2" />
    <circle cx="12" cy="9.2" r="2.7" stroke="currentColor" strokeWidth="2.2" />
    <path d="M7.8 16.8a5.2 5.2 0 0 1 8.4 0" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

export const HOST_NAV_TABS: HostNavTab[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    match: (p) => p === '/dashboard',
    icon: iconDashboard,
  },
  {
    href: '/dashboard/manage',
    label: 'Manage',
    match: (p) => p.startsWith('/dashboard/manage'),
    icon: iconManage,
  },
  {
    href: '/dashboard/track',
    label: 'Track',
    match: (p) => p.startsWith('/dashboard/track'),
    icon: iconTrack,
  },
  {
    href: '/dashboard/profile',
    label: 'Profile',
    match: (p) => p.startsWith('/dashboard/profile'),
    icon: iconProfile,
  },
];
