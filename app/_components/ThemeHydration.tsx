'use client';

import { useLayoutEffect } from 'react';
import { usePathname } from 'next/navigation';
import { setClientThemeCookie } from '@/lib/theme-cookie';

/** Applies saved / system theme before paint after hydration — avoids React 19 `<script>` warnings from `next/script` beforeInteractive. */
export default function ThemeHydration() {
  const pathname = usePathname() ?? '';

  useLayoutEffect(() => {
    if (pathname.startsWith('/login')) return;
    try {
      const t = localStorage.getItem('stayvo-theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const useDark = t === 'dark' || (t === null && prefersDark);
      const root = document.documentElement;
      if (useDark) root.classList.add('dark');
      else root.classList.remove('dark');
      setClientThemeCookie(useDark ? 'dark' : 'light');
    } catch {
      /* localStorage / matchMedia unavailable */
    }
  }, [pathname]);
  return null;
}
