'use client';

import { useLayoutEffect } from 'react';
import { setClientThemeCookie } from '@/lib/theme-cookie';

/** Login route is light-only; runs in useLayoutEffect so it wins after ThemeHydration on this tree. */
export default function ForceLightOnLogin() {
  useLayoutEffect(() => {
    try {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('stayvo-theme', 'light');
      setClientThemeCookie('light');
    } catch {
      /* ignore */
    }
  }, []);
  return null;
}
