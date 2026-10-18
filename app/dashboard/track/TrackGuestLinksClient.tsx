'use client';

import { useEffect, useMemo, useState } from 'react';
import { Calendar, Clock } from 'lucide-react';
import type { GuestLinkOpenStats } from '@/lib/guest-link-open-stats';
import { sortGuestLinksByCheckoutAsc } from '@/lib/guest-link-sort';
import {
  stayvoHostBadgeAccentClass,
  stayvoHostBadgeClass,
  stayvoHostBadgeSuccessClass,
  stayvoHostCalloutClass,
  stayvoHostCalloutDestructiveClass,
  stayvoHostCardClass,
  stayvoHostNavItemActiveClass,
  stayvoHostNavItemClass,
  stayvoHintClass,
  stayvoMutedTextClass,
  stayvoSectionTitleClass,
} from '@/lib/stayvo-ui-classes';
import { cn } from '@/lib/utils';

type GuestLinkItem = {
  id: string;
  property_id: string;
  guest_name: string | null;
  checkout_date: string | null;
  expires_at: string | null;
  token: string;
  created_at: string;
  is_permanent?: boolean | null;
  link_source?: string | null;
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

function LinkStatusBadge({ opened, devices }: { opened: boolean; devices: number }) {
  if (opened) {
    return (
      <span className={cn(stayvoHostBadgeSuccessClass, 'shrink-0 leading-tight')}>
        Opened
        {devices > 0 ? (
          <span className="ml-1 font-semibold tabular-nums text-inherit">· {devices}</span>
        ) : null}
      </span>
    );
  }
  return <span className={stayvoHostBadgeClass}>Not yet</span>;
}

function GuestLinkMeta({
  link,
  last,
}: {
  link: GuestLinkItem;
  last: string | null;
}) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
      <span className={cn(stayvoHintClass, 'inline-flex items-center gap-1')}>
        <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
        {link.is_permanent === true ? 'Permanent' : formatDate(link.checkout_date)}
      </span>
      {last ? (
        <span className={cn(stayvoHintClass, 'inline-flex max-w-full items-center gap-1')}>
          <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
          <span className="truncate">{last}</span>
        </span>
      ) : null}
    </div>
  );
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
  const guestName = displayGuestName(link.guest_name);
  const calendarBadge =
    link.link_source === 'ical' ? (
      <span className={stayvoHostBadgeAccentClass}>Calendar</span>
    ) : null;

  const primaryRow = (
    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
      <span className="min-w-0 text-sm font-medium text-foreground">{guestName}</span>
      {calendarBadge}
      <LinkStatusBadge opened={opened} devices={devices} />
    </div>
  );

  return (
    <>
      <div
        className={cn(
          stayvoHostCardClass,
          'min-w-0 px-3 py-2.5 md:hidden',
        )}
      >
        {primaryRow}
        <GuestLinkMeta link={link} last={last} />
      </div>

      <div
        className={cn(
          stayvoHostCardClass,
          'hidden min-w-0 items-center gap-2 px-3 py-2.5 md:flex',
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
          <span className="min-w-[4rem] truncate text-sm font-medium text-foreground">{guestName}</span>
          {calendarBadge ? <span className="shrink-0">{calendarBadge}</span> : null}
        </div>
        <LinkStatusBadge opened={opened} devices={devices} />
        <span className="h-3 w-px shrink-0 bg-border" aria-hidden />
        <div className="flex min-w-0 shrink-0 items-center gap-x-2 overflow-hidden">
          <span className={cn(stayvoHintClass, 'inline-flex shrink-0 items-center gap-1 whitespace-nowrap')}>
            <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
            {link.is_permanent === true ? 'Permanent' : formatDate(link.checkout_date)}
          </span>
          {last ? (
            <span className={cn(stayvoHintClass, 'inline-flex min-w-0 max-w-[9rem] items-center gap-1')}>
              <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
              <span className="min-w-0 truncate">{last}</span>
            </span>
          ) : null}
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
  const links = useMemo(
    () =>
      sortGuestLinksByCheckoutAsc(
        guestLinks.filter((l) => l.property_id === property.id && !isExpired(l))
      ),
    [guestLinks, property.id]
  );
  const openedCount = links.filter((l) => openStatsByLinkId[l.id]?.deviceCount > 0).length;
  const openedSummary =
    links.length > 0 ? (
      <span className={stayvoHintClass}>
        {openedCount}/{links.length} opened
      </span>
    ) : null;

  return (
    <div>
      {embedded ? (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
          <span className="text-xs font-medium text-foreground">Guest links</span>
          {openedSummary}
        </div>
      ) : (
        <div className="mb-2 flex items-center justify-between gap-2 md:mb-3">
          <h3 className="min-w-0 text-base font-medium text-foreground">
            {displayTitle(property.property_name, property.internal_name)}
          </h3>
          {openedSummary}
        </div>
      )}

      {links.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-3 text-xs text-muted-foreground md:py-4 md:text-sm">
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
    <div className={`${stayvoHostCardClass} flex min-h-0 w-full min-w-0 max-w-full flex-col p-4 md:p-5`}>
      <h2 className="min-w-0 text-left text-base font-medium text-foreground">{headingText}</h2>

      <div className="mt-3 min-w-0 flex-1 md:mt-4">
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
      <p className={cn(stayvoHostCalloutDestructiveClass, 'mt-6')}>
        Guest links could not be loaded. Ensure Supabase migrations are applied.
      </p>
    );
  }

  if (!hasAnyProperty) {
    return (
      <p className={cn(stayvoHostCalloutClass, 'mt-6')}>
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
      <div className="space-y-8 md:hidden">
        {sections.map((section) =>
          section.properties.length === 0 ? null : (
            <section key={section.locationId}>
              <div className="mb-4 border-b border-border pb-3">
                <h2 className={stayvoSectionTitleClass}>{section.locationName}</h2>
                <p className={cn(stayvoMutedTextClass, 'mt-0.5')}>
                  {section.properties.length}{' '}
                  {section.properties.length === 1 ? 'property' : 'properties'}
                </p>
              </div>

              <div className="space-y-5">
                {section.properties.map((property) => (
                  <div key={property.id} className={`${stayvoHostCardClass} p-4`}>
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

      <div className="hidden min-h-0 w-full md:flex md:gap-8">
        <aside className="sticky top-6 w-64 shrink-0 self-start md:max-h-[min(36rem,calc(100dvh-6rem))] md:space-y-1 md:overflow-y-auto md:pr-1">
          {sectionsWithProperties.map((s) => {
            const selected = s.locationId === desktopLocationId;
            return (
              <button
                key={s.locationId}
                type="button"
                onClick={() => setDesktopLocationId(s.locationId)}
                className={cn(
                  selected ? stayvoHostNavItemActiveClass : stayvoHostNavItemClass,
                )}
              >
                <span className="w-full truncate text-left">{s.locationName}</span>
                <span
                  className={cn(
                    'mt-0.5 text-xs font-medium',
                    selected ? 'text-primary/80' : 'text-muted-foreground',
                  )}
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
              <div className="mb-4 border-b border-border pb-3">
                <h2 className={stayvoSectionTitleClass}>
                  {desktopSelectedSection.locationName}
                </h2>
                <p className={cn(stayvoMutedTextClass, 'mt-0.5')}>
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
                <p className={stayvoMutedTextClass}>No properties in this location.</p>
              )}
            </>
          ) : (
            <p className={stayvoMutedTextClass}>Select a location.</p>
          )}
        </div>
      </div>
    </div>
  );
}
