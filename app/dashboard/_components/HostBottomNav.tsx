'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { HOST_NAV_TABS } from '@/app/dashboard/_components/host-nav-config';

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
    for (const tab of HOST_NAV_TABS) {
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
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 md:hidden">
          <motion.nav
            key="bottom-nav"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="glass-nav-crystal rounded-full px-1.5 py-2"
            aria-label="Host navigation"
          >
            <LayoutGroup id="host-bottom-nav">
              <div className="flex items-center">
                {HOST_NAV_TABS.map((tab) => {
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
                          active
                            ? 'text-amber-950 dark:text-amber-200'
                            : 'text-slate-700/90 dark:text-slate-300/80'
                        }`}
                      >
                        {active ? (
                          <motion.div
                            layoutId="hostNavActiveBubble"
                            className="absolute inset-0 z-0 rounded-full bg-gradient-to-b from-[rgba(238,210,165,0.55)] to-[rgba(218,175,115,0.52)] shadow-[0_2px_12px_rgba(224,162,77,0.22),inset_0_1px_0_rgba(255,255,255,0.38),inset_0_-2px_6px_rgba(160,110,45,0.12)] dark:from-[rgba(210,158,70,0.38)] dark:to-[rgba(170,118,40,0.36)] dark:shadow-[0_2px_12px_rgba(224,162,77,0.18),inset_0_1px_0_rgba(255,255,255,0.18)]"
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
