'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { CSSProperties, Dispatch, SetStateAction } from 'react';
import { useEffect, useState, useTransition } from 'react';
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cloneProperty, deleteProperty } from '@/app/actions/properties';
import { capitalizeWordStarts } from '@/lib/capitalize-word-starts';
import {
  createLocation,
  deleteLocation,
  reorderLocationsByIds,
  reorderPropertiesInLocationByIds,
  setPropertyLiveStatus,
  setPropertyLocation,
} from '@/app/actions/locations';
import PressButton from '@/app/_components/PressButton';
import { useHostDashboardLimits } from '@/app/dashboard/_components/HostTierProvider';
import { FREE_TIER_MAX_PROPERTIES } from '@/lib/host-tier';

type LocRow = { id: string; name: string };
type PropRow = {
  id: string;
  property_name: string;
  internal_name: string | null;
  location_id: string;
  sort_order: number;
  is_live: boolean;
};
type Group = { location: LocRow; properties: PropRow[] };

const trelloPressFx =
  'transition duration-150 active:scale-[0.97] active:translate-y-[1px] active:brightness-95';

/**
 * PointerSensor listens to unified pointer events and often wins over TouchSensor on mobile,
 * so touch drags never activate. Use mouse-only + touch-only sensors instead (dnd-kit guidance).
 */
function useManageDragSensors() {
  return useSensors(
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 12,
      },
    }),
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );
}

function DragHandle({
  listeners,
  attributes,
  hidden,
}: {
  listeners?: object;
  attributes?: object;
  hidden?: boolean;
}) {
  if (hidden) return null;
  /* Native button — avoids Framer Motion + global :active transform fighting @dnd-kit */
  return (
    <button
      type="button"
      {...attributes}
      {...listeners}
      className={`touch-none select-none rounded-full glass p-2 text-slate-500 transition hover:text-brand [-webkit-touch-callout:none] dark:text-slate-300 dark:hover:text-brand ${trelloPressFx}`}
      aria-label="Drag to reorder"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
        <circle cx="12" cy="6" r="2" />
        <circle cx="12" cy="12" r="2" />
        <circle cx="12" cy="18" r="2" />
      </svg>
    </button>
  );
}

function SortablePropertyRow({
  p,
  flatLocations,
  pending,
  editMode,
  openMenuPropertyId,
  setOpenMenuPropertyId,
  onMoveProperty,
  onToggleLive,
  onDeleteProperty,
  onCloneProperty,
}: {
  p: PropRow;
  flatLocations: LocRow[];
  pending: boolean;
  editMode: boolean;
  openMenuPropertyId: string | null;
  setOpenMenuPropertyId: Dispatch<SetStateAction<string | null>>;
  onMoveProperty: (id: string, locId: string) => void;
  onToggleLive: (id: string, live: boolean) => void;
  onDeleteProperty: (id: string, name: string) => void;
  onCloneProperty: (id: string, name: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: p.id, disabled: !editMode || pending });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  const menuOpen = openMenuPropertyId === p.id;

  useEffect(() => {
    if (!menuOpen) return;
    function handleOutsideClick() {
      setOpenMenuPropertyId((current) => (current === p.id ? null : current));
    }
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, [menuOpen, p.id, setOpenMenuPropertyId]);

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="relative border-b border-white/15 px-4 py-3 first:pt-3 last:border-b-0 dark:border-white/10"
    >
      {/* Top row: drag handle + names + Edit link (hidden in edit mode) / delete (in edit mode) */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <DragHandle listeners={listeners} attributes={attributes} hidden={!editMode} />
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 dark:text-slate-200">
              {(p.internal_name ?? '').trim() || p.property_name || 'Untitled'}
            </p>
            {!editMode ? (
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                {p.property_name || 'Untitled'}
              </p>
            ) : null}
          </div>
        </div>
        {!editMode ? (
          <div className="flex shrink-0 items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <Link
              href={`/properties/${p.id}/edit?returnTo=${encodeURIComponent('/dashboard/manage')}`}
              prefetch={false}
              className={`hidden h-8 items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 text-sm font-semibold text-slate-700 backdrop-blur-sm transition hover:bg-slate-300/90 hover:text-slate-900 dark:border-white/18 dark:bg-white/18 dark:text-slate-900 dark:hover:bg-white/14 dark:hover:text-slate-950 md:inline-flex ${trelloPressFx}`}
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0" fill="none" aria-hidden>
                <path
                  d="M10 3H5.5A2.5 2.5 0 0 0 3 5.5v9A2.5 2.5 0 0 0 5.5 17h9A2.5 2.5 0 0 0 17 14.5V10"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="m12.5 3.5 2.5 2.5m-2.5-2.5-4 4-.5 2.5 2.5-.5 4-4a1 1 0 0 0 0-1.4l-1.1-1.1a1 1 0 0 0-1.4 0Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Edit
            </Link>
            <div className="relative md:hidden">
            <PressButton
              type="button"
              onClick={() =>
                setOpenMenuPropertyId((current) => (current === p.id ? null : p.id))
              }
              className={`inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white/70 text-slate-700 backdrop-blur-sm transition hover:bg-slate-300/90 hover:text-slate-900 dark:border-white/18 dark:bg-white/18 dark:text-slate-900 dark:hover:bg-white/14 dark:hover:text-slate-950 ${trelloPressFx}`}
              title="Property actions"
              aria-label="Property actions"
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden>
                <path d="M4.5 10a1.5 1.5 0 1 0 0-.001A1.5 1.5 0 0 0 4.5 10Zm5.5 0a1.5 1.5 0 1 0 0-.001A1.5 1.5 0 0 0 10 10Zm5.5 0a1.5 1.5 0 1 0 0-.001A1.5 1.5 0 0 0 15.5 10Z" />
              </svg>
            </PressButton>
            {menuOpen ? (
              <div className="absolute bottom-full right-0 z-50 mb-2 w-36 rounded-xl border border-slate-200 bg-white p-1 shadow-lg dark:border-white/10 dark:bg-neutral-900">
                <Link
                  href={`/properties/${p.id}/edit?returnTo=${encodeURIComponent('/dashboard/manage')}`}
                  prefetch={false}
                  className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-300 dark:text-slate-200 dark:hover:bg-slate-700/95 dark:hover:text-white"
                  onClick={() => setOpenMenuPropertyId(null)}
                >
                  Edit
                </Link>
                <button
                  type="button"
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-300 dark:text-slate-200 dark:hover:bg-slate-700/95 dark:hover:text-white"
                  onClick={() => {
                    setOpenMenuPropertyId(null);
                    onCloneProperty(p.id, p.property_name || 'Untitled');
                  }}
                >
                  Clone
                </button>
                <button
                  type="button"
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-100 dark:text-rose-400 dark:hover:bg-rose-950/55"
                  onClick={() => {
                    setOpenMenuPropertyId(null);
                    onDeleteProperty(p.id, p.property_name || 'Untitled');
                  }}
                >
                  Delete
                </button>
              </div>
            ) : null}
            </div>
          </div>
        ) : (
          <div className="flex shrink-0 items-center gap-2">
            {/* iOS-style toggle switch */}
            <PressButton
              type="button"
              disabled={pending}
              onClick={() => onToggleLive(p.id, !p.is_live)}
              className={`relative inline-flex h-7 w-[3.25rem] shrink-0 items-center rounded-full transition-colors duration-200 disabled:opacity-50 ${p.is_live ? 'bg-brand' : 'bg-slate-300 dark:bg-slate-600'} ${trelloPressFx}`}
              aria-label={p.is_live ? 'Set to draft' : 'Set to live'}
              title={p.is_live ? 'Live — tap to draft' : 'Draft — tap to go live'}
            >
              <span className={`inline-block h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200 ${p.is_live ? 'translate-x-7' : 'translate-x-1'}`} />
            </PressButton>
            <span className="min-w-[2rem] text-xs font-semibold text-slate-600 dark:text-slate-300">
              {p.is_live ? 'Live' : 'Draft'}
            </span>
            <PressButton
              type="button"
              disabled={pending}
              onClick={() => onDeleteProperty(p.id, p.property_name || 'Untitled')}
              className={`inline-flex h-8 w-8 items-center justify-center gap-2 rounded-full border border-rose-200 bg-rose-50/70 text-slate-500 disabled:opacity-50 md:w-auto md:px-3 ${trelloPressFx}`}
              aria-label="Delete property"
              title="Delete property"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" aria-hidden>
                <path
                  d="M9 3.75h6m-7.5 3h9l-.67 10.05A2.25 2.25 0 0 1 13.58 19h-3.16a2.25 2.25 0 0 1-2.25-2.2L7.5 6.75Zm2.75 3.5v5.5m3.5-5.5v5.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="hidden text-sm font-semibold text-rose-700 dark:text-rose-400 md:inline">
                Delete Property
              </span>
            </PressButton>
          </div>
        )}
      </div>
      {/* Move-to dropdown — only in edit mode, stacked below the name */}
      {editMode ? (
        <div className="mt-2 pl-9">
          <select
            value={p.location_id}
            disabled={pending}
            onChange={(e) => onMoveProperty(p.id, e.target.value)}
            className="w-full rounded-full border border-white/50 bg-white/60 px-4 py-1.5 text-xs font-medium text-slate-800 backdrop-blur-sm outline-none focus:border-brand/40 focus:ring-2 focus:ring-brand/20 disabled:opacity-50 dark:border-white/12 dark:bg-neutral-950/60 dark:text-slate-100 dark:[color-scheme:dark]"
          >
            {flatLocations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}
    </li>
  );
}

type LocationGroupPanelProps = {
  group: Group;
  flatLocations: LocRow[];
  pending: boolean;
  editMode: boolean;
  canAddProperty: boolean;
  openMenuPropertyId: string | null;
  setOpenMenuPropertyId: Dispatch<SetStateAction<string | null>>;
  onMoveProperty: (id: string, locId: string) => void;
  onToggleLive: (id: string, live: boolean) => void;
  onDeleteLocation: (id: string, name: string, count: number) => void;
  onDeleteProperty: (id: string, name: string) => void;
  onCloneProperty: (id: string, name: string) => void;
  onPropertyDragEnd: (locationId: string, event: DragEndEvent) => void;
  sectionRef?: (node: HTMLElement | null) => void;
  sectionStyle?: CSSProperties;
  locationDragListeners?: object;
  locationDragAttributes?: object;
  /** When false (desktop panel), location drag handle is hidden. */
  enableLocationDrag?: boolean;
};

function LocationGroupPanel({
  group,
  flatLocations,
  pending,
  editMode,
  canAddProperty,
  openMenuPropertyId,
  setOpenMenuPropertyId,
  onMoveProperty,
  onToggleLive,
  onDeleteLocation,
  onDeleteProperty,
  onCloneProperty,
  onPropertyDragEnd,
  sectionRef,
  sectionStyle,
  locationDragListeners,
  locationDragAttributes,
  enableLocationDrag = false,
}: LocationGroupPanelProps) {
  const { loc, properties } = { loc: group.location, properties: group.properties };
  const propertySensors = useManageDragSensors();

  return (
    <section
      ref={sectionRef}
      style={sectionStyle}
      className="glass rounded-[20px] border border-slate-200/80 bg-slate-50/65 p-4 dark:border-white/12 dark:bg-neutral-900/60 md:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/50 dark:border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <DragHandle
            listeners={locationDragListeners}
            attributes={locationDragAttributes}
            hidden={!editMode || !enableLocationDrag}
          />
          <div>
            <h2 className="text-lg font-semibold text-brand md:text-xl">{loc.name}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {properties.length} propert{properties.length === 1 ? 'y' : 'ies'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!editMode ? (
            canAddProperty ? (
              <Link
                href={`/properties/new?locationId=${encodeURIComponent(loc.id)}&returnTo=${encodeURIComponent('/dashboard/manage')}`}
                prefetch={false}
                className={`inline-flex h-7 w-7 items-center justify-center gap-2 rounded-full bg-brand text-sm font-bold text-white shadow-sm transition hover:opacity-90 md:h-8 md:w-auto md:px-3 ${trelloPressFx}`}
                aria-label={`Add property under ${loc.name}`}
                title={`Add property under ${loc.name}`}
              >
                <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0" fill="none" aria-hidden>
                  <path
                    d="M10 5v10M5 10h10"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="hidden text-sm font-semibold md:inline">Add Property</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={() =>
                  window.alert(
                    `Free accounts can have up to ${FREE_TIER_MAX_PROPERTIES} properties. Stayvo Pro includes unlimited properties.`
                  )
                }
                className={`inline-flex h-7 w-7 cursor-not-allowed items-center justify-center gap-2 rounded-full bg-brand/45 text-sm font-bold text-white shadow-sm md:h-8 md:w-auto md:px-3 ${trelloPressFx}`}
                aria-label="Property limit reached"
                title="Property limit reached"
              >
                <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0" fill="none" aria-hidden>
                  <path
                    d="M10 5v10M5 10h10"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="hidden text-sm font-semibold md:inline">Add Property</span>
              </button>
            )
          ) : null}
          {editMode ? (
            <PressButton
              type="button"
              disabled={pending}
              onClick={() => onDeleteLocation(loc.id, loc.name, properties.length)}
              className={`inline-flex h-8 w-8 items-center justify-center gap-2 rounded-full border border-rose-200 bg-rose-50/70 text-slate-500 disabled:opacity-50 md:w-auto md:px-3 ${trelloPressFx}`}
              aria-label="Delete location"
              title={
                properties.length > 0
                  ? 'Delete this location and all its properties'
                  : 'Delete this empty location'
              }
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" aria-hidden>
                <path
                  d="M9 3.75h6m-7.5 3h9l-.67 10.05A2.25 2.25 0 0 1 13.58 19h-3.16a2.25 2.25 0 0 1-2.25-2.2L7.5 6.75Zm2.75 3.5v5.5m3.5-5.5v5.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="hidden text-sm font-semibold text-rose-700 dark:text-rose-400 md:inline">
                Delete Location
              </span>
            </PressButton>
          ) : null}
        </div>
      </div>

      {properties.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">No properties in this location yet.</p>
      ) : (
        <DndContext
          sensors={propertySensors}
          collisionDetection={closestCorners}
          onDragEnd={(event) => {
            if (!editMode) return;
            void onPropertyDragEnd(loc.id, event);
          }}
        >
          <SortableContext
            id={`stayvo-props-${loc.id}`}
            items={properties.map((p) => p.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="mt-3 overflow-visible rounded-2xl border border-slate-200 bg-white/85 divide-y divide-slate-300/45 dark:border-white/10 dark:bg-white/[0.04] dark:divide-white/10">
              {properties.map((p) => (
                <SortablePropertyRow
                  key={p.id}
                  p={p}
                  flatLocations={flatLocations}
                  pending={pending}
                  editMode={editMode}
                  openMenuPropertyId={openMenuPropertyId}
                  setOpenMenuPropertyId={setOpenMenuPropertyId}
                  onMoveProperty={onMoveProperty}
                  onToggleLive={onToggleLive}
                  onDeleteProperty={onDeleteProperty}
                  onCloneProperty={onCloneProperty}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </section>
  );
}

function SortableLocationCard({
  group,
  flatLocations,
  pending,
  editMode,
  canAddProperty,
  openMenuPropertyId,
  setOpenMenuPropertyId,
  onMoveProperty,
  onToggleLive,
  onDeleteLocation,
  onDeleteProperty,
  onCloneProperty,
  onPropertyDragEnd,
}: Omit<
  LocationGroupPanelProps,
  'sectionRef' | 'sectionStyle' | 'locationDragListeners' | 'locationDragAttributes' | 'enableLocationDrag'
>) {
  const loc = group.location;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: loc.id,
    disabled: !editMode || pending,
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : 1,
    zIndex: isDragging ? 20 : undefined,
  };

  return (
    <LocationGroupPanel
      group={group}
      flatLocations={flatLocations}
      pending={pending}
      editMode={editMode}
      canAddProperty={canAddProperty}
      openMenuPropertyId={openMenuPropertyId}
      setOpenMenuPropertyId={setOpenMenuPropertyId}
      onMoveProperty={onMoveProperty}
      onToggleLive={onToggleLive}
      onDeleteLocation={onDeleteLocation}
      onDeleteProperty={onDeleteProperty}
      onCloneProperty={onCloneProperty}
      onPropertyDragEnd={onPropertyDragEnd}
      sectionRef={setNodeRef}
      sectionStyle={style}
      locationDragListeners={listeners}
      locationDragAttributes={attributes}
      enableLocationDrag
    />
  );
}

export default function ManageDashboardClient({ locationGroups }: { locationGroups: Group[] }) {
  const router = useRouter();
  const limits = useHostDashboardLimits();
  const canAddProperty =
    limits.tier === 'pro' || limits.propertyCount < FREE_TIER_MAX_PROPERTIES;
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState(locationGroups);
  const [activeLocationId, setActiveLocationId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [openMenuPropertyId, setOpenMenuPropertyId] = useState<string | null>(null);
  const [desktopLocationId, setDesktopLocationId] = useState<string | null>(null);
  const [addLocOpen, setAddLocOpen] = useState(false);
  const [newLocName, setNewLocName] = useState('');

  useEffect(() => {
    if (groups.length === 0) {
      setDesktopLocationId(null);
      return;
    }
    setDesktopLocationId((prev) => {
      if (prev && groups.some((g) => g.location.id === prev)) return prev;
      return groups[0].location.id;
    });
  }, [groups]);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('stayvo:manage-edit-state', { detail: { active: editMode } })
    );
  }, [editMode]);

  useEffect(() => {
    setGroups(locationGroups);
    setOpenMenuPropertyId(null);
  }, [locationGroups]);

  useEffect(() => {
    if (editMode) setOpenMenuPropertyId(null);
  }, [editMode]);

  useEffect(() => {
    function onToggleEdit() {
      setEditMode((v) => !v);
    }
    function onAddLocation() {
      if (limits.tier !== 'pro') {
        setError('Additional locations are available on Stayvo Pro.');
        return;
      }
      setNewLocName('');
      setAddLocOpen(true);
    }
    window.addEventListener('stayvo:manage-toggle-edit', onToggleEdit);
    window.addEventListener('stayvo:manage-add-location', onAddLocation);
    return () => {
      window.removeEventListener('stayvo:manage-toggle-edit', onToggleEdit);
      window.removeEventListener('stayvo:manage-add-location', onAddLocation);
    };
  }, [limits.tier]);

  useEffect(() => {
    window.dispatchEvent(new Event(addLocOpen ? 'stayvo:add-location-open' : 'stayvo:add-location-close'));
    return () => {
      window.dispatchEvent(new Event('stayvo:add-location-close'));
    };
  }, [addLocOpen]);

  const flatLocations = groups.map((g) => g.location);

  function refresh() {
    startTransition(() => router.refresh());
  }

  const locationSensors = useManageDragSensors();

  function onLocationDragStart(event: DragStartEvent) {
    if (!editMode) return;
    const id = String(event.active.id);
    if (groups.some((g) => g.location.id === id)) {
      setActiveLocationId(id);
    }
  }

  async function onLocationDragEnd(event: DragEndEvent) {
    setActiveLocationId(null);
    if (!editMode) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    const oldIdx = groups.findIndex((g) => g.location.id === activeId);
    const newIdx = groups.findIndex((g) => g.location.id === overId);
    if (oldIdx < 0 || newIdx < 0) return;
    const nextGroups = arrayMove(groups, oldIdx, newIdx);
    setGroups(nextGroups);
    const res = await reorderLocationsByIds(nextGroups.map((g) => g.location.id));
    if (!res.ok) {
      setError(res.error);
      refresh();
      return;
    }
    refresh();
  }

  async function onPropertyDragEnd(locationId: string, event: DragEndEvent) {
    if (!editMode) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    const group = groups.find((g) => g.location.id === locationId);
    if (!group) return;
    const oldIdx = group.properties.findIndex((p) => p.id === activeId);
    const newIdx = group.properties.findIndex((p) => p.id === overId);
    if (oldIdx < 0 || newIdx < 0) return;
    const nextProps = arrayMove(group.properties, oldIdx, newIdx);
    setGroups((prev) => prev.map((g) => (g.location.id === locationId ? { ...g, properties: nextProps } : g)));
    const res = await reorderPropertiesInLocationByIds(locationId, nextProps.map((p) => p.id));
    if (!res.ok) {
      setError(res.error);
      refresh();
      return;
    }
    refresh();
  }

  async function submitNewLocation() {
    const name = newLocName.trim();
    if (!name) return;
    setAddLocOpen(false);
    setError(null);
    const res = await createLocation(name);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    refresh();
  }

  async function onMoveProperty(propertyId: string, newLocationId: string) {
    setError(null);
    const res = await setPropertyLocation(propertyId, newLocationId);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    refresh();
  }

  async function onToggleLive(propertyId: string, nextLive: boolean) {
    setError(null);
    const res = await setPropertyLiveStatus(propertyId, nextLive);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    refresh();
  }

  async function onDeleteProperty(propertyId: string, propertyName: string) {
    const ok = window.confirm(`Delete property "${propertyName}"? This cannot be undone.`);
    if (!ok) return;
    const finalOk = window.confirm(
      `Please confirm again: permanently delete "${propertyName}" and all related guest links/data?`
    );
    if (!finalOk) return;
    setError(null);
    const res = await deleteProperty(propertyId);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    refresh();
  }

  async function onCloneProperty(propertyId: string, propertyName: string) {
    setError(null);
    const ok = window.confirm(`Clone property "${propertyName}"?`);
    if (!ok) return;
    const res = await cloneProperty(propertyId);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    refresh();
  }

  async function onDeleteLocation(locationId: string, locationName: string, count: number) {
    setError(null);
    const label = locationName.trim() || 'this location';
    const message =
      count > 0
        ? `Delete location "${label}"?\n\nThis will permanently delete ALL ${count} propert${count === 1 ? 'y' : 'ies'} (guest links, images, all data). This cannot be undone.\n\nClick OK to delete.`
        : `Delete empty location "${label}"?\n\nThis cannot be undone.`;
    if (!window.confirm(message)) return;
    const finalMessage =
      count > 0
        ? `Please confirm again: permanently delete location "${label}" and all ${count} linked propert${count === 1 ? 'y' : 'ies'}?`
        : `Please confirm again: permanently delete empty location "${label}"?`;
    if (!window.confirm(finalMessage)) return;
    const res = await deleteLocation(locationId);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    refresh();
  }

  const activeGroup = activeLocationId ? groups.find((g) => g.location.id === activeLocationId) : null;
  const desktopSelectedGroup =
    desktopLocationId != null
      ? (groups.find((g) => g.location.id === desktopLocationId) ?? null)
      : null;

  return (
    <div className="mt-6 w-full space-y-6">
      {/* Edit mode banner */}
      {editMode ? (
        <div className="flex items-center gap-2 rounded-full border border-amber-300/60 bg-amber-50/70 px-4 py-2 text-xs font-semibold text-amber-800 backdrop-blur-sm dark:border-amber-700/40 dark:bg-amber-950/50 dark:text-amber-400">
          <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 shrink-0" fill="currentColor" aria-hidden>
            <path d="M13.586 3.586a2 2 0 1 1 2.828 2.828l-.793.793-2.828-2.828.793-.793ZM11.379 5.793 3 14.172V17h2.828l8.38-8.379-2.83-2.828Z" />
          </svg>
          Editing — drag to reorder, toggle live/draft, or delete
        </div>
      ) : null}

      {/* Add new location modal */}
      {addLocOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <PressButton
            type="button"
            className={`absolute inset-0 bg-black/50 backdrop-blur-sm ${trelloPressFx}`}
            aria-label="Cancel"
            onClick={() => setAddLocOpen(false)}
          />
          <div className="glass relative w-[calc(100%-2rem)] max-w-sm rounded-[20px] p-5">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Add new location</h2>
            <input
              autoFocus
              type="text"
              autoCapitalize="words"
              value={newLocName}
              onChange={(e) => setNewLocName(capitalizeWordStarts(e.target.value))}
              onKeyDown={(e) => { if (e.key === 'Enter') void submitNewLocation(); }}
              placeholder="Location name"
              className="mt-3 w-full rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm text-slate-900 outline-none ring-brand/30 focus:ring-2 dark:border-white/20 dark:bg-white/88 dark:text-slate-950 dark:placeholder-slate-500"
            />
            <div className="mt-4 flex justify-end gap-2">
              <PressButton
                type="button"
                onClick={() => setAddLocOpen(false)}
                className={`rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-800 dark:border-white/18 dark:bg-white/18 dark:text-slate-900 dark:hover:bg-white/28 dark:hover:text-slate-950 ${trelloPressFx}`}
              >
                Cancel
              </PressButton>
              <PressButton
                type="button"
                disabled={!newLocName.trim()}
                onClick={() => void submitNewLocation()}
                className={`rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white shadow-md disabled:opacity-50 hover:opacity-90 dark:bg-brand dark:text-white ${trelloPressFx}`}
              >
                Add
              </PressButton>
            </div>
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:border-rose-800/60 dark:bg-rose-950/50 dark:text-rose-400">
          {error}
        </p>
      ) : null}

      <div className={editMode ? '' : 'md:hidden'}>
        <DndContext
          sensors={locationSensors}
          collisionDetection={closestCorners}
          onDragStart={onLocationDragStart}
          onDragEnd={(e) => void onLocationDragEnd(e)}
        >
          <SortableContext
            id="stayvo-locations"
            items={groups.map((g) => g.location.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-6">
              {groups.map((group) => (
                <SortableLocationCard
                  key={group.location.id}
                  group={group}
                  flatLocations={flatLocations}
                  pending={pending}
                  editMode={editMode}
                  canAddProperty={canAddProperty}
                  openMenuPropertyId={openMenuPropertyId}
                  setOpenMenuPropertyId={setOpenMenuPropertyId}
                  onMoveProperty={onMoveProperty}
                  onToggleLive={onToggleLive}
                  onDeleteLocation={onDeleteLocation}
                  onDeleteProperty={onDeleteProperty}
                  onCloneProperty={onCloneProperty}
                  onPropertyDragEnd={onPropertyDragEnd}
                />
              ))}
            </div>
          </SortableContext>

          <DragOverlay>
            {activeGroup && editMode ? (
              <div className="glass rounded-[20px] p-4 shadow-2xl ring-1 ring-brand/30">
                <p className="font-semibold text-slate-900 dark:text-slate-100">{activeGroup.location.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {`${activeGroup.properties.length} propert${activeGroup.properties.length === 1 ? 'y' : 'ies'}`}
                </p>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {!editMode ? (
        <div className="hidden min-h-0 md:flex md:gap-8">
          <aside className="sticky top-6 w-[220px] shrink-0 space-y-1 self-start md:max-h-[min(36rem,calc(100dvh-6rem))] md:overflow-y-auto md:pr-1">
            {groups.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No locations yet.</p>
            ) : (
              groups.map((g) => {
                const selected = g.location.id === desktopLocationId;
                return (
                  <button
                    key={g.location.id}
                    type="button"
                    onClick={() => setDesktopLocationId(g.location.id)}
                    className={`flex w-full flex-col items-start rounded-full px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                      selected
                        ? 'bg-brand font-bold text-amber-950 shadow-sm dark:text-amber-950'
                        : 'text-slate-700 hover:bg-white/60 dark:text-slate-200 dark:hover:bg-white/10'
                    }`}
                  >
                    <span className="w-full truncate">{g.location.name}</span>
                    <span
                      className={`mt-0.5 text-xs font-medium ${
                        selected ? 'text-amber-950/80' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {g.properties.length} propert{g.properties.length === 1 ? 'y' : 'ies'}
                    </span>
                  </button>
                );
              })
            )}
          </aside>
          <div className="min-w-0 flex-1">
            {desktopSelectedGroup ? (
              <LocationGroupPanel
                group={desktopSelectedGroup}
                flatLocations={flatLocations}
                pending={pending}
                editMode={editMode}
                canAddProperty={canAddProperty}
                openMenuPropertyId={openMenuPropertyId}
                setOpenMenuPropertyId={setOpenMenuPropertyId}
                onMoveProperty={onMoveProperty}
                onToggleLive={onToggleLive}
                onDeleteLocation={onDeleteLocation}
                onDeleteProperty={onDeleteProperty}
                onCloneProperty={onCloneProperty}
                onPropertyDragEnd={onPropertyDragEnd}
                enableLocationDrag={false}
              />
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">Select a location.</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
