'use client';

import Link from 'next/link';
import { createPortal } from 'react-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  BASE_SECTION_KEYS,
  FIXED_BOTTOM_SECTIONS,
  FIXED_TOP_SECTIONS,
  getMiddleSectionKeysFromOrder,
  normalizeSectionOrder,
  type CustomDetail as GuestLayoutCustomDetail,
} from '@/lib/guest-layout';
import type {
  CustomDetailInput,
  HouseRuleInput,
  FaqInput,
  CheckInStepInput,
  PropertyFormInput,
} from '@/app/actions/properties';
import {
  createProperty,
  deleteProperty,
  updateProperty,
} from '@/app/actions/properties';
import PressButton from '@/app/_components/PressButton';
import GuestImageSlot from '@/app/properties/_components/GuestImageSlot';
import type { HostTier } from '@/lib/host-tier';
import { isProTier, maxCustomBlocksForTier } from '@/lib/host-tier';

export type PropertyFormProps = {
  mode: 'create' | 'edit';
  propertyId?: string;
  /** Host’s locations (for grouping on dashboard). */
  locations: Array<{ id: string; name: string }>;
  initialValues?: Partial<PropertyFormInput>;
  /** Subscription tier; defaults to Free when omitted. */
  hostTier?: HostTier;
  /** From guestPropertyMediaResolvedPublicBase() — correct preview URLs for R2-hosted media. */
  guestMediaPublicBase?: string | null;
};

function ensureString(v: any) {
  return typeof v === 'string' ? v : '';
}

function customInputsToOrderStubs(details: CustomDetailInput[]): GuestLayoutCustomDetail[] {
  return details.map((_, i) => ({
    detail_order: i,
    title: '',
    message: '',
  }));
}

const SECTION_LABELS: Record<string, string> = {
  address: 'Address',
  parking: 'Parking',
  checkin: 'Check-in',
  wifi: 'Wi-Fi',
  faq: 'FAQ',
  rules: 'House rules',
  host: 'Host contact',
};
const CHECKIN_STEPS_LIMIT = 10;

/** Mouse + touch only — PointerSensor breaks touch drag on mobile (same pattern as Manage dashboard). */
function useGuestSectionOrderSensors() {
  return useSensors(
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 12 },
    }),
    useSensor(MouseSensor, {
      activationConstraint: { distance: 8 },
    })
  );
}

function FixedSectionRow({ sectionKey }: { sectionKey: string }) {
  const label = SECTION_LABELS[sectionKey] ?? sectionKey;
  return (
    <li className="flex items-center gap-3 rounded-2xl border border-slate-200/60 bg-slate-100/70 px-3 py-2.5 opacity-[0.82] backdrop-blur-sm dark:border-white/10 dark:bg-white/6">
      <span className="flex h-4 w-4 shrink-0 items-center justify-center text-slate-400/80 dark:text-slate-600" aria-hidden>
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor">
          <circle cx="8" cy="4" r="1.5" />
          <circle cx="8" cy="8" r="1.5" />
          <circle cx="8" cy="12" r="1.5" />
        </svg>
      </span>
      <span className="text-sm font-medium text-slate-500 dark:text-slate-600">{label}</span>
      <span className="ml-auto shrink-0 rounded-full bg-slate-300/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:bg-white/10 dark:text-slate-600">
        Fixed
      </span>
    </li>
  );
}

function SortableSectionRow({ id }: { id: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };
  const label = id.startsWith('custom:')
    ? `Custom block ${id.replace('custom:', '')}`
    : (SECTION_LABELS[id] ?? id);
  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex touch-none cursor-grab select-none active:cursor-grabbing items-center gap-3 rounded-2xl border border-white/50 bg-white/50 px-3 py-2.5 backdrop-blur-sm [-webkit-touch-callout:none] dark:border-white/10 dark:bg-white/8"
    >
      <span className="select-none text-slate-500 dark:text-white" aria-hidden>
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
          <circle cx="12" cy="6" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="12" cy="18" r="2" />
        </svg>
      </span>
      <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{label}</span>
    </li>
  );
}

export default function PropertyForm({
  mode,
  propertyId,
  locations,
  initialValues,
  hostTier = 'free',
  guestMediaPublicBase,
}: PropertyFormProps) {
  const customBlocksCap = maxCustomBlocksForTier(hostTier);
  const mediaAllowVideo = isProTier(hostTier);
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawReturnTo = (searchParams.get('returnTo') ?? '').trim();
  const returnTo =
    rawReturnTo.startsWith('/dashboard/manage') ? rawReturnTo : '/dashboard/manage';

  const defaults = useMemo<Partial<PropertyFormInput>>(
    () => ({
      propertyName: '',
      internalName: '',
      fullAddress: '',
      googleMapsUrl: '',
      wazeUrl: '',
      parkingDetails: '',
      wifiNetworkName: '',
      wifiPassword: '',
      checkInInstructions: [],
      houseRules: [],
      faqs: [],
      customDetails: [],
      guestSectionOrder: [...BASE_SECTION_KEYS],
      hostName: '',
      hostWhatsappNumber: '',
      hostWhatsappChatNumber: '',
      isLive: false,
      locationId: '',
      socialFacebookUrl: '',
      socialInstagramUrl: '',
      socialXUrl: '',
      socialTiktokUrl: '',
      socialYoutubeUrl: '',
      socialDirectBookingUrl: '',
      ...(initialValues ?? {}),
    }),
    [initialValues]
  );

  const [propertyName, setPropertyName] = useState(
    ensureString(defaults.propertyName)
  );
  const [internalName, setInternalName] = useState(
    ensureString(defaults.internalName)
  );
  const [fullAddress, setFullAddress] = useState(
    ensureString(defaults.fullAddress)
  );
  const [googleMapsUrl, setGoogleMapsUrl] = useState(
    ensureString(defaults.googleMapsUrl)
  );
  const [wazeUrl, setWazeUrl] = useState(ensureString(defaults.wazeUrl));
  const [parkingDetails, setParkingDetails] = useState(
    ensureString(defaults.parkingDetails)
  );
  const [wifiNetworkName, setWifiNetworkName] = useState(
    ensureString(defaults.wifiNetworkName)
  );
  const [wifiPassword, setWifiPassword] = useState(
    ensureString(defaults.wifiPassword)
  );

  const [checkInInstructions, setCheckInInstructions] = useState<
    CheckInStepInput[]
  >(defaults.checkInInstructions?.length ? (defaults.checkInInstructions as any) : []);
  const [houseRules, setHouseRules] = useState<HouseRuleInput[]>(
    defaults.houseRules?.length ? (defaults.houseRules as any) : []
  );
  const [faqs, setFaqs] = useState<FaqInput[]>(
    defaults.faqs?.length ? (defaults.faqs as any) : []
  );
  const [customDetails, setCustomDetails] = useState<CustomDetailInput[]>(
    defaults.customDetails?.length ? (defaults.customDetails as any) : []
  );
  const [guestSectionOrder, setGuestSectionOrder] = useState<string[]>(() =>
    normalizeSectionOrder(
      Array.isArray(defaults.guestSectionOrder)
        ? (defaults.guestSectionOrder as string[])
        : [...BASE_SECTION_KEYS],
      customInputsToOrderStubs((defaults.customDetails as CustomDetailInput[]) ?? [])
    )
  );
  const [sectionOrderOpen, setSectionOrderOpen] = useState(false);

  useEffect(() => {
    setGuestSectionOrder((prev) =>
      normalizeSectionOrder(prev, customInputsToOrderStubs(customDetails))
    );
  }, [customDetails]);

  useEffect(() => {
    if (!sectionOrderOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [sectionOrderOpen]);

  const sectionOrderStubs = useMemo(
    () => customInputsToOrderStubs(customDetails),
    [customDetails]
  );

  const middleSectionKeys = useMemo(
    () => getMiddleSectionKeysFromOrder(guestSectionOrder, sectionOrderStubs),
    [guestSectionOrder, sectionOrderStubs]
  );

  const sectionOrderSensors = useGuestSectionOrderSensors();

  function onSectionDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const stubs = customInputsToOrderStubs(customDetails);
    setGuestSectionOrder((prev) => {
      const middle = getMiddleSectionKeysFromOrder(prev, stubs);
      const oldIdx = middle.indexOf(active.id as string);
      const newIdx = middle.indexOf(over.id as string);
      if (oldIdx < 0 || newIdx < 0) return prev;
      const nextMiddle = arrayMove(middle, oldIdx, newIdx);
      return [...FIXED_TOP_SECTIONS, ...nextMiddle, ...FIXED_BOTTOM_SECTIONS];
    });
  }

  const [hostName, setHostName] = useState(ensureString(defaults.hostName));
  const [hostWhatsappNumber, setHostWhatsappNumber] = useState(
    ensureString(defaults.hostWhatsappNumber)
  );
  const [hostWhatsappChatNumber, setHostWhatsappChatNumber] = useState(
    ensureString(defaults.hostWhatsappChatNumber)
  );

  const [isLive, setIsLive] = useState(Boolean(defaults.isLive));
  const [heroImagePath, setHeroImagePath] = useState(
    ensureString(defaults.heroImagePath)
  );

  const [socialFacebookUrl, setSocialFacebookUrl] = useState(
    ensureString(defaults.socialFacebookUrl)
  );
  const [socialInstagramUrl, setSocialInstagramUrl] = useState(
    ensureString(defaults.socialInstagramUrl)
  );
  const [socialXUrl, setSocialXUrl] = useState(ensureString(defaults.socialXUrl));
  const [socialTiktokUrl, setSocialTiktokUrl] = useState(
    ensureString(defaults.socialTiktokUrl)
  );
  const [socialYoutubeUrl, setSocialYoutubeUrl] = useState(
    ensureString(defaults.socialYoutubeUrl)
  );
  const [socialDirectBookingUrl, setSocialDirectBookingUrl] = useState(
    ensureString(defaults.socialDirectBookingUrl)
  );

  const [locationId, setLocationId] = useState(
    ensureString(defaults.locationId) ||
      (locations[0]?.id ?? '')
  );

  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const initialFormSnapshotRef = useRef<string | null>(null);

  function getCurrentFormInput(): PropertyFormInput {
    return {
      propertyName,
      internalName,
      fullAddress,
      googleMapsUrl,
      wazeUrl,
      parkingDetails,
      wifiNetworkName,
      wifiPassword,
      checkInInstructions,
      houseRules,
      guidebookTips: [],
      faqs,
      customDetails,
      guestSectionOrder,
      hostName,
      hostWhatsappNumber,
      hostWhatsappChatNumber,
      isLive,
      locationId,
      heroImagePath,
      socialFacebookUrl,
      socialInstagramUrl,
      socialXUrl,
      socialTiktokUrl,
      socialYoutubeUrl,
      socialDirectBookingUrl,
    };
  }

  /** Capture baseline after mount so effects (e.g. section order normalize) have applied. */
  useEffect(() => {
    if (initialFormSnapshotRef.current !== null) return;
    const id = window.setTimeout(() => {
      initialFormSnapshotRef.current = JSON.stringify(getCurrentFormInput());
    }, 0);
    return () => window.clearTimeout(id);
    // Baseline once after mount; intentional empty deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- capture initial snapshot only
  }, []);

  const isDirty =
    initialFormSnapshotRef.current !== null &&
    JSON.stringify(getCurrentFormInput()) !== initialFormSnapshotRef.current;

  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty]);

  function confirmLeaveIfDirty(): boolean {
    if (!isDirty) return true;
    return window.confirm(
      'You have unsaved changes. Leave this page and discard them?\n\nPress OK to discard, or Cancel to stay.'
    );
  }

  function navigateBack() {
    if (!confirmLeaveIfDirty()) return;
    router.push(returnTo);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      const rawInput = getCurrentFormInput();
      const input = isProTier(hostTier) ? rawInput : { ...rawInput, faqs: [] };

      if (mode === 'create') {
        const res = await createProperty(input);
        if (!res.ok) throw new Error(res.error);
        setSuccess('Property created!');
        router.push(returnTo);
        return;
      }

      const res = await updateProperty(propertyId!, input);
      if (!res.ok) throw new Error(res.error);
      setSuccess('Saved!');
      router.push(returnTo);
    } catch (err: any) {
      setError(err?.message ?? 'Unable to save property.');
    } finally {
      setSubmitting(false);
    }
  }

  async function onDeleteProperty() {
    if (mode !== 'edit' || !propertyId) return;
    const yes = window.confirm(
      'Delete this property? This cannot be undone and removes all guest links.'
    );
    if (!yes) return;
    const finalYes = window.confirm(
      'Please confirm again: permanently delete this property and all related guest links/data?'
    );
    if (!finalYes) return;

    setError(null);
    setDeleting(true);
    try {
      const res = await deleteProperty(propertyId);
      if (!res.ok) throw new Error(res.error);
      router.push('/dashboard/manage');
    } catch (err: any) {
      setError(err?.message ?? 'Unable to delete property.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <main className="pb-10">
      {/* Sticky header */}
      <header className="glass-header sticky top-0 z-30 -mx-4 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-3 gap-y-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <PressButton
              type="button"
              onClick={navigateBack}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200/90 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-white/18 dark:bg-white/18 dark:text-slate-900 dark:hover:bg-white/28 dark:hover:text-slate-950"
              aria-label="Back"
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden>
                <path
                  fillRule="evenodd"
                  d="M12.707 5.293a1 1 0 0 1 0 1.414L9.414 10l3.293 3.293a1 1 0 0 1-1.414 1.414l-4-4a1 1 0 0 1 0-1.414l4-4a1 1 0 0 1 1.414 0Z"
                  clipRule="evenodd"
                />
              </svg>
            </PressButton>
            <h1 className="min-w-0 text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              {mode === 'create' ? 'Add property' : 'Edit'}
            </h1>
          </div>
          <div className="flex flex-shrink-0 flex-wrap items-center justify-end gap-2 sm:ml-auto">
            {mode === 'edit' && propertyId ? (
              <Link
                href={`/properties/${propertyId}/preview`}
                prefetch={false}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/90 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-white/18 dark:bg-white/18 dark:text-slate-900 dark:hover:bg-white/28 dark:hover:text-slate-950"
                aria-label="Preview guest view"
                title="Preview guest view"
              >
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden>
                  <path d="M10 3C5.5 3 2 10 2 10s3.5 7 8 7 8-7 8-7-3.5-7-8-7Zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm0-6a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" />
                </svg>
              </Link>
            ) : null}
            {mode === 'edit' ? (
              <PressButton
                type="button"
                onClick={() => setSectionOrderOpen(true)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/90 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-white/18 dark:bg-white/18 dark:text-slate-900 dark:hover:bg-white/28 dark:hover:text-slate-950"
                aria-label="Reorder sections"
                title="Reorder sections"
              >
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden>
                  <circle cx="10" cy="5" r="1.75" />
                  <circle cx="10" cy="10" r="1.75" />
                  <circle cx="10" cy="15" r="1.75" />
                </svg>
              </PressButton>
            ) : null}
            <PressButton
              type="button"
              disabled={submitting || deleting}
              onClick={() => formRef.current?.requestSubmit()}
              className="inline-flex h-10 min-w-[5.5rem] shrink-0 items-center justify-center rounded-full bg-brand px-5 text-sm font-semibold text-white shadow-md transition hover:opacity-90 disabled:opacity-60"
            >
              {submitting
                ? 'Saving…'
                : mode === 'create'
                  ? 'Create'
                  : 'Save'}
            </PressButton>
          </div>
        </div>
      </header>

      {/* Section order modal */}
      {sectionOrderOpen && typeof document !== 'undefined'
        ? createPortal(
            <div className="fixed inset-0 z-[70] flex items-center justify-center">
              <PressButton
                type="button"
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                aria-label="Close"
                onClick={() => setSectionOrderOpen(false)}
              />
              <div className="glass relative w-[calc(100%-2rem)] max-w-sm rounded-[20px] p-5">
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Reorder sections</h2>
                <DndContext
                  sensors={sectionOrderSensors}
                  collisionDetection={closestCorners}
                  onDragEnd={onSectionDragEnd}
                >
                  <ul className="mt-4 space-y-2">
                    {FIXED_TOP_SECTIONS.map((key) => (
                      <FixedSectionRow key={key} sectionKey={key} />
                    ))}
                    <SortableContext
                      id="guest-section-order"
                      items={middleSectionKeys}
                      strategy={verticalListSortingStrategy}
                    >
                      {middleSectionKeys.map((key) => (
                        <SortableSectionRow key={key} id={key} />
                      ))}
                    </SortableContext>
                    {FIXED_BOTTOM_SECTIONS.map((key) => (
                      <FixedSectionRow key={key} sectionKey={key} />
                    ))}
                  </ul>
                </DndContext>
                <PressButton
                  type="button"
                  onClick={() => setSectionOrderOpen(false)}
                  className="mt-4 w-full rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white shadow-md hover:opacity-90"
                >
                  Done
                </PressButton>
              </div>
            </div>,
            document.body
          )
        : null}

      <form
        ref={formRef}
        id="stayvo-property-form"
        onSubmit={onSubmit}
        autoComplete="off"
        className="mt-6 space-y-7"
      >
        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
            {error}
          </div>
        ) : null}
        {success ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
            {success}
          </div>
        ) : null}

        {/* Hero Image */}
        <section className="glass rounded-[20px] p-4">
          <div className="mb-3">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Hero image</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Displayed as the full-width background of the guest welcome header.
            </p>
          </div>
          <GuestImageSlot
            propertyId={propertyId}
            slot="detail:0"
            value={heroImagePath}
            onChange={setHeroImagePath}
            allowVideo={mediaAllowVideo}
            guestMediaPublicBase={guestMediaPublicBase}
          />
        </section>

        {/* Property Info */}
        <section className="glass rounded-[20px] p-4">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Property details</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              What guests need before arrival.
            </p>
          </div>

          <div className="mb-4 flex items-center justify-between gap-4 rounded-2xl border border-white/50 bg-white/40 p-3 backdrop-blur-sm dark:border-white/10 dark:bg-white/6">
            <div>
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">Status</div>
            </div>
            <label className="inline-flex items-center gap-3">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {isLive ? 'Live' : 'Draft'}
              </span>
              <input
                type="checkbox"
                checked={isLive}
                onChange={(e) => setIsLive(e.target.checked)}
                className="h-5 w-5 accent-brand"
              />
            </label>
          </div>

          <div className="mb-4 rounded-2xl border border-white/50 bg-white/40 p-3 backdrop-blur-sm dark:border-white/10 dark:bg-slate-950/40">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="min-w-0 flex-1">
                <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">Location</label>
                <select
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  className="mt-2 w-full max-w-md rounded-full border border-slate-200 bg-white/70 px-3 py-2 text-sm font-medium text-slate-900 outline-none ring-brand/30 focus:ring-2 dark:border-white/20 dark:bg-white/88 dark:text-slate-950 dark:[color-scheme:dark]"
                >
                  {locations.length === 0 ? (
                    <option value="">Create a location from Property management first</option>
                  ) : (
                    locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Property name
              </label>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Guest will see this. Line breaks are kept on the guest page.
              </p>
              <textarea
                required
                rows={3}
                value={propertyName}
                onChange={(e) => setPropertyName(e.target.value)}
                placeholder="Property name"
                className="mt-1 min-h-[4.5rem] w-full resize-y rounded-2xl border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-900 outline-none ring-brand/30 focus:ring-2 dark:border-white/20 dark:bg-white/88 dark:text-slate-950 dark:placeholder:text-slate-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Internal name
              </label>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                For internal record only.
              </p>
              <input
                value={internalName}
                onChange={(e) => setInternalName(e.target.value)}
                className="mt-1 w-full rounded-full border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-900 outline-none ring-brand/30 focus:ring-2 dark:border-white/20 dark:bg-white/88 dark:text-slate-950 dark:placeholder:text-slate-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Full address
              </label>
              <textarea
                rows={3}
                value={fullAddress}
                onChange={(e) => setFullAddress(e.target.value)}
                className="mt-1 w-full resize-none rounded-2xl border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-900 outline-none ring-brand/30 focus:ring-2 dark:border-white/20 dark:bg-white/88 dark:text-slate-950 dark:placeholder:text-slate-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Google Maps URL
              </label>
              <input
                value={googleMapsUrl}
                onChange={(e) => setGoogleMapsUrl(e.target.value)}
                className="mt-1 w-full rounded-full border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-900 outline-none ring-brand/30 focus:ring-2 dark:border-white/20 dark:bg-white/88 dark:text-slate-950 dark:placeholder:text-slate-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Waze URL
              </label>
              <input
                value={wazeUrl}
                onChange={(e) => setWazeUrl(e.target.value)}
                className="mt-1 w-full rounded-full border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-900 outline-none ring-brand/30 focus:ring-2 dark:border-white/20 dark:bg-white/88 dark:text-slate-950 dark:placeholder:text-slate-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Parking details
              </label>
              <input
                value={parkingDetails}
                onChange={(e) => setParkingDetails(e.target.value)}
                className="mt-1 w-full rounded-full border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-900 outline-none ring-brand/30 focus:ring-2 dark:border-white/20 dark:bg-white/88 dark:text-slate-950 dark:placeholder:text-slate-500"
              />
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Wifi network name
              </label>
              <input
                name="stayvo_wifi_ssid"
                value={wifiNetworkName}
                onChange={(e) => setWifiNetworkName(e.target.value)}
                autoComplete="off"
                className="mt-1 w-full rounded-full border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-900 outline-none ring-brand/30 focus:ring-2 dark:border-white/20 dark:bg-white/88 dark:text-slate-950 dark:placeholder:text-slate-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Wifi password
              </label>
              <input
                name="stayvo_wifi_passphrase"
                value={wifiPassword}
                onChange={(e) => setWifiPassword(e.target.value)}
                className="mt-1 w-full rounded-full border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-900 outline-none ring-brand/30 focus:ring-2 dark:border-white/20 dark:bg-white/88 dark:text-slate-950 dark:placeholder:text-slate-500"
                type="text"
                inputMode="text"
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
              />
            </div>
          </div>

        </section>

        {/* Check-in steps */}
        <section className="glass rounded-[20px] p-4">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Check-in instructions</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Add step-by-step instructions for guests.
            </p>
          </div>

          <div className="space-y-3">
            {checkInInstructions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-600">
                No steps yet. Add your first step below.
              </div>
            ) : null}

            {checkInInstructions.map((s, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-white/50 bg-white/50 p-3 backdrop-blur-sm dark:border-white/8 dark:bg-white/5"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-semibold text-slate-500">
                    Step {idx + 1}
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={Boolean(s.isDisplayed)}
                        onChange={(e) =>
                          setCheckInInstructions((prev) =>
                            prev.map((it, i) =>
                              i === idx ? { ...it, isDisplayed: e.target.checked } : it
                            )
                          )
                        }
                        className="h-4 w-4 accent-brand"
                      />
                      Display
                    </label>
                    <PressButton
                      type="button"
                      onClick={() =>
                        setCheckInInstructions((prev) =>
                          prev.filter((_, i) => i !== idx)
                        )
                      }
                      className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                    >
                      Remove
                    </PressButton>
                  </div>
                </div>
                <textarea
                  rows={3}
                  value={s.instruction}
                  onChange={(e) => {
                    const v = e.target.value;
                    setCheckInInstructions((prev) =>
                      prev.map((it, i) =>
                        i === idx ? { ...it, instruction: v } : it
                      )
                    );
                  }}
                  placeholder="Step instructions (optional if you only add media)"
                  className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-900 outline-none ring-brand/30 focus:ring-2 dark:border-white/20 dark:bg-white/88 dark:text-slate-950 dark:placeholder:text-slate-500"
                />
                <GuestImageSlot
                  propertyId={propertyId}
                  slot={`checkin:${idx}`}
                  value={s.guestImagePath ?? ''}
                  onChange={(v) =>
                    setCheckInInstructions((prev) =>
                      prev.map((it, i) =>
                        i === idx ? { ...it, guestImagePath: v } : it
                      )
                    )
                  }
                  allowVideo={mediaAllowVideo}
                  guestMediaPublicBase={guestMediaPublicBase}
                />
              </div>
            ))}
          </div>

          <div className="mt-3">
            <PressButton
              type="button"
              disabled={checkInInstructions.length >= CHECKIN_STEPS_LIMIT}
              onClick={() =>
                setCheckInInstructions((prev) => [
                  ...prev,
                  { instruction: '', isDisplayed: true, guestImagePath: '' },
                ])
              }
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white/70 px-3 py-2 text-sm font-semibold text-slate-700 backdrop-blur-sm transition disabled:opacity-50"
            >
              + Add step
            </PressButton>
          </div>
        </section>

        {/* House rules */}
        <section className="glass rounded-[20px] p-4">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">House rules</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Add rules guests must follow.
            </p>
          </div>

          <div className="space-y-3">
            {houseRules.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-600">
                No rules yet. Add a rule below.
              </div>
            ) : null}

            {houseRules.map((r, idx) => (
              <div
                key={idx}
                className="flex flex-col gap-2 rounded-2xl border border-white/50 bg-white/50 p-3 backdrop-blur-sm dark:border-white/8 dark:bg-white/5"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-semibold text-slate-500">
                    Rule {idx + 1}
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={Boolean(r.isDisplayed)}
                        onChange={(e) =>
                          setHouseRules((prev) =>
                            prev.map((it, i) =>
                              i === idx ? { ...it, isDisplayed: e.target.checked } : it
                            )
                          )
                        }
                        className="h-4 w-4 accent-brand"
                      />
                      Display
                    </label>
                    <PressButton
                      type="button"
                      onClick={() =>
                        setHouseRules((prev) =>
                          prev.filter((_, i) => i !== idx)
                        )
                      }
                      className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                    >
                      Remove
                    </PressButton>
                  </div>
                </div>
                <input
                  value={r.ruleText}
                  onChange={(e) => {
                    const v = e.target.value;
                    setHouseRules((prev) =>
                      prev.map((it, i) =>
                        i === idx ? { ...it, ruleText: v } : it
                      )
                    );
                  }}
                  className="w-full rounded-full border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-900 outline-none ring-brand/30 focus:ring-2 dark:border-white/20 dark:bg-white/88 dark:text-slate-950 dark:placeholder:text-slate-500"
                />
              </div>
            ))}
          </div>

          <div className="mt-3">
            <PressButton
              type="button"
              onClick={() =>
                setHouseRules((prev) => [...prev, { ruleText: '', isDisplayed: true }])
              }
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white/70 px-3 py-2 text-sm font-semibold text-slate-700 backdrop-blur-sm transition disabled:opacity-50"
            >
              + Add rule
            </PressButton>
          </div>
        </section>

        {/* FAQ (Pro) */}
        {isProTier(hostTier) ? (
          <section className="glass rounded-[20px] p-4">
            <div className="mb-4">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">FAQ</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Add common guest questions and answers. Leave empty to hide this section.
              </p>
            </div>

            <div className="space-y-3">
              {faqs.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-600 dark:border-white/15 dark:bg-white/5 dark:text-slate-400">
                  No FAQ entries yet.
                </div>
              ) : null}

              {faqs.map((f, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-white/50 bg-white/50 p-3 backdrop-blur-sm dark:border-white/8 dark:bg-white/5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      FAQ {idx + 1}
                    </div>
                    <PressButton
                      type="button"
                      onClick={() => setFaqs((prev) => prev.filter((_, i) => i !== idx))}
                      className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                    >
                      Remove
                    </PressButton>
                  </div>

                  <div className="mt-3 grid gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        Question
                      </label>
                      <input
                        value={f.question}
                        onChange={(e) => {
                          const v = e.target.value;
                          setFaqs((prev) =>
                            prev.map((it, i) => (i === idx ? { ...it, question: v } : it))
                          );
                        }}
                        placeholder="e.g. What time is check-in?"
                        className="mt-1 w-full rounded-full border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-900 outline-none ring-brand/30 focus:ring-2 dark:border-white/20 dark:bg-white/88 dark:text-slate-950 dark:placeholder:text-slate-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        Answer
                      </label>
                      <textarea
                        value={f.answer}
                        onChange={(e) => {
                          const v = e.target.value;
                          setFaqs((prev) =>
                            prev.map((it, i) => (i === idx ? { ...it, answer: v } : it))
                          );
                        }}
                        placeholder="e.g. Check-in starts at 3 PM. Self check-in instructions are in the Check-in section."
                        className="mt-1 w-full resize-none rounded-2xl border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-900 outline-none ring-brand/30 focus:ring-2 dark:border-white/20 dark:bg-white/88 dark:text-slate-950 dark:placeholder:text-slate-500"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3">
              <PressButton
                type="button"
                onClick={() =>
                  setFaqs((prev) => [...prev, { question: '', answer: '' }])
                }
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white/70 px-3 py-2 text-sm font-semibold text-slate-700 backdrop-blur-sm transition dark:border-white/15 dark:bg-white/10 dark:text-slate-200"
              >
                + Add FAQ
              </PressButton>
            </div>
          </section>
        ) : (
          <section className="glass rounded-[20px] p-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">FAQ</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Guest FAQ is included with Stayvo Pro.
            </p>
          </section>
        )}

        {/* Social links (guest page footer) */}
        <section className="glass rounded-[20px] p-4">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Social links</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Optional. Shown as icons at the bottom of the guest page. Leave blank to hide a
              platform.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Direct booking website
              </label>
              <input
                value={socialDirectBookingUrl}
                onChange={(e) => setSocialDirectBookingUrl(e.target.value)}
                placeholder="https://your-site.com/book"
                inputMode="url"
                autoComplete="off"
                className="mt-1 w-full rounded-full border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-900 outline-none ring-brand/30 focus:ring-2 dark:border-white/20 dark:bg-white/88 dark:text-slate-950 dark:placeholder:text-slate-500"
              />
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-500">
                Shown as a &quot;Booking Website&quot; button in the Your host block (hidden when blank).
              </p>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Instagram</label>
              <input
                value={socialInstagramUrl}
                onChange={(e) => setSocialInstagramUrl(e.target.value)}
                placeholder="https://instagram.com/yourhandle"
                inputMode="url"
                autoComplete="off"
                className="mt-1 w-full rounded-full border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-900 outline-none ring-brand/30 focus:ring-2 dark:border-white/20 dark:bg-white/88 dark:text-slate-950 dark:placeholder:text-slate-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Facebook</label>
              <input
                value={socialFacebookUrl}
                onChange={(e) => setSocialFacebookUrl(e.target.value)}
                placeholder="https://facebook.com/..."
                inputMode="url"
                autoComplete="off"
                className="mt-1 w-full rounded-full border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-900 outline-none ring-brand/30 focus:ring-2 dark:border-white/20 dark:bg-white/88 dark:text-slate-950 dark:placeholder:text-slate-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">TikTok</label>
              <input
                value={socialTiktokUrl}
                onChange={(e) => setSocialTiktokUrl(e.target.value)}
                placeholder="https://tiktok.com/@..."
                inputMode="url"
                autoComplete="off"
                className="mt-1 w-full rounded-full border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-900 outline-none ring-brand/30 focus:ring-2 dark:border-white/20 dark:bg-white/88 dark:text-slate-950 dark:placeholder:text-slate-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">YouTube</label>
              <input
                value={socialYoutubeUrl}
                onChange={(e) => setSocialYoutubeUrl(e.target.value)}
                placeholder="https://youtube.com/@..."
                inputMode="url"
                autoComplete="off"
                className="mt-1 w-full rounded-full border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-900 outline-none ring-brand/30 focus:ring-2 dark:border-white/20 dark:bg-white/88 dark:text-slate-950 dark:placeholder:text-slate-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">X</label>
              <input
                value={socialXUrl}
                onChange={(e) => setSocialXUrl(e.target.value)}
                placeholder="https://x.com/..."
                inputMode="url"
                autoComplete="off"
                className="mt-1 w-full rounded-full border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-900 outline-none ring-brand/30 focus:ring-2 dark:border-white/20 dark:bg-white/88 dark:text-slate-950 dark:placeholder:text-slate-500"
              />
            </div>
          </div>
        </section>

        {/* Custom blocks */}
        <section className="glass rounded-[20px] p-4">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Custom block</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Add custom sections shown on the guest page.
              {hostTier === 'free' ? (
                <span className="block pt-1 text-xs text-slate-500 dark:text-slate-500">
                  Free includes up to {customBlocksCap} blocks; Stayvo Pro allows more.
                </span>
              ) : null}
            </p>
          </div>

          <div className="space-y-3">
            {customDetails.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-600">
                No custom blocks yet.
              </div>
            ) : null}

            {customDetails.map((d, idx) => (
              <div key={idx} className="rounded-2xl border border-white/50 bg-white/50 p-3 backdrop-blur-sm dark:border-white/8 dark:bg-white/5">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-semibold text-slate-500">
                    Block {idx + 1}
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={Boolean(d.isDisplayed)}
                        onChange={(e) =>
                          setCustomDetails((prev) =>
                            prev.map((it, i) =>
                              i === idx ? { ...it, isDisplayed: e.target.checked } : it
                            )
                          )
                        }
                        className="h-4 w-4 accent-brand"
                      />
                      Display
                    </label>
                    <PressButton
                      type="button"
                      onClick={() =>
                        setCustomDetails((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                    >
                      Remove
                    </PressButton>
                  </div>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Title
                    </label>
                    <input
                      value={d.title}
                      onChange={(e) => {
                        const v = e.target.value;
                        setCustomDetails((prev) =>
                          prev.map((it, i) => (i === idx ? { ...it, title: v } : it))
                        );
                      }}
                      className="mt-1 w-full rounded-full border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-900 outline-none ring-brand/30 focus:ring-2 dark:border-white/20 dark:bg-white/88 dark:text-slate-950 dark:placeholder:text-slate-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Message
                    </label>
                    <input
                      value={d.message}
                      onChange={(e) => {
                        const v = e.target.value;
                        setCustomDetails((prev) =>
                          prev.map((it, i) =>
                            i === idx ? { ...it, message: v } : it
                          )
                        );
                      }}
                      className="mt-1 w-full rounded-full border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-900 outline-none ring-brand/30 focus:ring-2 dark:border-white/20 dark:bg-white/88 dark:text-slate-950 dark:placeholder:text-slate-500"
                    />
                  </div>
                </div>
                <GuestImageSlot
                  propertyId={propertyId}
                  slot={`detail:${idx}`}
                  value={d.guestImagePath ?? ''}
                  onChange={(v) =>
                    setCustomDetails((prev) =>
                      prev.map((it, i) =>
                        i === idx ? { ...it, guestImagePath: v } : it
                      )
                    )
                  }
                  allowVideo={mediaAllowVideo}
                  guestMediaPublicBase={guestMediaPublicBase}
                />
              </div>
            ))}
          </div>

          <div className="mt-3">
            <PressButton
              type="button"
              disabled={customDetails.length >= customBlocksCap}
              onClick={() =>
                setCustomDetails((prev) => [
                  ...prev,
                  { title: '', message: '', isDisplayed: true, guestImagePath: '' },
                ])
              }
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white/70 px-3 py-2 text-sm font-semibold text-slate-700 backdrop-blur-sm transition"
            >
              + Add block
            </PressButton>
          </div>
        </section>

        {/* Host Info */}
        <section className="glass rounded-[20px] p-4">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Host contact</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">How guests reach you.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Host name
              </label>
              <input
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                className="mt-1 w-full rounded-full border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-900 outline-none ring-brand/30 focus:ring-2 dark:border-white/20 dark:bg-white/88 dark:text-slate-950 dark:placeholder:text-slate-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Call</label>
              <input
                value={hostWhatsappNumber}
                onChange={(e) => setHostWhatsappNumber(e.target.value)}
                className="mt-1 w-full rounded-full border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-900 outline-none ring-brand/30 focus:ring-2 dark:border-white/20 dark:bg-white/88 dark:text-slate-950 dark:placeholder:text-slate-500"
                placeholder="+1 555 123 4567"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">WhatsApp</label>
              <input
                value={hostWhatsappChatNumber}
                onChange={(e) => setHostWhatsappChatNumber(e.target.value)}
                className="mt-1 w-full rounded-full border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-900 outline-none ring-brand/30 focus:ring-2 dark:border-white/20 dark:bg-white/88 dark:text-slate-950 dark:placeholder:text-slate-500"
                placeholder="+1 555 987 6543"
              />
            </div>
          </div>
        </section>

        {mode === 'edit' && propertyId ? (
          <section className="rounded-[20px] border border-rose-200 bg-rose-50/40 p-4 backdrop-blur-sm dark:border-rose-500/25 dark:bg-rose-950/50 dark:ring-1 dark:ring-inset dark:ring-rose-400/10">
            <h2 className="text-base font-semibold text-rose-900 dark:text-rose-200">Danger zone</h2>
            <p className="mt-1 text-sm text-rose-800/90 dark:text-rose-300">
              Permanently delete this property and all guest links created for it.
            </p>
            <PressButton
              type="button"
              onClick={onDeleteProperty}
              disabled={submitting || deleting}
              className="mt-3 inline-flex items-center justify-center rounded-full border border-rose-300 bg-rose-50/70 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60 dark:border-rose-500/35 dark:bg-rose-900/70 dark:text-rose-100 dark:hover:bg-rose-800/80"
            >
              {deleting ? 'Deleting…' : 'Delete property'}
            </PressButton>
          </section>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <PressButton
            type="submit"
            disabled={submitting || deleting}
            className="inline-flex items-center justify-center rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-90 disabled:opacity-60"
          >
            {submitting
              ? 'Saving...'
              : mode === 'create'
                ? 'Create property'
                : 'Save changes'}
          </PressButton>
        </div>
      </form>
    </main>
  );
}

