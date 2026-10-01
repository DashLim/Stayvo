'use client';

import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import PressButton from '@/app/_components/PressButton';
import { stayvoBtnGhostClass } from '@/lib/stayvo-ui-classes';

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
            className="absolute inset-0 bg-black/50"
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
            className="relative flex flex-col rounded-t-lg border border-border bg-card px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-4 text-foreground shadow-lg"
            style={{ height: '92dvh' }}
          >
            <div className="mx-auto mb-4 h-1 w-10 shrink-0 rounded-full bg-muted" />

            <div className="flex shrink-0 items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-foreground">Filter locations</h2>
              <PressButton
                type="button"
                onClick={closeFilter}
                className="rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
              >
                Close
              </PressButton>
            </div>

            <input
              type="search"
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
              placeholder="Search locations..."
              className="mt-4 h-10 w-full shrink-0 rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />

            <div className="mt-3 flex shrink-0 items-center gap-3">
              <PressButton
                type="button"
                disabled={!storageReady}
                onClick={selectAll}
                className={`${stayvoBtnGhostClass} h-8 px-2 text-xs disabled:opacity-50`}
              >
                Select all
              </PressButton>
              <span className="text-xs text-muted-foreground" aria-hidden>
                |
              </span>
              <PressButton
                type="button"
                disabled={!storageReady}
                onClick={selectNone}
                className={`${stayvoBtnGhostClass} h-8 px-2 text-xs text-muted-foreground disabled:opacity-50`}
              >
                Clear
              </PressButton>
            </div>

            <div className="mt-4 flex-1 space-y-2 overflow-y-auto">
              {filteredLocationOptions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No matching locations.</p>
              ) : (
                filteredLocationOptions.map((loc) => (
                  <label
                    key={loc.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-foreground"
                  >
                    <input
                      type="checkbox"
                      checked={storageReady && selectedSet.has(loc.id)}
                      disabled={!storageReady || hasLiveByLocation.get(loc.id) !== true}
                      onChange={(e) => toggleLocation(loc.id, e.target.checked)}
                      className="h-4 w-4 rounded accent-primary disabled:opacity-40"
                    />
                    <span
                      className={
                        hasLiveByLocation.get(loc.id) === true
                          ? 'text-foreground'
                          : 'text-muted-foreground'
                      }
                    >
                      {loc.name}
                    </span>
                    {hasLiveByLocation.get(loc.id) === true ? null : (
                      <span className="ml-auto text-[10px] text-muted-foreground">
                        No live property
                      </span>
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
