'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import PropertyCard from '@/app/dashboard/PropertyCard';

const DashboardLocationFilterSheet = dynamic(
  () => import('@/app/dashboard/DashboardLocationFilterSheet'),
  { ssr: false }
);

const STORAGE_KEY_PREFIX = 'stayvo.dashboard.selectedLocationIds';

const PERSIST_VERSION = 1 as const;

type PersistedSelectionV1 = {
  v: typeof PERSIST_VERSION;
  selected: string[];
  /** Joined location ids when `selected` was saved — used to merge in new locations only. */
  catalogKey: string;
};

function storageKey(userId: string) {
  return `${STORAGE_KEY_PREFIX}:${userId}`;
}

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

type LocationOption = { id: string; name: string };

function EmptyLocationPlaceholder({ locationName }: { locationName: string }) {
  return (
    <div className="glass rounded-[20px] border border-slate-200/80 bg-white/60 p-6 text-center dark:border-white/10 dark:bg-white/[0.04] md:p-8">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        No live properties in{' '}
        <span className="font-semibold text-slate-800 dark:text-slate-200">{locationName}</span> yet.
      </p>
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-500">
        Use Manage to add a property or set a draft to live for this location.
      </p>
      <Link
        href="/dashboard/manage"
        className="mt-4 inline-flex items-center justify-center rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-90"
      >
        Open Manage
      </Link>
    </div>
  );
}

export default function DashboardClient({
  userId,
  nowIso,
  sections,
  locationOptions,
  guestLinks,
  guestLinksError,
  hasAnyLiveProperty,
  hostDisplayName,
  guestLinkBaseUrl,
}: {
  userId: string;
  nowIso: string;
  sections: Section[];
  locationOptions: LocationOption[];
  guestLinks: GuestLinkItem[];
  guestLinksError: boolean;
  /** True if user has at least one live property (shown on this dashboard). */
  hasAnyLiveProperty: boolean;
  /** Profile host display name — first segment of generated guest portal URLs. */
  hostDisplayName: string | null;
  /** Public origin for shared guest links (e.g. https://stayvo.io). Passed from server so it matches Vercel env at runtime. */
  guestLinkBaseUrl: string;
}) {
  /** Location has at least one live property — used to enable location filters. */
  const hasLiveByLocation = useMemo(() => {
    const m = new Map<string, boolean>();
    for (const s of sections) {
      m.set(s.locationId, s.properties.length > 0);
    }
    return m;
  }, [sections]);

  const selectableOptionIds = useMemo(
    () =>
      locationOptions
        .filter((o) => hasLiveByLocation.get(o.id) === true)
        .map((o) => o.id),
    [locationOptions, hasLiveByLocation]
  );

  const optionIds = useMemo(
    () => locationOptions.map((o) => o.id),
    [locationOptions]
  );

  /** null = not yet read from localStorage (avoid hydration mismatch and persist races). */
  const [selectedIds, setSelectedIds] = useState<string[] | null>(null);

  const optionIdsKey = optionIds.join('|');

  useLayoutEffect(() => {
    const knownLocationIds = new Set(optionIds);
    if (optionIds.length === 0) {
      setSelectedIds([]);
      return;
    }

    let nextSelected: string[];

    try {
      const raw = localStorage.getItem(storageKey(userId));
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (
          parsed &&
          typeof parsed === 'object' &&
          !Array.isArray(parsed) &&
          (parsed as PersistedSelectionV1).v === PERSIST_VERSION &&
          Array.isArray((parsed as PersistedSelectionV1).selected) &&
          (parsed as PersistedSelectionV1).selected.every((x) => typeof x === 'string') &&
          typeof (parsed as PersistedSelectionV1).catalogKey === 'string'
        ) {
          const row = parsed as PersistedSelectionV1;
          nextSelected = row.selected.filter((id) => knownLocationIds.has(id));
          const oldCatalog = new Set(row.catalogKey.split('|').filter(Boolean));
          const addedLocationIds = optionIds.filter((id) => !oldCatalog.has(id));
          if (addedLocationIds.length > 0) {
            nextSelected = [...new Set([...nextSelected, ...addedLocationIds])];
          }
        } else if (Array.isArray(parsed) && parsed.every((x) => typeof x === 'string')) {
          const valid = (parsed as string[]).filter((id) => knownLocationIds.has(id));
          nextSelected = valid.length === 0 ? [...optionIds] : valid;
        } else {
          nextSelected = [...optionIds];
        }
      } else {
        nextSelected = [...optionIds];
      }
    } catch {
      nextSelected = [...optionIds];
    }

    setSelectedIds((prev) => {
      const nextSorted = [...nextSelected].sort().join('\0');
      if (prev !== null && [...prev].sort().join('\0') === nextSorted) return prev;
      return nextSelected;
    });
  }, [userId, optionIdsKey, optionIds]);

  useEffect(() => {
    if (selectedIds === null) return;
    try {
      const payload: PersistedSelectionV1 = {
        v: PERSIST_VERSION,
        selected: selectedIds,
        catalogKey: optionIdsKey,
      };
      localStorage.setItem(storageKey(userId), JSON.stringify(payload));
    } catch {
      /* ignore */
    }
  }, [userId, selectedIds]);

  const effectiveIds = selectedIds ?? optionIds;
  const selectedSet = useMemo(() => new Set(effectiveIds), [effectiveIds]);

  const visibleSections = useMemo(() => {
    return sections.filter((s) => selectedSet.has(s.locationId));
  }, [sections, selectedSet]);

  function toggleLocation(id: string, checked: boolean) {
    if (!selectableOptionIds.includes(id)) return;
    setSelectedIds((prev) => {
      const base = prev ?? optionIds;
      if (checked) {
        if (base.includes(id)) return base;
        return [...base, id];
      }
      return base.filter((x) => x !== id);
    });
  }

  function selectAll() {
    setSelectedIds([...optionIds]);
  }

  function selectNone() {
    setSelectedIds([]);
  }

  const storageReady = selectedIds !== null;
  const [openLinksPanel, setOpenLinksPanel] = useState<{
    propertyId: string;
    panel: 'active' | 'generate';
  } | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [locationQuery, setLocationQuery] = useState('');
  const [desktopLocationId, setDesktopLocationId] = useState<string | null>(null);
  const filteredLocationOptions = useMemo(() => {
    const q = locationQuery.trim().toLowerCase();
    if (!q) return locationOptions;
    return locationOptions.filter((loc) => loc.name.toLowerCase().includes(q));
  }, [locationOptions, locationQuery]);

  function openFilter() {
    setFiltersOpen(true);
    window.dispatchEvent(new Event('stayvo:filter-open'));
  }

  function closeFilter() {
    setFiltersOpen(false);
    window.dispatchEvent(new Event('stayvo:filter-close'));
  }

  useEffect(() => {
    function onOpenFilter() { openFilter(); }
    window.addEventListener('stayvo:dashboard-open-filter', onOpenFilter);
    return () => window.removeEventListener('stayvo:dashboard-open-filter', onOpenFilter);
  }, []);

  useEffect(() => {
    document.body.style.overflow = filtersOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [filtersOpen]);

  useEffect(() => {
    if (visibleSections.length === 0) {
      setDesktopLocationId(null);
      return;
    }
    setDesktopLocationId((prev) => {
      if (prev && visibleSections.some((s) => s.locationId === prev)) return prev;
      return visibleSections[0]!.locationId;
    });
  }, [visibleSections]);

  const desktopSelectedSection =
    desktopLocationId != null
      ? visibleSections.find((s) => s.locationId === desktopLocationId) ?? null
      : null;

  return (
    <>
      <DashboardLocationFilterSheet
        filtersOpen={filtersOpen}
        closeFilter={closeFilter}
        storageReady={storageReady}
        filteredLocationOptions={filteredLocationOptions}
        selectedSet={selectedSet}
        toggleLocation={toggleLocation}
        selectAll={selectAll}
        selectNone={selectNone}
        locationQuery={locationQuery}
        setLocationQuery={setLocationQuery}
        hasLiveByLocation={hasLiveByLocation}
      />

      <section className="mt-6 md:mt-8">
        {storageReady &&
        selectedIds !== null &&
        selectedIds.length === 0 &&
        locationOptions.length > 0 ? (
          <div className="glass rounded-[20px] p-6 text-center md:p-8">
            <h2 className="text-base font-semibold dark:text-slate-100">No locations selected</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Choose one or more locations above to see properties here.
            </p>
          </div>
        ) : visibleSections.length > 0 ? (
          <div className="mx-auto w-full max-w-[1200px]">
            <div className="flex flex-col gap-8 md:hidden">
              {visibleSections.map((section) => (
                <div key={section.locationId}>
                  <div className="mb-4 flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between md:mb-5">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="h-px flex-1 bg-amber-200/60 dark:bg-amber-900/40" />
                      <h2 className="shrink-0 text-center text-xs font-semibold uppercase tracking-widest text-amber-800/80 dark:text-amber-500/80 md:text-base md:normal-case md:tracking-tight">
                        <span className="block md:inline">{section.locationName}</span>
                        <span className="mt-1 block text-[11px] font-semibold normal-case text-slate-500 dark:text-slate-400 md:ml-2 md:mt-0 md:inline">
                          {section.properties.length}{' '}
                          {section.properties.length === 1 ? 'property' : 'properties'}
                        </span>
                      </h2>
                      <div className="h-px flex-1 bg-amber-200/60 dark:bg-amber-900/40" />
                    </div>
                  </div>
                  {section.properties.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-5">
                      {section.properties.map((p) => {
                        const linksForProperty = (
                          guestLinksError ? [] : guestLinks
                        ).filter((l) => l.property_id === p.id);
                        return (
                          <PropertyCard
                            key={p.id}
                            property={p}
                            locationGroupName={section.locationName}
                            links={linksForProperty}
                            nowIso={nowIso}
                            hostDisplayName={hostDisplayName}
                            guestLinkBaseUrl={guestLinkBaseUrl}
                            linksPanel={
                              openLinksPanel?.propertyId === p.id
                                ? openLinksPanel.panel
                                : null
                            }
                            onLinksPanelChange={(next) => {
                              setOpenLinksPanel((prev) => {
                                if (next === null) {
                                  if (prev?.propertyId === p.id) return null;
                                  return prev;
                                }
                                return { propertyId: p.id, panel: next };
                              });
                            }}
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <EmptyLocationPlaceholder locationName={section.locationName} />
                  )}
                </div>
              ))}
            </div>

            <div className="hidden min-h-0 md:flex md:gap-8">
              <aside className="sticky top-6 w-[220px] shrink-0 self-start md:max-h-[min(36rem,calc(100dvh-6rem))] md:space-y-1 md:overflow-y-auto md:pr-1">
                {visibleSections.map((s) => {
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
                        {s.properties.length}{' '}
                        {s.properties.length === 1 ? 'property' : 'properties'}
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
                        {desktopSelectedSection.properties.map((p) => {
                          const linksForProperty = (
                            guestLinksError ? [] : guestLinks
                          ).filter((l) => l.property_id === p.id);
                          return (
                            <PropertyCard
                              key={p.id}
                              property={p}
                              locationGroupName={desktopSelectedSection.locationName}
                              links={linksForProperty}
                              nowIso={nowIso}
                              hostDisplayName={hostDisplayName}
                              guestLinkBaseUrl={guestLinkBaseUrl}
                              linksPanel={
                                openLinksPanel?.propertyId === p.id
                                  ? openLinksPanel.panel
                                  : null
                              }
                              onLinksPanelChange={(next) => {
                                setOpenLinksPanel((prev) => {
                                  if (next === null) {
                                    if (prev?.propertyId === p.id) return null;
                                    return prev;
                                  }
                                  return { propertyId: p.id, panel: next };
                                });
                              }}
                            />
                          );
                        })}
                      </div>
                    ) : (
                      <EmptyLocationPlaceholder
                        locationName={desktopSelectedSection.locationName}
                      />
                    )}
                  </>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">Select a location.</p>
                )}
              </div>
            </div>
          </div>
        ) : hasAnyLiveProperty ? (
          <div className="glass rounded-[20px] p-6 text-center md:p-8">
            <h2 className="text-base font-semibold dark:text-slate-100">No live properties in selection</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              None of the locations you selected have live properties yet. Choose other locations in the
              filter, or add or publish a property from{' '}
              <Link
                href="/dashboard/manage"
                className="font-semibold text-brand underline-offset-2 hover:underline"
              >
                Property management
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className="glass rounded-[20px] p-6 text-center md:p-8">
            <h2 className="text-base font-semibold dark:text-slate-100">No live properties yet</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Create a property or open Property management to set drafts live and show them here.
            </p>
            <Link
              href="/properties/new"
              className="mt-5 inline-flex items-center justify-center rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-90"
            >
              + Add your first property
            </Link>
          </div>
        )}
        {guestLinksError ? (
          <p className="mt-3 text-xs text-amber-700 dark:text-amber-500">
            Guest links are temporarily unavailable. Run Phase 2 migration (`supabase db
            push`) to enable link generation.
          </p>
        ) : null}
      </section>
    </>
  );
}
