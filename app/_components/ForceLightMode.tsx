'use client';

import { useEffect } from 'react';

/**
 * Removes the `dark` class from <html> while the page is mounted.
 * Restores it on unmount if it was present before.
 */
export default function ForceLightMode() {
  useEffect(() => {
    const root = document.documentElement;
    const hadDark = root.classList.contains('dark');
    if (hadDark) root.classList.remove('dark');
    return () => {
      if (hadDark) root.classList.add('dark');
    };
  }, []);
  return null;
}
