'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import PropertyCard from '@/app/dashboard/PropertyCard';

const DashboardLocationFilterSheet = dynamic(
  () => import('@/app/dashboard/DashboardLocationFilterSheet'),
  { ssr: false }
);

const STORAGE_KEY_PREFIX = 'stayvo.dashboard.selectedLocationIds';

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
    is_live: boolean;
  }>;
};

type LocationOption = { id: string; name: string };

export default function DashboardClient({
  userId,
  nowIso,
  sections,
  locationOptions,
  guestLinks,
  guestLinksError,
  hasAnyProperty,
  hostDisplayName,
  guestLinkBaseUrl,
}: {
  userId: string;
  nowIso: string;
  sections: Section[];
  locationOptions: LocationOption[];
  guestLinks: GuestLinkItem[];
  guestLinksError: boolean;
  /** True if user has at least one property (live or draft). */
  hasAnyProperty: boolean;
  /** Profile host display name — first segment of generated guest portal URLs. */
  hostDisplayName: string | null;
  /** Public origin for shared guest links (e.g. https://stayvo.io). Passed from server so it matches Vercel env at runtime. */
  guestLinkBaseUrl: string;
}) {
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

  useEffect(() => {
    const knownLocationIds = new Set(optionIds);
    if (optionIds.length === 0) {
      setSelectedIds([]);
      return;
    }

    try {
      const raw = localStorage.getItem(storageKey(userId));
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed) && parsed.every((x) => typeof x === 'string')) {
          const valid = (parsed as string[]).filter((id) => knownLocationIds.has(id));
          setSelectedIds(valid);
          return;
        }
      }
    } catch {
      /* ignore */
    }

    // New / no saved preference: all locations on (not only those with live properties).
    setSelectedIds([...optionIds]);
  }, [userId, optionIdsKey, optionIds]);

  useEffect(() => {
    if (selectedIds === null) return;
    try {
      localStorage.setItem(storageKey(userId), JSON.stringify(selectedIds));
    } catch {
      /* ignore */
    }
  }, [userId, selectedIds]);

  const effectiveIds = selectedIds ?? optionIds;
  const selectedSet = useMemo(() => new Set(effectiveIds), [effectiveIds]);

  const visibleSections = useMemo(() => {
    return sections.filter((s) => selectedSet.has(s.locationId));
  }, [sections, selectedSet]);

  const sectionsWithCards = useMemo(
    () => visibleSections.filter((s) => s.properties.length > 0),
    [visibleSections]
  );
  const anyCards = sectionsWithCards.length > 0;

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

      <section className="mt-6">
        {storageReady &&
        selectedIds !== null &&
        selectedIds.length === 0 &&
        locationOptions.length > 0 ? (
          <div className="glass rounded-[20px] p-6 text-center">
            <h2 className="text-base font-semibold dark:text-slate-100">No locations selected</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Choose one or more locations above to see properties here.
            </p>
          </div>
        ) : anyCards ? (
          <div className="flex flex-col gap-8">
            {sectionsWithCards.map((section) => (
              <div key={section.locationId}>
                <div className="mb-3 flex items-center gap-3">
                  <div className="h-px flex-1 bg-amber-200/60 dark:bg-amber-900/40" />
                  <h2 className="shrink-0 text-xs font-semibold uppercase tracking-widest text-amber-800/70 dark:text-amber-500/70">
                    {section.locationName}
                  </h2>
                  <div className="h-px flex-1 bg-amber-200/60 dark:bg-amber-900/40" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {section.properties.map((p) => {
                    const linksForProperty = (
                      guestLinksError ? [] : guestLinks
                    ).filter((l) => l.property_id === p.id);
                    return (
                      <PropertyCard
                        key={p.id}
                        property={p}
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
              </div>
            ))}
          </div>
        ) : hasAnyProperty ? (
          <div className="glass rounded-[20px] p-6 text-center">
            <h2 className="text-base font-semibold dark:text-slate-100">No live properties</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              None of the selected locations have published properties. Try selecting other
              locations, or publish a draft from{' '}
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
          <div className="glass rounded-[20px] p-6 text-center">
            <h2 className="text-base font-semibold dark:text-slate-100">No properties yet</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Create your first property profile to generate a guest portal link.
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
