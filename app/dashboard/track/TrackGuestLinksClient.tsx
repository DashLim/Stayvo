'use client';

import { useEffect, useState } from 'react';
import type { GuestLinkOpenStats } from '@/lib/guest-link-open-stats';

type GuestLinkItem = {
  id: string;
  property_id: string;
  guest_name: string | null;
  checkout_date: string | null;
  expires_at: string | null;
  token: string;
  created_at: string;
  is_permanent?: boolean | null;
};

type Section = {
  locationId: string;
  locationName: string;
  properties: Array<{
    id: string;
    property_name: string;
    internal_name: string | null;
  }>;
};

function displayTitle(property_name: string, internal_name: string | null) {
  return (internal_name ?? '').trim() || property_name;
}

function displayGuestName(name: string | null | undefined) {
  const t = (name ?? '').trim();
  return t.length > 0 ? t : 'Guest';
}

function formatDate(dateValue: string | null) {
  if (!dateValue) return '—';
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return dateValue;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]}`;
}

function formatLastOpen(iso: string | null | undefined) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

function isExpired(link: GuestLinkItem) {
  if (link.is_permanent) return false;
  if (!link.expires_at) return false;
  return new Date(link.expires_at).getTime() < Date.now();
}

function GuestCard({
  link,
  stat,
  isClientReady,
}: {
  link: GuestLinkItem;
  stat: GuestLinkOpenStats | undefined;
  isClientReady: boolean;
}) {
  const opened = Boolean(stat && stat.deviceCount > 0);
  const last = isClientReady ? formatLastOpen(stat?.lastOpenAt) : null;
  const devices = stat?.deviceCount ?? 0;

  return (
    <div
      className="relative overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm transition dark:border-white/8 dark:bg-white/5"
      style={{ borderLeftWidth: '4px', borderLeftColor: undefined }}
    >
      {/* Left accent strip */}
      <div
        className={`absolute left-0 top-0 h-full w-1 rounded-l-xl ${opened ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-white/15'}`}
      />

      <div className="pl-4 pr-3 py-3">
        {/* Top row: status badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex shrink-0 items-center gap-1.5">
            {opened ? (
              <>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Opened
                </span>
                {devices > 0 && (
                  <span className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold text-white min-w-[18px]">
                    {devices}
                  </span>
                )}
              </>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                Not yet
              </span>
            )}
          </div>
        </div>

        {/* Guest name */}
        <p className="mt-1 text-[15px] font-semibold leading-tight text-slate-900 dark:text-slate-100">
          {displayGuestName(link.guest_name)}
        </p>

        {/* Bottom metadata row */}
        <div className="mt-2 flex items-center gap-3 flex-wrap">
          <span className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
            <svg viewBox="0 0 16 16" className="h-3 w-3 shrink-0 text-slate-400" fill="currentColor" aria-hidden>
              <path d="M5 2.5a.5.5 0 0 0-1 0V4H3a1.5 1.5 0 0 0-1.5 1.5v7A1.5 1.5 0 0 0 3 14h10a1.5 1.5 0 0 0 1.5-1.5v-7A1.5 1.5 0 0 0 13 4h-1V2.5a.5.5 0 0 0-1 0V4H5V2.5ZM2.5 7.5h11v5a.5.5 0 0 1-.5.5H3a.5.5 0 0 1-.5-.5v-5Z" />
            </svg>
            {link.is_permanent === true ? 'Permanent' : formatDate(link.checkout_date)}
          </span>
          {last ? (
            <span className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
              <svg viewBox="0 0 16 16" className="h-3 w-3 shrink-0 text-slate-400" fill="currentColor" aria-hidden>
                <path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-3.25a.75.75 0 0 1 .75.75v2.69l1.53 1.53a.75.75 0 1 1-1.06 1.06l-1.75-1.75A.75.75 0 0 1 7.25 8.5V5.5A.75.75 0 0 1 8 4.75Z" />
              </svg>
              {last}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function TrackGuestLinksClient({
  sections,
  guestLinks,
  guestLinksError,
  openStatsByLinkId,
}: {
  sections: Section[];
  guestLinks: GuestLinkItem[];
  guestLinksError: boolean;
  openStatsByLinkId: Record<string, GuestLinkOpenStats>;
}) {
  const [isClientReady, setIsClientReady] = useState(false);

  useEffect(() => {
    setIsClientReady(true);
  }, []);

  if (guestLinksError) {
    return (
      <p className="mt-6 text-sm text-amber-700">
        Guest links could not be loaded. Ensure Supabase migrations are applied.
      </p>
    );
  }

  const anyProperty = sections.some((s) => s.properties.length > 0);

  if (!anyProperty) {
    return (
      <p className="mt-6 text-sm text-slate-600">
        No live properties yet. Publish a property from Manage to generate trackable links.
      </p>
    );
  }

  return (
    <div className="mt-6 space-y-8">
      {sections.map((section) =>
        section.properties.length === 0 ? null : (
          <section key={section.locationId}>
            {/* Location header */}
            <div className="mb-4 flex items-center gap-2">
              <span className="rounded-full bg-brand/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-brand dark:bg-brand/15">
                {section.locationName}
              </span>
              <div className="h-px flex-1 bg-amber-200/60 dark:bg-amber-900/40" />
            </div>

            {/* Property groups */}
            <div className="space-y-5">
              {section.properties.map((property) => {
                const links = guestLinks.filter((l) => l.property_id === property.id && !isExpired(l));
                const title = displayTitle(property.property_name, property.internal_name);
                const openedCount = links.filter(
                  (l) => openStatsByLinkId[l.id]?.deviceCount > 0
                ).length;

                return (
                  <div key={property.id}>
                    {/* Property column header */}
                    <div className="mb-2 flex items-center justify-between gap-2 px-0.5">
                      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</h3>
                      {links.length > 0 && (
                        <span className="text-[11px] text-slate-400 dark:text-slate-500">
                          {openedCount}/{links.length} opened
                        </span>
                      )}
                    </div>

                    {/* Cards */}
                    {links.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-200 bg-white/50 px-4 py-3 text-xs text-slate-600 dark:border-white/10 dark:bg-white/4 dark:text-white">
                        No guest links yet.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {links.map((l) => (
                          <GuestCard
                            key={l.id}
                            link={l}
                            stat={openStatsByLinkId[l.id]}
                            isClientReady={isClientReady}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )
      )}
    </div>
  );
}
