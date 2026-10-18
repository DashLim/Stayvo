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
import { Copy, GripVertical, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
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
import NoPropertiesEmptyState from '@/app/dashboard/_components/NoPropertiesEmptyState';
import {
  stayvoBtnCompactSecondaryClass,
  stayvoBtnIconPrimaryClass,
  stayvoBtnPrimaryClass,
  stayvoBtnSecondaryClass,
  stayvoHostCalloutDestructiveClass,
  stayvoHostCardClass,
  stayvoHostMenuItemClass,
  stayvoHostMenuItemDestructiveClass,
  stayvoHostMenuPanelClass,
  stayvoHostNavItemActiveClass,
  stayvoHostNavItemClass,
  stayvoHintClass,
  stayvoInputClass,
  stayvoMutedTextClass,
  stayvoSectionTitleClass,
} from '@/lib/stayvo-ui-classes';
import { cn } from '@/lib/utils';

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
      className={`touch-none select-none rounded-md border border-input bg-background p-2 text-muted-foreground shadow-xs transition hover:text-primary [-webkit-touch-callout:none] ${trelloPressFx}`}
      aria-label="Drag to reorder"
    >
      <GripVertical className="h-4 w-4 shrink-0" aria-hidden />
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
      className="relative px-4 py-3"
    >
      {/* Top row: drag handle + names + Edit link (hidden in edit mode) / delete (in edit mode) */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <DragHandle listeners={listeners} attributes={attributes} hidden={!editMode} />
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">
              {(p.internal_name ?? '').trim() || p.property_name || 'Untitled'}
            </p>
            {!editMode ? (
              <p className={`truncate ${stayvoHintClass}`}>{p.property_name || 'Untitled'}</p>
            ) : null}
          </div>
        </div>
        {!editMode ? (
          <div className="flex shrink-0 items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <Link
              href={`/properties/${p.id}/edit?returnTo=${encodeURIComponent('/dashboard/manage')}`}
              prefetch={false}
              className={`${stayvoBtnCompactSecondaryClass} hidden gap-1.5 md:inline-flex ${trelloPressFx}`}
            >
              <Pencil className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Edit
            </Link>
            <div className="relative md:hidden">
            <PressButton
              type="button"
              onClick={() =>
                setOpenMenuPropertyId((current) => (current === p.id ? null : p.id))
              }
              className={`${stayvoBtnCompactSecondaryClass} w-8 px-0 ${trelloPressFx}`}
              title="Property actions"
              aria-label="Property actions"
            >
              <MoreHorizontal className="h-4 w-4 shrink-0" aria-hidden />
            </PressButton>
            {menuOpen ? (
              <div className={`${stayvoHostMenuPanelClass} bottom-full right-0 mb-2 w-40`}>
                <Link
                  href={`/properties/${p.id}/edit?returnTo=${encodeURIComponent('/dashboard/manage')}`}
                  prefetch={false}
                  className={`${stayvoHostMenuItemClass} gap-2`}
                  onClick={() => setOpenMenuPropertyId(null)}
                >
                  <Pencil className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  Edit
                </Link>
                <button
                  type="button"
                  className={`${stayvoHostMenuItemClass} gap-2`}
                  onClick={() => {
                    setOpenMenuPropertyId(null);
                    onCloneProperty(p.id, p.property_name || 'Untitled');
                  }}
                >
                  <Copy className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  Clone
                </button>
                <button
                  type="button"
                  className={`${stayvoHostMenuItemDestructiveClass} gap-2`}
                  onClick={() => {
                    setOpenMenuPropertyId(null);
                    onDeleteProperty(p.id, p.property_name || 'Untitled');
                  }}
                >
                  <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
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
              className={`relative inline-flex h-7 w-[3.25rem] shrink-0 items-center rounded-full transition-colors duration-200 disabled:opacity-50 ${p.is_live ? 'bg-primary' : 'bg-muted'} ${trelloPressFx}`}
              aria-label={p.is_live ? 'Set to draft' : 'Set to live'}
              title={p.is_live ? 'Live — tap to draft' : 'Draft — tap to go live'}
            >
              <span
                className={`inline-block h-5 w-5 rounded-full bg-background shadow-xs transition-transform duration-200 ${p.is_live ? 'translate-x-7' : 'translate-x-1'}`}
              />
            </PressButton>
            <span className="min-w-[2rem] text-xs font-medium text-muted-foreground">
              {p.is_live ? 'Live' : 'Draft'}
            </span>
            <PressButton
              type="button"
              disabled={pending}
              onClick={() => onDeleteProperty(p.id, p.property_name || 'Untitled')}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-md border border-destructive/30 bg-destructive/10 text-destructive disabled:opacity-50 md:w-auto md:px-3 ${trelloPressFx}`}
              aria-label="Delete property"
              title="Delete property"
            >
              <Trash2 className="h-4 w-4 shrink-0 md:h-5 md:w-5" aria-hidden />
              <span className="hidden text-sm font-medium md:inline">Delete Property</span>
            </PressButton>
          </div>
        )}
      </div>
      {editMode ? (
        <div className="mt-2 pl-9">
          <select
            value={p.location_id}
            disabled={pending}
            onChange={(e) => onMoveProperty(p.id, e.target.value)}
            className={`${stayvoInputClass} h-9 text-xs`}
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
      className={`${stayvoHostCardClass} p-4 md:p-6`}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-border pb-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <DragHandle
            listeners={locationDragListeners}
            attributes={locationDragAttributes}
            hidden={!editMode || !enableLocationDrag}
          />
          <div className="min-w-0">
            <h2 className={stayvoSectionTitleClass}>{loc.name}</h2>
            <p className={`mt-0.5 ${stayvoHintClass}`}>
              {properties.length} propert{properties.length === 1 ? 'y' : 'ies'}
            </p>
          </div>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2 pl-2">
          {!editMode ? (
            <Link
              href={`/properties/new?locationId=${encodeURIComponent(loc.id)}&returnTo=${encodeURIComponent('/dashboard/manage')}`}
              prefetch={false}
              className={cn(stayvoBtnIconPrimaryClass, 'md:h-10 md:w-auto md:gap-2 md:px-4', trelloPressFx)}
              aria-label={`Add property under ${loc.name}`}
              title={`Add property under ${loc.name}`}
            >
              <Plus className="h-4 w-4 shrink-0" aria-hidden />
              <span className="hidden text-sm font-medium md:inline">Add Property</span>
            </Link>
          ) : null}
          {editMode ? (
            <PressButton
              type="button"
              disabled={pending}
              onClick={() => onDeleteLocation(loc.id, loc.name, properties.length)}
              className={`${stayvoBtnCompactSecondaryClass} h-10 gap-1.5 border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/15 disabled:opacity-50 md:px-3 ${trelloPressFx}`}
              aria-label="Delete location"
              title={
                properties.length > 0
                  ? 'Delete this location and all its properties'
                  : 'Delete this empty location'
              }
            >
              <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
              <span className="hidden text-sm font-medium md:inline">Delete Location</span>
            </PressButton>
          ) : null}
        </div>
      </div>

      {properties.length === 0 ? (
        <p className={`mt-3 ${stayvoMutedTextClass}`}>No properties in this location yet.</p>
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
            <ul className="divide-y divide-border">
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
      setNewLocName('');
      setAddLocOpen(true);
    }
    window.addEventListener('stayvo:manage-toggle-edit', onToggleEdit);
    window.addEventListener('stayvo:manage-add-location', onAddLocation);
    return () => {
      window.removeEventListener('stayvo:manage-toggle-edit', onToggleEdit);
      window.removeEventListener('stayvo:manage-add-location', onAddLocation);
    };
  }, [router]);

  useEffect(() => {
    window.dispatchEvent(new Event(addLocOpen ? 'stayvo:add-location-open' : 'stayvo:add-location-close'));
    return () => {
      window.dispatchEvent(new Event('stayvo:add-location-close'));
    };
  }, [addLocOpen]);

  const flatLocations = groups.map((g) => g.location);
  const totalProperties = groups.reduce((sum, g) => sum + g.properties.length, 0);
  const hasAnyProperty = totalProperties > 0;

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
    <div className="mt-4 w-full space-y-6 md:mt-6">
      {editMode ? (
        <div className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-medium text-primary">
          <Pencil className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Editing — drag to reorder, toggle live/draft, or delete
        </div>
      ) : null}

      {/* Add new location modal */}
      {addLocOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <PressButton
            type="button"
            className={`absolute inset-0 bg-black/50 ${trelloPressFx}`}
            aria-label="Cancel"
            onClick={() => setAddLocOpen(false)}
          />
          <div className="relative w-[calc(100%-2rem)] max-w-sm rounded-lg border border-border bg-card p-5 shadow-lg">
            <h2 className="text-base font-medium text-foreground">Add new location</h2>
            <input
              autoFocus
              type="text"
              autoCapitalize="words"
              value={newLocName}
              onChange={(e) => setNewLocName(capitalizeWordStarts(e.target.value))}
              onKeyDown={(e) => { if (e.key === 'Enter') void submitNewLocation(); }}
              placeholder="Location name"
              className={`mt-3 ${stayvoInputClass}`}
            />
            <div className="mt-4 flex justify-end gap-2">
              <PressButton
                type="button"
                onClick={() => setAddLocOpen(false)}
                className={`${stayvoBtnSecondaryClass} ${trelloPressFx}`}
              >
                Cancel
              </PressButton>
              <PressButton
                type="button"
                disabled={!newLocName.trim()}
                onClick={() => void submitNewLocation()}
                className={`${stayvoBtnPrimaryClass} disabled:opacity-50 ${trelloPressFx}`}
              >
                Add
              </PressButton>
            </div>
          </div>
        </div>
      ) : null}

      {error ? (
        <p className={stayvoHostCalloutDestructiveClass}>{error}</p>
      ) : null}

      {!hasAnyProperty && !editMode ? (
        <NoPropertiesEmptyState returnTo="/dashboard/manage" />
      ) : null}

      <div className={hasAnyProperty || editMode ? (editMode ? '' : 'md:hidden') : 'hidden'}>
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
              <div className={`${stayvoHostCardClass} p-4 shadow-md`}>
                <p className="text-sm font-medium text-foreground">{activeGroup.location.name}</p>
                <p className={stayvoHintClass}>
                  {`${activeGroup.properties.length} propert${activeGroup.properties.length === 1 ? 'y' : 'ies'}`}
                </p>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {!editMode && hasAnyProperty ? (
        <div className="hidden min-h-0 md:flex md:gap-8">
          <aside className="sticky top-6 w-64 shrink-0 space-y-1 self-start md:max-h-[min(36rem,calc(100dvh-6rem))] md:overflow-y-auto md:pr-1">
            {groups.length === 0 ? (
              <p className={stayvoMutedTextClass}>No locations yet.</p>
            ) : (
              groups.map((g) => {
                const selected = g.location.id === desktopLocationId;
                return (
                  <button
                    key={g.location.id}
                    type="button"
                    onClick={() => setDesktopLocationId(g.location.id)}
                    className={cn(
                      selected ? stayvoHostNavItemActiveClass : stayvoHostNavItemClass,
                    )}
                  >
                    <span className="w-full truncate text-left">{g.location.name}</span>
                    <span
                      className={cn(
                        'mt-0.5 text-xs font-medium',
                        selected ? 'text-primary/80' : 'text-muted-foreground',
                      )}
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
              <p className={stayvoMutedTextClass}>Select a location.</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
