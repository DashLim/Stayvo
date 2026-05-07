'use client';

import { useEffect, useRef } from 'react';
import { createSupabasePublicClient } from '@/lib/supabase/public';

const STORAGE_KEY = 'stayvo.guestVisitor.v1';

function getOrCreateVisitorId(): string {
  if (typeof window === 'undefined') return '';
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(existing)) {
      return existing.toLowerCase();
    }
    const id = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, id);
    return id;
  } catch {
    return '';
  }
}

/** Records one portal view per browser profile (see migration `guest_link_visitors`). */
export default function StayOpenTracker({ token }: { token: string }) {
  const recorded = useRef(false);

  useEffect(() => {
    if (recorded.current) return;
    const t = (token ?? '').trim();
    if (!t) return;
    const visitorKey = getOrCreateVisitorId();
    if (!visitorKey) return;
    recorded.current = true;

    const supabase = createSupabasePublicClient();
    void supabase
      .rpc('record_guest_link_open', {
        p_token: t,
        p_visitor_key: visitorKey,
      })
      .then(({ error }) => {
        if (error && process.env.NODE_ENV === 'development') {
          console.warn(
            '[Stayvo] record_guest_link_open failed — apply migration 0013_guest_link_visitor_tracking.sql (supabase db push).',
            error.message
          );
        }
      });
  }, [token]);

  return null;
}
