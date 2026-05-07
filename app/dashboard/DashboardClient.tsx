'use client';

import Link from 'next/link';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import PropertyCard from '@/app/dashboard/PropertyCard';

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
}: {
  userId: string;
  nowIso: string;
  sections: Section[];
  locationOptions: LocationOption[];
  guestLinks: GuestLinkItem[];
  guestLinksError: boolean;
  /** True if user has at least one property (live or draft). */
  hasAnyProperty: boolean;
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
    const validOptionIds = new Set(selectableOptionIds);
    if (optionIds.length === 0) {
      setSelectedIds([]);
      return;
    }

    try {
      const raw = localStorage.getItem(storageKey(userId));
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed) && parsed.every((x) => typeof x === 'string')) {
          const valid = (parsed as string[]).filter((id) => validOptionIds.has(id));
          setSelectedIds(valid);
          return;
        }
      }
    } catch {
      /* ignore */
    }

    setSelectedIds(selectableOptionIds);
  }, [userId, optionIdsKey, selectableOptionIds]);

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
    setSelectedIds([...selectableOptionIds]);
  }

  function selectNone() {
    setSelectedIds([]);
  }

  const storageReady = selectedIds !== null;
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [locationQuery, setLocationQuery] = useState('');
  const filteredLocationOptions = useMemo(() => {
    const q = locationQuery.trim().toLowerCase();
    if (!q) return locationOptions;
    return locationOptions.filter((loc) => loc.name.toLowerCase().includes(q));
  }, [locationOptions, locationQuery]);

  useEffect(() => { setMounted(true); }, []);

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
      {mounted
        ? createPortal(
            <AnimatePresence>
              {filtersOpen && (
                <div className="fixed inset-0 z-40 flex flex-col justify-end">
                  {/* Backdrop */}
                  <motion.div
                    key="filter-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    className="absolute inset-0 bg-black/55 backdrop-blur-sm"
                    onClick={closeFilter}
                  />
                  {/* Bottom sheet */}
                  <motion.aside
                    key="filter-sheet"
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                    drag="y"
                    dragConstraints={{ top: 0 }}
                    dragElastic={{ top: 0.05, bottom: 0.4 }}
                    onDragEnd={(_, info) => {
                      if (info.offset.y > 100 || info.velocity.y > 400) closeFilter();
                    }}
                    className="glass-dark relative flex flex-col rounded-t-[28px] px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-4"
                    style={{ height: '92dvh' }}
                  >
                    {/* Drag handle */}
                    <div className="mx-auto mb-4 h-1 w-10 shrink-0 rounded-full bg-white/30" />

                    <div className="flex shrink-0 items-center justify-between gap-3">
                      <h2 className="text-base font-semibold text-white">Filter locations</h2>
                      <button
                        type="button"
                        onClick={closeFilter}
                        className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white/80"
                      >
                        Close
                      </button>
                    </div>

                    <input
                      type="search"
                      value={locationQuery}
                      onChange={(e) => setLocationQuery(e.target.value)}
                      placeholder="Search locations..."
                      className="mt-4 shrink-0 w-full rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white placeholder-white/40 outline-none focus:border-brand/60 focus:bg-white/15"
                    />

                    <div className="mt-3 flex shrink-0 items-center gap-3">
                      <button
                        type="button"
                        disabled={!storageReady}
                        onClick={selectAll}
                        className="text-xs font-semibold text-brand disabled:opacity-50"
                      >
                        Select all
                      </button>
                      <span className="text-xs text-white/20" aria-hidden>|</span>
                      <button
                        type="button"
                        disabled={!storageReady}
                        onClick={selectNone}
                        className="text-xs font-semibold text-white/50 disabled:opacity-50"
                      >
                        Clear
                      </button>
                    </div>

                    <div className="mt-4 flex-1 space-y-2 overflow-y-auto">
                      {filteredLocationOptions.length === 0 ? (
                        <p className="text-sm text-white/50">No matching locations.</p>
                      ) : (
                        filteredLocationOptions.map((loc) => (
                          <label
                            key={loc.id}
                            className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white"
                          >
                            <input
                              type="checkbox"
                              checked={storageReady && selectedSet.has(loc.id)}
                              disabled={!storageReady || hasLiveByLocation.get(loc.id) !== true}
                              onChange={(e) => toggleLocation(loc.id, e.target.checked)}
                              className="h-4 w-4 rounded accent-brand disabled:opacity-40"
                            />
                            <span className={hasLiveByLocation.get(loc.id) === true ? 'text-white' : 'text-white/40'}>
                              {loc.name}
                            </span>
                            {hasLiveByLocation.get(loc.id) === true ? null : (
                              <span className="ml-auto text-[10px] text-white/30">No live property</span>
                            )}
                          </label>
                        ))
                      )}
                    </div>
                  </motion.aside>
                </div>
              )}
            </AnimatePresence>,
            document.body
          )
        : null}

      <section className="mt-6">
        {storageReady &&
        selectedIds !== null &&
        selectedIds.length === 0 &&
        locationOptions.length > 0 ? (
          <div className="glass rounded-[20px] p-6 text-center">
            <h2 className="text-base font-semibold">No locations selected</h2>
            <p className="mt-2 text-sm text-slate-600">
              Choose one or more locations above to see properties here.
            </p>
          </div>
        ) : anyCards ? (
          <div className="flex flex-col gap-8">
            {sectionsWithCards.map((section) => (
              <div key={section.locationId}>
                <div className="mb-3 flex items-center gap-3">
                  <div className="h-px flex-1 bg-amber-200/60" />
                  <h2 className="shrink-0 text-xs font-semibold uppercase tracking-widest text-amber-800/70">
                    {section.locationName}
                  </h2>
                  <div className="h-px flex-1 bg-amber-200/60" />
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
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : hasAnyProperty ? (
          <div className="glass rounded-[20px] p-6 text-center">
            <h2 className="text-base font-semibold">No live properties</h2>
            <p className="mt-2 text-sm text-slate-600">
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
            <h2 className="text-base font-semibold">No properties yet</h2>
            <p className="mt-2 text-sm text-slate-600">
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
          <p className="mt-3 text-xs text-amber-700">
            Guest links are temporarily unavailable. Run Phase 2 migration (`supabase db
            push`) to enable link generation.
          </p>
        ) : null}
      </section>
    </>
  );
}
