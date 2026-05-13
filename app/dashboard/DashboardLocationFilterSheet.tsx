'use client';

import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import PressButton from '@/app/_components/PressButton';

type LocationOption = { id: string; name: string };

export default function DashboardLocationFilterSheet({
  filtersOpen,
  closeFilter,
  storageReady,
  filteredLocationOptions,
  selectedSet,
  toggleLocation,
  selectAll,
  selectNone,
  locationQuery,
  setLocationQuery,
  hasLiveByLocation,
}: {
  filtersOpen: boolean;
  closeFilter: () => void;
  storageReady: boolean;
  filteredLocationOptions: LocationOption[];
  selectedSet: Set<string>;
  toggleLocation: (id: string, checked: boolean) => void;
  selectAll: () => void;
  selectNone: () => void;
  locationQuery: string;
  setLocationQuery: (q: string) => void;
  hasLiveByLocation: Map<string, boolean>;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {filtersOpen && (
        <div className="fixed inset-0 z-40 flex flex-col justify-end">
          <motion.div
            key="filter-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="absolute inset-0 bg-black/55 backdrop-blur-sm"
            onClick={closeFilter}
          />
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
            <div className="mx-auto mb-4 h-1 w-10 shrink-0 rounded-full bg-white/30" />

            <div className="flex shrink-0 items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-white">Filter locations</h2>
              <PressButton
                type="button"
                onClick={closeFilter}
                className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white/80"
              >
                Close
              </PressButton>
            </div>

            <input
              type="search"
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
              placeholder="Search locations..."
              className="mt-4 shrink-0 w-full rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white placeholder-white/40 outline-none focus:border-brand/60 focus:bg-white/15"
            />

            <div className="mt-3 flex shrink-0 items-center gap-3">
              <PressButton
                type="button"
                disabled={!storageReady}
                onClick={selectAll}
                className="text-xs font-semibold text-brand disabled:opacity-50"
              >
                Select all
              </PressButton>
              <span className="text-xs text-white/20" aria-hidden>
                |
              </span>
              <PressButton
                type="button"
                disabled={!storageReady}
                onClick={selectNone}
                className="text-xs font-semibold text-white/50 disabled:opacity-50"
              >
                Clear
              </PressButton>
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
                    <span
                      className={
                        hasLiveByLocation.get(loc.id) === true ? 'text-white' : 'text-white/40'
                      }
                    >
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
  );
}
