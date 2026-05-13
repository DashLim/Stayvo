'use client';

import { useEffect, useState } from 'react';
import { setClientThemeCookie } from '@/lib/theme-cookie';

export default function ThemeToggle({ className = '' }: { className?: string }) {
  /** Synced from `<html class="dark">` after mount — first paint matches SSR (always light icon until resolved). */
  const [dark, setDark] = useState(false);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
    setResolved(true);
  }, []);

  function toggle() {
    setDark((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('stayvo-theme', 'dark');
        setClientThemeCookie('dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('stayvo-theme', 'light');
        setClientThemeCookie('light');
      }
      return next;
    });
  }

  const showSun = resolved && dark;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={showSun ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`glass inline-flex h-10 w-10 items-center justify-center rounded-full transition hover:opacity-80 ${className}`}
    >
      {showSun ? (
        /* Sun icon */
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-amber-400" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
          <path
            d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        /* Moon icon */
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-slate-600" fill="none" aria-hidden>
          <path
            d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}
