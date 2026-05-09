'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';

const tabs = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    match: (p: string) => p === '/dashboard',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
        <rect x="5" y="3.5" width="14" height="17" rx="2.5" stroke="currentColor" strokeWidth="2.6" />
        <path d="M7 10h10M7 15h10" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/dashboard/manage',
    label: 'Manage',
    match: (p: string) => p.startsWith('/dashboard/manage'),
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
        <path
          d="M10.12 2.73a2 2 0 0 1 3.76 0l.25.67a2 2 0 0 0 2.31 1.23l.7-.13a2 2 0 0 1 2.66 2.66l-.13.7a2 2 0 0 0 1.23 2.31l.67.25a2 2 0 0 1 0 3.76l-.67.25a2 2 0 0 0-1.23 2.31l.13.7a2 2 0 0 1-2.66 2.66l-.7-.13a2 2 0 0 0-2.31 1.23l-.25.67a2 2 0 0 1-3.76 0l-.25-.67a2 2 0 0 0-2.31-1.23l-.7.13a2 2 0 0 1-2.66-2.66l.13-.7a2 2 0 0 0-1.23-2.31l-.67-.25a2 2 0 0 1 0-3.76l.67-.25a2 2 0 0 0 1.23-2.31l-.13-.7a2 2 0 0 1 2.66-2.66l.7.13a2 2 0 0 0 2.31-1.23l.25-.67Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="12" r="2.75" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  },
  {
    href: '/dashboard/track',
    label: 'Track',
    match: (p: string) => p.startsWith('/dashboard/track'),
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="2.2" stroke="currentColor" strokeWidth="2.2" />
        <path d="M12 3.5v6.3" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M12 9.8 18.7 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M20 14.5a8.5 8.5 0 1 1-1.4-7.8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: '/dashboard/profile',
    label: 'Profile',
    match: (p: string) => p.startsWith('/dashboard/profile'),
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.2" />
        <circle cx="12" cy="9.2" r="2.7" stroke="currentColor" strokeWidth="2.2" />
        <path d="M7.8 16.8a5.2 5.2 0 0 1 8.4 0" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    ),
  },
] as const;

/** Shared layout spring — slightly soft / inertial (liquid tab bubble). */
const ACTIVE_BUBBLE_SPRING = {
  type: 'spring' as const,
  stiffness: 360,
  damping: 26,
  mass: 0.88,
};

export default function HostBottomNav() {
  const router = useRouter();
  const pathname = usePathname() ?? '';
  const path = pathname.replace(/\/$/, '') || '/';
  const [mounted, setMounted] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [addLocationOpen, setAddLocationOpen] = useState(false);
  /** Shown tab updates immediately on tap; cleared when URL catches up. */
  const [optimisticHref, setOptimisticHref] = useState<string | null>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    setOptimisticHref(null);
  }, [path]);

  useEffect(() => {
    for (const tab of tabs) {
      router.prefetch(tab.href);
    }
  }, [router]);

  useEffect(() => {
    function onOpen() { setFilterOpen(true); }
    function onClose() { setFilterOpen(false); }
    window.addEventListener('stayvo:filter-open', onOpen);
    window.addEventListener('stayvo:filter-close', onClose);
    return () => {
      window.removeEventListener('stayvo:filter-open', onOpen);
      window.removeEventListener('stayvo:filter-close', onClose);
    };
  }, []);

  useEffect(() => {
    function onAddOpen() { setAddLocationOpen(true); }
    function onAddClose() { setAddLocationOpen(false); }
    window.addEventListener('stayvo:add-location-open', onAddOpen);
    window.addEventListener('stayvo:add-location-close', onAddClose);
    return () => {
      window.removeEventListener('stayvo:add-location-open', onAddOpen);
      window.removeEventListener('stayvo:add-location-close', onAddClose);
    };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {!filterOpen && !addLocationOpen && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
          <motion.nav
            key="bottom-nav"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="glass-dark rounded-full px-1.5 py-2"
            aria-label="Host navigation"
          >
            <LayoutGroup id="host-bottom-nav">
              <div className="flex items-center">
                {tabs.map((tab) => {
                  const active =
                    optimisticHref != null
                      ? optimisticHref === tab.href
                      : tab.match(path);
                  return (
                    <motion.div
                      key={tab.href}
                      whileTap={{ scale: 0.97 }}
                      transition={{ type: 'spring', stiffness: 520, damping: 38 }}
                    >
                      <Link
                        href={tab.href}
                        prefetch
                        onPointerDown={() => setOptimisticHref(tab.href)}
                        onClick={() => setOptimisticHref(tab.href)}
                        aria-current={active ? 'page' : undefined}
                        className={`relative flex w-[4.5rem] flex-col items-center gap-0.5 rounded-full py-1.5 text-[10px] font-semibold transition-colors duration-150 ${
                          active ? 'text-brand' : 'text-white/55'
                        }`}
                      >
                        {active ? (
                          <motion.div
                            layoutId="hostNavActiveBubble"
                            className="absolute inset-0 z-0 rounded-full bg-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] ring-1 ring-white/10"
                            transition={ACTIVE_BUBBLE_SPRING}
                          />
                        ) : null}
                        <span className="relative z-10">{tab.icon}</span>
                        <span className="relative z-10">{tab.label}</span>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </LayoutGroup>
          </motion.nav>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
