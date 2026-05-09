'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type QuickNavItem = {
  key: 'checkin' | 'parking' | 'wifi' | 'rules' | 'call' | 'whatsapp';
  targetId?: string;
};

function iconClass(active: boolean) {
  return active ? 'text-brand' : 'text-slate-500';
}

export default function GuestSectionQuickNav({
  items,
  callHref,
  whatsappHref,
}: {
  items: QuickNavItem[];
  callHref: string | null;
  whatsappHref: string | null;
}) {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const barRef = useRef<HTMLDivElement | null>(null);
  const activeSectionRef = useRef<string | null>(null);
  const tickingRef = useRef(false);

  const observedIds = useMemo(
    () =>
      Array.from(
        new Set(items.map((item) => item.targetId).filter((id): id is string => Boolean(id)))
      ),
    [items]
  );

  useEffect(() => {
    if (observedIds.length === 0) return;

    const activationLineRatio = 0.38;
    const switchDeadZonePx = 14;

    const updateActiveSection = () => {
      tickingRef.current = false;

      const activationY = window.innerHeight * activationLineRatio;
      let nextId: string | null = null;
      let nextDistance = Number.POSITIVE_INFINITY;

      for (const id of observedIds) {
        const el = document.getElementById(id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        const distance = Math.abs(rect.top - activationY);
        if (distance < nextDistance) {
          nextDistance = distance;
          nextId = id;
        }
      }

      if (!nextId) return;

      const currentId = activeSectionRef.current;
      if (currentId && currentId !== nextId) {
        const currentEl = document.getElementById(currentId);
        if (currentEl) {
          const currentDistance = Math.abs(currentEl.getBoundingClientRect().top - activationY);
          if (Math.abs(currentDistance - nextDistance) < switchDeadZonePx) {
            return;
          }
        }
      }

      activeSectionRef.current = nextId;
      setActiveSection(nextId);
    };

    const onScrollOrResize = () => {
      if (tickingRef.current) return;
      tickingRef.current = true;
      window.requestAnimationFrame(updateActiveSection);
    };

    updateActiveSection();
    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize);

    return () => {
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [observedIds]);

  const onJump = (targetId: string) => {
    const el = document.getElementById(targetId);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const barContent = (
    <div className="relative rounded-full border border-white/75 bg-white/70 shadow-[0_10px_24px_rgba(15,23,42,0.1)] backdrop-blur-xl">
      <div className="flex w-full items-center justify-evenly px-2 py-1.5">
        {items.map((item) => {
          const isActive =
            item.key === 'call' || item.key === 'whatsapp'
              ? activeSection === 'host-section'
              : Boolean(item.targetId && item.targetId === activeSection);

          if (item.key === 'call') {
            if (!callHref) return null;
            return (
              <a
                key={item.key}
                href={callHref}
                className={`inline-flex h-10 w-10 items-center justify-center rounded-full transition duration-150 active:scale-95 ${
                  isActive ? 'bg-brand/12' : 'hover:bg-white/70'
                }`}
                aria-label="Call host"
              >
                <svg viewBox="0 0 24 24" className={`h-5 w-5 ${iconClass(isActive)}`} fill="none" aria-hidden>
                  <path
                    d="M3.2 5.6a2 2 0 0 1 2-2h2.1a2 2 0 0 1 1.9 1.4l.7 2.2a2 2 0 0 1-.5 2l-1.2 1.2a15.5 15.5 0 0 0 5.4 5.4l1.2-1.2a2 2 0 0 1 2-.5l2.2.7a2 2 0 0 1 1.4 1.9v2.1a2 2 0 0 1-2 2h-1.4C9.2 20.8 3.2 14.8 3.2 7V5.6Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
            );
          }

          if (item.key === 'whatsapp') {
            if (!whatsappHref) return null;
            return (
              <a
                key={item.key}
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex h-10 w-10 items-center justify-center rounded-full transition duration-150 active:scale-95 ${
                  isActive ? 'bg-brand/12' : 'hover:bg-white/70'
                }`}
                aria-label="Message host on WhatsApp"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#25D366]" fill="currentColor" aria-hidden>
                  <path d="M20.52 3.48A11.88 11.88 0 0 0 12.06 0C5.52 0 .29 5.23.29 11.66c0 2.06.54 4.07 1.57 5.86L0 24l6.63-1.74a11.7 11.7 0 0 0 5.43 1.38h.01c6.54 0 11.77-5.23 11.77-11.66 0-3.12-1.22-6.05-3.32-8.5ZM12.06 21.5h-.01a9.4 9.4 0 0 1-4.8-1.32l-.34-.2-3.8 1 1.02-3.7-.22-.36a9.43 9.43 0 0 1-1.44-5.01c0-5.2 4.24-9.43 9.47-9.43 2.53 0 4.9.99 6.68 2.77a9.36 9.36 0 0 1 2.77 6.66c0 5.2-4.24 9.44-9.47 9.44Zm5.48-7.49c-.3-.15-1.77-.87-2.04-.97-.28-.1-.48-.15-.68.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.89-.8-1.49-1.79-1.66-2.09-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.68-1.64-.93-2.25-.25-.58-.5-.5-.68-.51l-.58-.01c-.2 0-.52.07-.79.37-.28.3-1.05 1.02-1.05 2.5 0 1.47 1.08 2.9 1.23 3.1.15.2 2.12 3.23 5.14 4.52.72.31 1.28.5 1.72.64.72.23 1.37.2 1.88.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.18-1.42-.08-.12-.28-.2-.58-.35Z" />
                </svg>
              </a>
            );
          }

          if (!item.targetId) return null;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onJump(item.targetId!)}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full transition duration-150 active:scale-95 ${
                isActive ? 'bg-brand/12' : 'hover:bg-white/70'
              }`}
              aria-label={`Jump to ${item.key}`}
            >
              {item.key === 'checkin' ? (
                <svg viewBox="0 0 20 20" className={`h-5 w-5 ${iconClass(isActive)}`} fill="currentColor" aria-hidden>
                  <path d="M5.5 2.5a.75.75 0 0 1 .75.75V4h7.5v-.75a.75.75 0 0 1 1.5 0V4h.25A2.25 2.25 0 0 1 17.75 6.25v8.5A2.25 2.25 0 0 1 15.5 17h-11a2.25 2.25 0 0 1-2.25-2.25v-8.5A2.25 2.25 0 0 1 4.5 4h.25v-.75a.75.75 0 0 1 .75-.75Zm-1 6.5a.5.5 0 0 0-.5.5v5.25c0 .41.34.75.75.75h10.5a.75.75 0 0 0 .75-.75V9.5a.5.5 0 0 0-.5-.5h-11Z" />
                </svg>
              ) : null}
              {item.key === 'parking' ? (
                <svg viewBox="0 0 20 20" className={`h-5 w-5 ${iconClass(isActive)}`} fill="currentColor" aria-hidden>
                  <path d="M6 3.5A1.5 1.5 0 0 0 4.5 5v10A1.5 1.5 0 0 0 6 16.5h2.25V12h2.5a4.25 4.25 0 0 0 0-8.5H6Zm2.25 2h2.5a1.75 1.75 0 0 1 0 3.5h-2.5v-3.5Z" />
                </svg>
              ) : null}
              {item.key === 'wifi' ? (
                <svg viewBox="0 0 20 20" className={`h-5 w-5 ${iconClass(isActive)}`} fill="currentColor" aria-hidden>
                  <path d="M10 15.75a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3ZM3.3 12.46a.75.75 0 0 0 1.06 1.06 7.98 7.98 0 0 1 11.28 0 .75.75 0 1 0 1.06-1.06 9.48 9.48 0 0 0-13.4 0Zm-2.2-3.28a.75.75 0 0 0 1.05 1.07 11.98 11.98 0 0 1 16.7 0 .75.75 0 1 0 1.05-1.07 13.48 13.48 0 0 0-18.8 0Z" />
                </svg>
              ) : null}
              {item.key === 'rules' ? (
                <svg viewBox="0 0 20 20" className={`h-5 w-5 ${iconClass(isActive)}`} fill="currentColor" aria-hidden>
                  <path d="M4.25 2.5A1.75 1.75 0 0 0 2.5 4.25v11.5c0 .97.78 1.75 1.75 1.75h11.5c.97 0 1.75-.78 1.75-1.75V7.38a1.75 1.75 0 0 0-.51-1.24l-3.63-3.63a1.75 1.75 0 0 0-1.24-.51H4.25Zm2.25 4a.75.75 0 0 1 .75-.75h5a.75.75 0 0 1 0 1.5h-5A.75.75 0 0 1 6.5 6.5Zm0 3.5a.75.75 0 0 1 .75-.75h5a.75.75 0 0 1 0 1.5h-5a.75.75 0 0 1-.75-.75Zm0 3.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 0 1.5h-3a.75.75 0 0 1-.75-.75Z" />
                </svg>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );

  if (!isMounted) return null;

  return createPortal(
    <div
      ref={barRef}
      className="fixed inset-x-0 z-50 px-3 pb-2"
      style={{ bottom: 'calc(env(safe-area-inset-bottom) + 8px)' }}
    >
      {barContent}
    </div>,
    document.body
  );
}
