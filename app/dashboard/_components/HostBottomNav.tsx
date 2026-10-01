'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { HOST_NAV_TABS } from '@/app/dashboard/_components/host-nav-config';
import {
  stayvoHostBottomNavLinkActiveClass,
  stayvoHostBottomNavLinkClass,
  stayvoHostBottomNavShellClass,
} from '@/lib/stayvo-ui-classes';
import { cn } from '@/lib/utils';

export default function HostBottomNav() {
  const router = useRouter();
  const pathname = usePathname() ?? '';
  const path = pathname.replace(/\/$/, '') || '/';
  const [mounted, setMounted] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [addLocationOpen, setAddLocationOpen] = useState(false);
  const [optimisticHref, setOptimisticHref] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setOptimisticHref(null);
  }, [path]);

  useEffect(() => {
    for (const tab of HOST_NAV_TABS) {
      router.prefetch(tab.href);
    }
  }, [router]);

  useEffect(() => {
    function onOpen() {
      setFilterOpen(true);
    }
    function onClose() {
      setFilterOpen(false);
    }
    window.addEventListener('stayvo:filter-open', onOpen);
    window.addEventListener('stayvo:filter-close', onClose);
    return () => {
      window.removeEventListener('stayvo:filter-open', onOpen);
      window.removeEventListener('stayvo:filter-close', onClose);
    };
  }, []);

  useEffect(() => {
    function onAddOpen() {
      setAddLocationOpen(true);
    }
    function onAddClose() {
      setAddLocationOpen(false);
    }
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
            className={stayvoHostBottomNavShellClass}
            aria-label="Host navigation"
          >
            <div className="flex items-center">
              {HOST_NAV_TABS.map((tab) => {
                const active =
                  optimisticHref != null ? optimisticHref === tab.href : tab.match(path);
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
                      className={cn(
                        stayvoHostBottomNavLinkClass,
                        active
                          ? stayvoHostBottomNavLinkActiveClass
                          : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      <span>{tab.icon}</span>
                      <span>{tab.label}</span>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </motion.nav>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
