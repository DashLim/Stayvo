'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

/** Dashboard uses a fixed chrome + portal nav; fading this subtree fights the shell and feels jumpy. */
function isDashboardShellPath(pathname: string) {
  const p = pathname.replace(/\/$/, '') || '/';
  return p === '/dashboard' || p.startsWith('/dashboard/');
}

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '/';
  const [mounted, setMounted] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  /** Ignore prefers-reduced-motion until mount so SSR + first client paint match (avoids hydration mismatch). */
  const reducedMotion = mounted && Boolean(prefersReducedMotion);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (reducedMotion || isDashboardShellPath(pathname)) return <>{children}</>;

  return (
    <AnimatePresence mode="sync" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18, ease: 'easeInOut' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
