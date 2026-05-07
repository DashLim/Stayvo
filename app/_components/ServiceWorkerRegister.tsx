'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    // In dev, never keep a service worker: stale cached JS causes hydration mismatches.
    if (process.env.NODE_ENV !== 'production') {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          void registration.unregister();
        });
      });
      return;
    }
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .catch((err) => {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[SW] Registration failed:', err);
        }
      });
  }, []);

  return null;
}
