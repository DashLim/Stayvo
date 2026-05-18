'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { ReactNode } from 'react';
import { hasText } from '@/app/_guest/guest-portal-utils';

/** Desktop (md+) sticky hero column — one panel so the left rail reads as a single concierge card. */
export default function DesktopGuestLeftColumn({
  coverSrc,
  propertyName,
  introDesktop,
  expiryLine,
  showHostSidebar,
  hostName,
  directBookingUrl,
  whatsappHref,
  hostCallHref,
}: {
  coverSrc: string;
  propertyName: string;
  introDesktop: ReactNode;
  expiryLine: ReactNode;
  showHostSidebar: boolean;
  hostName: string;
  directBookingUrl: string | null;
  whatsappHref: string | null;
  hostCallHref: string | null;
}) {
  const bookingHref = (directBookingUrl ?? '').trim() || null;
  return (
    <div className="max-md:hidden flex w-full min-h-0 flex-col gap-6 md:rounded-2xl md:border md:border-slate-200/70 md:bg-white/85 md:p-6 md:shadow-[0_2px_12px_rgba(0,0,0,0.06)] md:ring-1 md:ring-white/60 md:backdrop-blur-sm">
      <div className="relative h-[280px] w-full shrink-0 overflow-hidden rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] ring-1 ring-slate-900/10">
        <img src={coverSrc} alt={propertyName} className="h-full w-full object-cover" />
      </div>
      <div className="shrink-0 space-y-1">
        {introDesktop}
        {expiryLine}
      </div>
      <div className="mt-auto flex min-h-0 flex-col gap-4 border-t border-slate-200/60 pt-5">
        {showHostSidebar ? (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Your host</p>
            {hasText(hostName) ? <p className="mt-1 text-lg font-semibold text-slate-900">{hostName}</p> : null}
            <div className="mt-3 flex flex-col gap-2">
              {bookingHref ? (
                <a
                  href={bookingHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" aria-hidden>
                    <path
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 0 1 9-9"
                    />
                  </svg>
                  Booking Website
                </a>
              ) : null}
              {hostCallHref ? (
                <Link
                  href={hostCallHref}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-brand bg-white px-4 py-2.5 text-sm font-semibold text-brand shadow-sm transition hover:bg-slate-50"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" aria-hidden>
                    <path
                      d="M6.5 4.75a1.5 1.5 0 0 1 1.5-1.5h1.58a1.5 1.5 0 0 1 1.43 1.05l.52 1.65a1.5 1.5 0 0 1-.38 1.5l-.9.9a12 12 0 0 0 4.04 4.04l.9-.9a1.5 1.5 0 0 1 1.5-.38l1.65.52a1.5 1.5 0 0 1 1.05 1.43v1.58a1.5 1.5 0 0 1-1.5 1.5h-1.05C10.6 19.25 4.75 13.4 4.75 6.55V5.5a1.5 1.5 0 0 1 1.5-1.5Z"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Call host
                </Link>
              ) : null}
              {whatsappHref ? (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1ebe57]"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="currentColor" aria-hidden>
                    <path d="M20.52 3.48A11.88 11.88 0 0 0 12.06 0C5.52 0 .29 5.23.29 11.66c0 2.06.54 4.07 1.57 5.86L0 24l6.63-1.74a11.7 11.7 0 0 0 5.43 1.38h.01c6.54 0 11.77-5.23 11.77-11.66 0-3.12-1.22-6.05-3.32-8.5ZM12.06 21.5h-.01a9.4 9.4 0 0 1-4.8-1.32l-.34-.2-3.8 1 1.02-3.7-.22-.36a9.43 9.43 0 0 1-1.44-5.01c0-5.2 4.24-9.43 9.47-9.43 2.53 0 4.9.99 6.68 2.77a9.36 9.36 0 0 1 2.77 6.66c0 5.2-4.24 9.44-9.47 9.44Zm5.48-7.49c-.3-.15-1.77-.87-2.04-.97-.28-.1-.48-.15-.68.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.89-.8-1.49-1.79-1.66-2.09-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.68-1.64-.93-2.25-.25-.58-.5-.5-.68-.51l-.58-.01c-.2 0-.52.07-.79.37-.28.3-1.05 1.02-1.05 2.5 0 1.47 1.08 2.9 1.23 3.1.15.2 2.12 3.23 5.14 4.52.72.31 1.28.5 1.72.64.72.23 1.37.2 1.88.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.18-1.42-.08-.12-.28-.2-.58-.35Z" />
                  </svg>
                  Message on WhatsApp
                </a>
              ) : null}
            </div>
          </div>
        ) : null}
        <Link
          href="https://stayvo.io"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block max-w-[160px] rounded-md opacity-85 outline-none ring-brand/40 transition-opacity hover:opacity-100 focus-visible:ring-2"
          aria-label="Stayvo — opens in a new tab"
        >
          <Image
            src="/brand/stayvo-guest-logo-lockup.png"
            alt=""
            width={1024}
            height={365}
            unoptimized
            className="h-5 w-auto max-w-full"
          />
        </Link>
      </div>
    </div>
  );
}
