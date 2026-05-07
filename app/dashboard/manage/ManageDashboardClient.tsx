'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  closestCenter,
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
import { deleteProperty } from '@/app/actions/properties';
import {
  createLocation,
  deleteLocation,
  reorderLocationsByIds,
  reorderPropertiesInLocationByIds,
  setPropertyLiveStatus,
  setPropertyLocation,
} from '@/app/actions/locations';

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
  return (
    <button
      type="button"
      {...attributes}
      {...listeners}
      className={`touch-none select-none rounded-full glass p-2 text-slate-400 transition hover:text-brand ${trelloPressFx}`}
      aria-label="Drag to reorder"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
        <path
          d="M9 4v16m0 0-3-3m3 3 3-3M15 20V4m0 0-3 3m3-3 3 3"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

function SortablePropertyRow({
  p,
  flatLocations,
  pending,
  editMode,
  onMoveProperty,
  onToggleLive,
  onDeleteProperty,
}: {
  p: PropRow;
  flatLocations: LocRow[];
  pending: boolean;
  editMode: boolean;
  onMoveProperty: (id: string, locId: string) => void;
  onToggleLive: (id: string, live: boolean) => void;
  onDeleteProperty: (id: string, name: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: p.id, disabled: !editMode || pending });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="rounded-xl bg-white/40 py-3 first:pt-2"
    >
      {/* Top row: drag handle + names + Edit link (hidden in edit mode) / delete (in edit mode) */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <DragHandle listeners={listeners} attributes={attributes} hidden={!editMode} />
          <div className="min-w-0">
            <p className="font-semibold text-slate-900">
              {(p.internal_name ?? '').trim() || p.property_name || 'Untitled'}
            </p>
            {!editMode ? (
              <p className="truncate text-xs text-slate-500">
                {p.property_name || 'Untitled'}
              </p>
            ) : null}
          </div>
        </div>
        {!editMode ? (
          <Link
            href={`/properties/${p.id}/edit?returnTo=${encodeURIComponent('/dashboard/manage')}`}
            prefetch={false}
            className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white/70 text-slate-600 backdrop-blur-sm transition hover:text-slate-900 ${trelloPressFx}`}
            title="Edit property"
            aria-label="Edit property"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden>
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
          </Link>
        ) : (
          <div className="flex shrink-0 items-center gap-2">
            {/* iOS-style toggle switch */}
            <button
              type="button"
              disabled={pending}
              onClick={() => onToggleLive(p.id, !p.is_live)}
              className={`relative inline-flex h-7 w-[3.25rem] shrink-0 items-center rounded-full transition-colors duration-200 disabled:opacity-50 ${p.is_live ? 'bg-brand' : 'bg-slate-300'} ${trelloPressFx}`}
              aria-label={p.is_live ? 'Set to draft' : 'Set to live'}
              title={p.is_live ? 'Live — tap to draft' : 'Draft — tap to go live'}
            >
              <span className={`inline-block h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200 ${p.is_live ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
            <span className="min-w-[2rem] text-xs font-semibold text-slate-600">
              {p.is_live ? 'Live' : 'Draft'}
            </span>
            <button
              type="button"
              disabled={pending}
              onClick={() => onDeleteProperty(p.id, p.property_name || 'Untitled')}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-full border border-rose-200 bg-rose-50/70 text-slate-500 disabled:opacity-50 ${trelloPressFx}`}
              aria-label="Delete property"
              title="Delete property"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
                <path
                  d="M9 3.75h6m-7.5 3h9l-.67 10.05A2.25 2.25 0 0 1 13.58 19h-3.16a2.25 2.25 0 0 1-2.25-2.2L7.5 6.75Zm2.75 3.5v5.5m3.5-5.5v5.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
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
            className="w-full rounded-full border border-white/50 bg-white/60 px-4 py-1.5 text-xs text-slate-700 backdrop-blur-sm outline-none focus:border-brand/40 focus:ring-2 focus:ring-brand/20 disabled:opacity-50"
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

function SortableLocationCard({
  group,
  flatLocations,
  pending,
  editMode,
  onMoveProperty,
  onToggleLive,
  onDeleteLocation,
  onDeleteProperty,
  onPropertyDragEnd,
}: {
  group: Group;
  flatLocations: LocRow[];
  pending: boolean;
  editMode: boolean;
  onMoveProperty: (id: string, locId: string) => void;
  onToggleLive: (id: string, live: boolean) => void;
  onDeleteLocation: (id: string, name: string, count: number) => void;
  onDeleteProperty: (id: string, name: string) => void;
  onPropertyDragEnd: (locationId: string, event: DragEndEvent) => void;
}) {
  const { loc, properties } = { loc: group.location, properties: group.properties };
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: loc.id, disabled: !editMode || pending });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : 1,
    zIndex: isDragging ? 20 : undefined,
  };

  const propertySensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } })
  );

  return (
    <section
      ref={setNodeRef}
      style={style}
      className="glass rounded-[20px] p-4"
    >
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/50 pb-3">
        <div className="flex items-center gap-2">
          <DragHandle listeners={listeners} attributes={attributes} hidden={!editMode} />
          <div>
            <h2 className="text-lg font-semibold text-brand">{loc.name}</h2>
            <p className="text-xs text-slate-500">
              {properties.length} propert{properties.length === 1 ? 'y' : 'ies'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!editMode ? (
            <Link
              href={`/properties/new?locationId=${encodeURIComponent(loc.id)}&returnTo=${encodeURIComponent('/dashboard/manage')}`}
              prefetch={false}
              className={`inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand text-sm font-bold text-white shadow-sm transition hover:opacity-90 ${trelloPressFx}`}
              aria-label={`Add property under ${loc.name}`}
              title={`Add property under ${loc.name}`}
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden>
                <path
                  d="M10 5v10M5 10h10"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </Link>
          ) : null}
          {editMode ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => onDeleteLocation(loc.id, loc.name, properties.length)}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-full border border-rose-200 bg-rose-50/70 text-slate-500 disabled:opacity-50 ${trelloPressFx}`}
              aria-label="Delete location"
              title={
                properties.length > 0
                  ? 'Delete this location and all its properties'
                  : 'Delete this empty location'
              }
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
                <path
                  d="M9 3.75h6m-7.5 3h9l-.67 10.05A2.25 2.25 0 0 1 13.58 19h-3.16a2.25 2.25 0 0 1-2.25-2.2L7.5 6.75Zm2.75 3.5v5.5m3.5-5.5v5.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          ) : null}
        </div>
      </div>

      {properties.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">No properties in this location yet.</p>
      ) : (
        <DndContext
          sensors={propertySensors}
          collisionDetection={closestCenter}
          onDragEnd={(event) => {
            if (!editMode) return;
            onPropertyDragEnd(loc.id, event);
          }}
        >
          <SortableContext items={properties.map((p) => p.id)} strategy={verticalListSortingStrategy}>
            <ul className="mt-3 divide-y divide-white/40">
              {properties.map((p) => (
                <SortablePropertyRow
                  key={p.id}
                  p={p}
                  flatLocations={flatLocations}
                  pending={pending}
                  editMode={editMode}
                  onMoveProperty={onMoveProperty}
                  onToggleLive={onToggleLive}
                  onDeleteProperty={onDeleteProperty}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </section>
  );
}

export default function ManageDashboardClient({ locationGroups }: { locationGroups: Group[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState(locationGroups);
  const [activeLocationId, setActiveLocationId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [addLocOpen, setAddLocOpen] = useState(false);
  const [newLocName, setNewLocName] = useState('');

  useEffect(() => {
    setGroups(locationGroups);
  }, [locationGroups]);

  useEffect(() => {
    function onToggleEdit() {
      setEditMode((v) => !v);
    }
    function onAddLocation() {
      void onCreateLocation();
    }
    window.addEventListener('stayvo:manage-toggle-edit', onToggleEdit);
    window.addEventListener('stayvo:manage-add-location', onAddLocation);
    return () => {
      window.removeEventListener('stayvo:manage-toggle-edit', onToggleEdit);
      window.removeEventListener('stayvo:manage-add-location', onAddLocation);
    };
  }, []);

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

  const locationSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } })
  );

  function onLocationDragStart(event: DragStartEvent) {
    if (!editMode) return;
    setActiveLocationId(event.active.id as string);
  }

  async function onLocationDragEnd(event: DragEndEvent) {
    setActiveLocationId(null);
    if (!editMode) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = groups.findIndex((g) => g.location.id === active.id);
    const newIdx = groups.findIndex((g) => g.location.id === over.id);
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
    const group = groups.find((g) => g.location.id === locationId);
    if (!group) return;
    const oldIdx = group.properties.findIndex((p) => p.id === active.id);
    const newIdx = group.properties.findIndex((p) => p.id === over.id);
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

  function onCreateLocation() {
    setNewLocName('');
    setAddLocOpen(true);
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
    setError(null);
    const res = await deleteProperty(propertyId);
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
    const res = await deleteLocation(locationId);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    refresh();
  }

  const activeGroup = activeLocationId ? groups.find((g) => g.location.id === activeLocationId) : null;

  return (
    <div className="mt-6 space-y-6">
      {/* Edit mode banner */}
      {editMode ? (
        <div className="flex items-center gap-2 rounded-full border border-amber-300/60 bg-amber-50/70 px-4 py-2 text-xs font-semibold text-amber-800 backdrop-blur-sm">
          <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 shrink-0" fill="currentColor" aria-hidden>
            <path d="M13.586 3.586a2 2 0 1 1 2.828 2.828l-.793.793-2.828-2.828.793-.793ZM11.379 5.793 3 14.172V17h2.828l8.38-8.379-2.83-2.828Z" />
          </svg>
          Editing — drag to reorder, toggle live/draft, or delete
        </div>
      ) : null}

      {/* Add new location modal */}
      {addLocOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button
            type="button"
            className={`absolute inset-0 bg-black/50 backdrop-blur-sm ${trelloPressFx}`}
            aria-label="Cancel"
            onClick={() => setAddLocOpen(false)}
          />
          <div className="glass relative w-[calc(100%-2rem)] max-w-sm rounded-[20px] p-5">
            <h2 className="text-base font-semibold text-slate-900">Add new location</h2>
            <input
              autoFocus
              type="text"
              value={newLocName}
              onChange={(e) => setNewLocName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void submitNewLocation(); }}
              placeholder="Location name"
              className="mt-3 w-full rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm outline-none ring-brand/30 focus:ring-2"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAddLocOpen(false)}
                className={`rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 ${trelloPressFx}`}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!newLocName.trim()}
                onClick={() => void submitNewLocation()}
                className={`rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white shadow-md disabled:opacity-50 hover:opacity-90 ${trelloPressFx}`}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </p>
      ) : null}

      <DndContext
        sensors={locationSensors}
        collisionDetection={closestCenter}
        onDragStart={onLocationDragStart}
        onDragEnd={(e) => void onLocationDragEnd(e)}
      >
        <SortableContext items={groups.map((g) => g.location.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-6">
            {groups.map((group) => (
              <SortableLocationCard
                key={group.location.id}
                group={group}
                flatLocations={flatLocations}
                pending={pending}
                editMode={editMode}
                onMoveProperty={onMoveProperty}
                onToggleLive={onToggleLive}
                onDeleteLocation={onDeleteLocation}
                onDeleteProperty={onDeleteProperty}
                onPropertyDragEnd={onPropertyDragEnd}
              />
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeGroup && editMode ? (
            <div className="glass rounded-[20px] p-4 shadow-2xl ring-1 ring-brand/30">
              <p className="font-semibold text-slate-900">{activeGroup.location.name}</p>
              <p className="text-xs text-slate-500">
                {activeGroup.properties.length} propert
                {activeGroup.properties.length === 1 ? 'y' : 'ies'}
              </p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
