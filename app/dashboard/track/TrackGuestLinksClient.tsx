'use client';

import { useEffect, useMemo, useState } from 'react';
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

  const statusBadges = (
    <div className="flex shrink-0 items-center gap-1.5">
      {opened ? (
        <>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Opened
          </span>
          {devices > 0 ? (
            <span className="inline-flex min-w-[18px] items-center justify-center rounded-full bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {devices}
            </span>
          ) : null}
        </>
      ) : (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
          Not yet
        </span>
      )}
    </div>
  );

  const metaRow = (
    <div className="mt-2 flex flex-wrap items-center gap-3">
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
  );

  return (
    <>
      {/* Mobile: original stacked layout */}
      <div className="relative overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm transition dark:border-white/8 dark:bg-white/5 md:hidden">
        <div
          className={`absolute left-0 top-0 h-full w-1 rounded-l-xl ${opened ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-white/15'}`}
          aria-hidden
        />
        <div className="pl-4 pr-3 py-3">
          <div className="flex items-start justify-between gap-2">{statusBadges}</div>
          <p className="mt-1 text-[15px] font-semibold leading-tight text-slate-900 dark:text-slate-100">
            {displayGuestName(link.guest_name)}
          </p>
          {metaRow}
        </div>
      </div>

      {/* Desktop: compact single row */}
      <div className="relative hidden min-h-0 items-stretch overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm transition dark:border-white/8 dark:bg-white/5 md:flex">
        <div
          className={`w-1 shrink-0 self-stretch rounded-l-xl ${opened ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-white/15'}`}
          aria-hidden
        />
        <div className="flex min-w-0 flex-1 flex-nowrap items-center gap-x-2 gap-y-1 overflow-hidden py-2 pl-2.5 pr-3 md:gap-x-3 md:px-4 md:py-2.5">
          <div className="flex shrink-0 items-center gap-1">
            {opened ? (
              <>
                <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                  <span className="h-1 w-1 rounded-full bg-emerald-500" />
                  Opened
                </span>
                {devices > 0 ? (
                  <span className="inline-flex min-w-[16px] items-center justify-center rounded-full bg-emerald-500 px-1 py-0.5 text-[9px] font-bold text-white">
                    {devices}
                  </span>
                ) : null}
              </>
            ) : (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                Not yet
              </span>
            )}
          </div>
          <span className="h-3 w-px shrink-0 bg-slate-200 dark:bg-white/15" aria-hidden />
          <p className="min-w-0 flex-1 truncate text-sm font-semibold leading-none text-slate-900 dark:text-slate-100">
            {displayGuestName(link.guest_name)}
          </p>
          <div className="flex min-w-0 shrink-0 items-center gap-x-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1 whitespace-nowrap">
              <svg viewBox="0 0 16 16" className="h-3 w-3 shrink-0 text-slate-400" fill="currentColor" aria-hidden>
                <path d="M5 2.5a.5.5 0 0 0-1 0V4H3a1.5 1.5 0 0 0-1.5 1.5v7A1.5 1.5 0 0 0 3 14h10a1.5 1.5 0 0 0 1.5-1.5v-7A1.5 1.5 0 0 0 13 4h-1V2.5a.5.5 0 0 0-1 0V4H5V2.5ZM2.5 7.5h11v5a.5.5 0 0 1-.5.5H3a.5.5 0 0 1-.5-.5v-5Z" />
              </svg>
              {link.is_permanent === true ? 'Permanent' : formatDate(link.checkout_date)}
            </span>
            {last ? (
              <span className="inline-flex max-w-[7.5rem] items-center gap-1 truncate sm:max-w-[10rem]">
                <svg viewBox="0 0 16 16" className="h-3 w-3 shrink-0 text-slate-400" fill="currentColor" aria-hidden>
                  <path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-3.25a.75.75 0 0 1 .75.75v2.69l1.53 1.53a.75.75 0 1 1-1.06 1.06l-1.75-1.75A.75.75 0 0 1 7.25 8.5V5.5A.75.75 0 0 1 8 4.75Z" />
                </svg>
                <span className="truncate">{last}</span>
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}

function PropertyGuestLinksBlock({
  property,
  guestLinks,
  openStatsByLinkId,
  isClientReady,
  embedded = false,
}: {
  property: { id: string; property_name: string; internal_name: string | null };
  guestLinks: GuestLinkItem[];
  openStatsByLinkId: Record<string, GuestLinkOpenStats>;
  isClientReady: boolean;
  /** When true, omit the property title row (parent shows the heading). */
  embedded?: boolean;
}) {
  const links = guestLinks.filter((l) => l.property_id === property.id && !isExpired(l));
  const openedCount = links.filter((l) => openStatsByLinkId[l.id]?.deviceCount > 0).length;

  return (
    <div>
      {embedded ? (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-3 dark:border-white/10">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            Guest links
          </span>
          {links.length > 0 ? (
            <span className="text-[11px] text-slate-400 dark:text-slate-500 md:text-xs">
              {openedCount}/{links.length} opened
            </span>
          ) : null}
        </div>
      ) : (
        <div className="mb-2 flex items-center justify-between gap-2 px-0.5 md:mb-3">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 md:text-base">
            {displayTitle(property.property_name, property.internal_name)}
          </h3>
          {links.length > 0 ? (
            <span className="text-[11px] text-slate-400 dark:text-slate-500 md:text-xs">
              {openedCount}/{links.length} opened
            </span>
          ) : null}
        </div>
      )}

      {links.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white/50 px-4 py-3 text-xs text-slate-600 dark:border-white/10 dark:bg-white/4 dark:text-white md:px-6 md:py-5 md:text-sm">
          No guest links yet.
        </div>
      ) : (
        <div className="space-y-2 md:space-y-1.5">
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
}

function TrackPropertyCard({
  property,
  guestLinks,
  openStatsByLinkId,
  isClientReady,
}: {
  property: { id: string; property_name: string; internal_name: string | null };
  guestLinks: GuestLinkItem[];
  openStatsByLinkId: Record<string, GuestLinkOpenStats>;
  isClientReady: boolean;
}) {
  const headingText =
    (property.internal_name ?? '').trim() ||
    (property.property_name ?? '').trim() ||
    'Untitled';

  return (
    <div className="glass flex min-h-0 w-full min-w-0 max-w-full flex-col rounded-[20px] p-5 dark:border-white/12 dark:bg-[#1a1b1f] md:p-4">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="min-w-0 flex-1 text-left text-base font-semibold leading-tight text-slate-900 dark:text-slate-100">
            {headingText}
          </h2>
        </div>
      </div>

      <div className="mt-4 min-w-0 flex-1 md:mt-3">
        <PropertyGuestLinksBlock
          property={property}
          guestLinks={guestLinks}
          openStatsByLinkId={openStatsByLinkId}
          isClientReady={isClientReady}
          embedded
        />
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

  const sectionsWithProperties = useMemo(
    () => sections.filter((s) => s.properties.length > 0),
    [sections]
  );

  const hasAnyProperty = sectionsWithProperties.length > 0;

  const [desktopLocationId, setDesktopLocationId] = useState<string | null>(null);

  useEffect(() => {
    setIsClientReady(true);
  }, []);

  useEffect(() => {
    if (sectionsWithProperties.length === 0) {
      setDesktopLocationId(null);
      return;
    }
    setDesktopLocationId((prev) => {
      if (prev && sectionsWithProperties.some((s) => s.locationId === prev)) return prev;
      return sectionsWithProperties[0]!.locationId;
    });
  }, [sectionsWithProperties]);

  if (guestLinksError) {
    return (
      <p className="mt-6 text-sm text-amber-700">
        Guest links could not be loaded. Ensure Supabase migrations are applied.
      </p>
    );
  }

  if (!hasAnyProperty) {
    return (
      <p className="mt-6 text-sm text-slate-600">
        No live properties yet. Publish a property from Manage to generate trackable links.
      </p>
    );
  }

  const desktopSelectedSection =
    desktopLocationId != null
      ? sectionsWithProperties.find((s) => s.locationId === desktopLocationId) ?? null
      : null;

  return (
    <div className="mt-6 w-full">
      <div className="mx-auto w-full max-w-[1200px] space-y-8 md:hidden">
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
                {section.properties.map((property) => (
                  <div key={property.id}>
                    <PropertyGuestLinksBlock
                      property={property}
                      guestLinks={guestLinks}
                      openStatsByLinkId={openStatsByLinkId}
                      isClientReady={isClientReady}
                    />
                  </div>
                ))}
              </div>
            </section>
          )
        )}
      </div>

      <div className="mx-auto hidden min-h-0 w-full max-w-[1200px] md:flex md:gap-8">
        <aside className="sticky top-6 w-[220px] shrink-0 self-start md:max-h-[min(36rem,calc(100dvh-6rem))] md:space-y-1 md:overflow-y-auto md:pr-1">
          {sectionsWithProperties.map((s) => {
            const selected = s.locationId === desktopLocationId;
            return (
              <button
                key={s.locationId}
                type="button"
                onClick={() => setDesktopLocationId(s.locationId)}
                className={`flex w-full flex-col items-start rounded-full px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                  selected
                    ? 'bg-brand font-bold text-amber-950 shadow-sm dark:text-amber-950'
                    : 'text-slate-700 hover:bg-white/60 dark:text-slate-200 dark:hover:bg-white/10'
                }`}
              >
                <span className="w-full truncate">{s.locationName}</span>
                <span
                  className={`mt-0.5 text-xs font-medium ${
                    selected ? 'text-amber-950/80' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {s.properties.length} {s.properties.length === 1 ? 'property' : 'properties'}
                </span>
              </button>
            );
          })}
        </aside>
        <div className="min-w-0 flex-1">
          {desktopSelectedSection ? (
            <>
              <div className="mb-4 border-b border-amber-200/50 pb-3 dark:border-amber-900/40">
                <h2 className="text-lg font-semibold text-brand md:text-xl">
                  {desktopSelectedSection.locationName}
                </h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {desktopSelectedSection.properties.length}{' '}
                  {desktopSelectedSection.properties.length === 1 ? 'property' : 'properties'}
                </p>
              </div>
              {desktopSelectedSection.properties.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-5">
                  {desktopSelectedSection.properties.map((p) => (
                    <TrackPropertyCard
                      key={p.id}
                      property={p}
                      guestLinks={guestLinks}
                      openStatsByLinkId={openStatsByLinkId}
                      isClientReady={isClientReady}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No properties in this location.
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">Select a location.</p>
          )}
        </div>
      </div>
    </div>
  );
}
