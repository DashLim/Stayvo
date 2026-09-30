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
import { capitalizeWordStarts } from '@/lib/capitalize-word-starts';
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
  importAirbnbListing,
  updateProperty,
} from '@/app/actions/properties';
import { updateLocationName } from '@/app/actions/locations';
import PressButton from '@/app/_components/PressButton';
import StayvoProMessage from '@/app/_components/StayvoProMessage';
import GuestImageSlot from '@/app/properties/_components/GuestImageSlot';
import IcalFeedPanel from '@/app/properties/_components/IcalFeedPanel';
import CollapsibleFormSection from '@/app/properties/_components/CollapsibleFormSection';
import { usePropertyFormSections } from '@/app/properties/_components/usePropertyFormSections';
import { CHECKIN_ALLOW_GUEST_VIDEO, maxCustomBlocksForCheckIn } from '@/lib/host-tier';
import {
  stayvoFormSectionClass,
  stayvoFormSectionElevatedClass,
  stayvoInputClass,
  stayvoInputPillClass,
  stayvoTextareaClass,
} from '@/lib/stayvo-ui-classes';

export type PropertyFormProps = {
  mode: 'create' | 'edit';
  propertyId?: string;
  /** Host’s locations (for grouping on dashboard). */
  locations: Array<{ id: string; name: string }>;
  initialValues?: Partial<PropertyFormInput>;
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
  guestMediaPublicBase,
}: PropertyFormProps) {
  const customBlocksCap = maxCustomBlocksForCheckIn();
  const mediaAllowVideo = CHECKIN_ALLOW_GUEST_VIDEO;
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
      isLive: true,
      locationId: '',
      socialFacebookUrl: '',
      socialInstagramUrl: '',
      socialXUrl: '',
      socialTiktokUrl: '',
      socialYoutubeUrl: '',
      socialAirbnbUrl: '',
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
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);

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

  useEffect(() => {
    if (!headerMenuOpen) return;
    function onPointerDown(e: MouseEvent | TouchEvent) {
      const target = e.target as Node | null;
      if (!target) return;
      const root = document.getElementById('property-edit-header-menu');
      if (root && !root.contains(target)) setHeaderMenuOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
    };
  }, [headerMenuOpen]);

  const sectionOrderStubs = useMemo(
    () => customInputsToOrderStubs(customDetails),
    [customDetails]
  );

  const middleSectionKeys = useMemo(
    () => getMiddleSectionKeysFromOrder(guestSectionOrder, sectionOrderStubs),
    [guestSectionOrder, sectionOrderStubs]
  );

  const sectionOrderSensors = useGuestSectionOrderSensors();
  const {
    isSectionOpen,
    toggleSection,
    expandAllSections,
    collapseAllSections,
  } = usePropertyFormSections(propertyId, mode);

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
  const [socialAirbnbUrl, setSocialAirbnbUrl] = useState(
    ensureString(defaults.socialAirbnbUrl)
  );
  const [socialDirectBookingUrl, setSocialDirectBookingUrl] = useState(
    ensureString(defaults.socialDirectBookingUrl)
  );
  const [airbnbImportUrl, setAirbnbImportUrl] = useState(
    ensureString(defaults.socialAirbnbUrl)
  );
  const [airbnbImporting, setAirbnbImporting] = useState(false);
  const [airbnbImportError, setAirbnbImportError] = useState<string | null>(null);
  const [airbnbImportNotes, setAirbnbImportNotes] = useState<string[]>([]);
  const [airbnbImportSummary, setAirbnbImportSummary] = useState<string | null>(null);

  const [locationId, setLocationId] = useState(
    ensureString(defaults.locationId) ||
      (locations[0]?.id ?? '')
  );
  const initialLocationId =
    ensureString(defaults.locationId) || (locations[0]?.id ?? '');
  const [locationName, setLocationName] = useState(() => {
    const match = locations.find((loc) => loc.id === initialLocationId);
    return match?.name ?? locations[0]?.name ?? '';
  });

  useEffect(() => {
    const match = locations.find((loc) => loc.id === locationId);
    if (match) setLocationName(match.name);
  }, [locationId, locations]);

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
      socialAirbnbUrl,
      socialDirectBookingUrl,
    };
  }

  /** Capture baseline after mount so effects (e.g. section order normalize) have applied. */
  useEffect(() => {
    if (initialFormSnapshotRef.current !== null) return;
    const id = window.setTimeout(() => {
      initialFormSnapshotRef.current = getFormSnapshot();
    }, 0);
    return () => window.clearTimeout(id);
    // Baseline once after mount; intentional empty deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- capture initial snapshot only
  }, []);

  function getFormSnapshot() {
    return JSON.stringify({ ...getCurrentFormInput(), locationName });
  }

  const isDirty =
    initialFormSnapshotRef.current !== null &&
    getFormSnapshot() !== initialFormSnapshotRef.current;

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

  async function onImportAirbnb() {
    const raw = airbnbImportUrl.trim();
    if (!raw) {
      setAirbnbImportError('Paste an Airbnb listing URL first.');
      setAirbnbImportSummary(null);
      setAirbnbImportNotes([]);
      return;
    }

    setAirbnbImporting(true);
    setAirbnbImportError(null);
    setAirbnbImportSummary(null);
    setAirbnbImportNotes([]);

    try {
      const res = await importAirbnbListing(raw);
      if (!res.ok) throw new Error(res.error);
      const { prefill, suggestions, notes } = res.result;

      if (prefill.propertyName) setPropertyName(prefill.propertyName);
      if (prefill.hostName) setHostName(prefill.hostName);
      if (prefill.fullAddress) setFullAddress(prefill.fullAddress);
      if (prefill.googleMapsUrl) setGoogleMapsUrl(prefill.googleMapsUrl);
      if (prefill.parkingDetails) setParkingDetails(prefill.parkingDetails);
      if (prefill.socialAirbnbUrl) {
        setSocialAirbnbUrl(prefill.socialAirbnbUrl);
        setAirbnbImportUrl(prefill.socialAirbnbUrl);
      }
      if (prefill.houseRules && prefill.houseRules.length > 0) {
        setHouseRules(prefill.houseRules);
      }
      if (prefill.checkInInstructions && prefill.checkInInstructions.length > 0) {
        setCheckInInstructions(prefill.checkInInstructions);
      }
      if (prefill.locationName) {
        const currentLocation = locationName.trim().toLowerCase();
        if (!currentLocation || currentLocation === 'general') {
          setLocationName(prefill.locationName);
        }
      }

      const fields = Array.from(
        new Set(
          suggestions.map((s) => {
            if (s.field === 'propertyName') return 'Property name';
            if (s.field === 'hostName') return 'Host name';
            if (s.field === 'locationName') return 'Location name';
            if (s.field === 'fullAddress') return 'Full address';
            if (s.field === 'googleMapsUrl') return 'Google Maps URL';
            if (s.field === 'parkingDetails') return 'Parking details';
            if (s.field === 'houseRules') return 'House rules';
            if (s.field === 'checkInInstructions') return 'Check-in instructions';
            if (s.field === 'socialAirbnbUrl') return 'Airbnb listing URL';
            return s.field;
          })
        )
      );
      setAirbnbImportSummary(
        fields.length > 0
          ? `Imported: ${fields.join(', ')}.`
          : 'Listing imported, but no fields could be auto-filled.'
      );
      setAirbnbImportNotes(notes);
    } catch (err: any) {
      setAirbnbImportError(err?.message ?? 'Unable to import Airbnb listing.');
    } finally {
      setAirbnbImporting(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      const input = getCurrentFormInput();

      if (locationId && locationName.trim()) {
        const nameRes = await updateLocationName(locationId, locationName);
        if (!nameRes.ok) throw new Error(nameRes.error);
      }

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
    <main className="w-full px-4 pb-10 md:px-8 md:pb-16">
      {/* Sticky header */}
      <header className="glass-header sticky top-0 z-30 -mx-4 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] md:-mx-8 md:px-8 md:pb-4">
        <div className="mx-auto flex w-full max-w-[1100px] flex-wrap items-center gap-x-3 gap-y-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <PressButton
              type="button"
              onClick={navigateBack}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200/90 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-white/15 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/18"
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
          <div className="flex flex-shrink-0 items-center justify-end gap-2 sm:ml-auto">
            {/* Mobile: collapse secondary actions into a 3-dot menu */}
            <div id="property-edit-header-menu" className="relative md:hidden">
              <PressButton
                type="button"
                onClick={() => setHeaderMenuOpen((v) => !v)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/90 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-white/15 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/18"
                aria-label="More actions"
                aria-expanded={headerMenuOpen}
                title="More actions"
              >
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden>
                  <circle cx="10" cy="5" r="1.75" />
                  <circle cx="10" cy="10" r="1.75" />
                  <circle cx="10" cy="15" r="1.75" />
                </svg>
              </PressButton>
              {headerMenuOpen ? (
                <div className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-2xl border border-slate-200 bg-white py-1 shadow-lg dark:border-white/10 dark:bg-neutral-900">
                  {mode === 'edit' && propertyId ? (
                    <Link
                      href={`/properties/${propertyId}/preview`}
                      prefetch={false}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10"
                      onClick={() => setHeaderMenuOpen(false)}
                    >
                      Guest View
                    </Link>
                  ) : null}
                  {mode === 'edit' ? (
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10"
                      onClick={() => {
                        setHeaderMenuOpen(false);
                        setSectionOrderOpen(true);
                      }}
                    >
                      Re-arrange
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10"
                    onClick={() => {
                      setHeaderMenuOpen(false);
                      expandAllSections();
                    }}
                  >
                    Expand All
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10"
                    onClick={() => {
                      setHeaderMenuOpen(false);
                      collapseAllSections();
                    }}
                  >
                    Collapse All
                  </button>
                </div>
              ) : null}
            </div>

            {/* Desktop: keep individual action buttons */}
            <div className="hidden items-center gap-2 md:flex">
              {mode === 'edit' && propertyId ? (
                <Link
                  href={`/properties/${propertyId}/preview`}
                  prefetch={false}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/90 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-white/15 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/18"
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
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/90 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-white/15 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/18"
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
                onClick={expandAllSections}
                className="inline-flex h-10 items-center justify-center rounded-full border border-slate-200/90 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-white/15 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/18"
                aria-label="Expand all sections"
                title="Expand all sections"
              >
                Expand
              </PressButton>
              <PressButton
                type="button"
                onClick={collapseAllSections}
                className="inline-flex h-10 items-center justify-center rounded-full border border-slate-200/90 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-white/15 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/18"
                aria-label="Collapse all sections"
                title="Collapse all sections"
              >
                Collapse
              </PressButton>
            </div>

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
        className="mx-auto mt-6 max-w-[1100px] space-y-7 md:mt-8 md:space-y-0"
      >
        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
            <StayvoProMessage text={error} />
          </div>
        ) : null}
        {success ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
            {success}
          </div>
        ) : null}
        {mode === 'create' ? (
          <div className="rounded-[20px] border border-brand/20 bg-amber-50/60 p-4 backdrop-blur-sm dark:border-brand/20 dark:bg-amber-950/20 md:rounded-2xl md:p-6">
            {/* Header */}
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/15 text-lg dark:bg-brand/20">
                ✨
              </span>
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Import from Airbnb
                </h2>
                <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
                  Paste your Airbnb listing URL — we&apos;ll auto-fill property name, host, address, house rules and more. Review before saving.
                </p>
              </div>
            </div>

            {/* URL input + button */}
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <input
                type="url"
                value={airbnbImportUrl}
                onChange={(e) => {
                  setAirbnbImportUrl(e.target.value);
                  setAirbnbImportError(null);
                }}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void onImportAirbnb(); } }}
                placeholder="https://www.airbnb.com/rooms/12345678"
                inputMode="url"
                autoComplete="off"
                disabled={airbnbImporting}
                className={`${stayvoInputPillClass} px-4 py-2.5 disabled:opacity-60`}
              />
              <PressButton
                type="button"
                disabled={airbnbImporting || !airbnbImportUrl.trim()}
                onClick={() => void onImportAirbnb()}
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-white shadow-md transition hover:opacity-90 disabled:opacity-50"
              >
                {airbnbImporting ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                    </svg>
                    Importing…
                  </>
                ) : 'Import'}
              </PressButton>
            </div>

            {/* Error */}
            {airbnbImportError ? (
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50/80 px-3 py-2 dark:border-rose-800/50 dark:bg-rose-950/30">
                <span className="mt-0.5 shrink-0 text-rose-500" aria-hidden>✕</span>
                <p className="text-sm text-rose-700 dark:text-rose-400">{airbnbImportError}</p>
              </div>
            ) : null}

            {/* Success result */}
            {airbnbImportSummary ? (
              <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-2.5 dark:border-emerald-800/50 dark:bg-emerald-950/30">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400" aria-hidden>✓</span>
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                    Import complete
                  </p>
                </div>
                <p className="mt-1 text-xs text-emerald-700/80 dark:text-emerald-400/80">
                  {airbnbImportSummary}
                </p>
                {airbnbImportNotes.filter((n) => !n.toLowerCase().startsWith('review')).length > 0 ? (
                  <ul className="mt-2 space-y-0.5">
                    {airbnbImportNotes
                      .filter((n) => !n.toLowerCase().startsWith('review'))
                      .map((note, idx) => (
                        <li key={idx} className="text-xs text-slate-500 dark:text-slate-400">
                          · {note}
                        </li>
                      ))}
                  </ul>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-col gap-7 md:flex-row md:items-start md:gap-x-10 lg:gap-x-12">
          {/* Left rail (desktop): hero — mirrors guest portal sticky column */}
          <div className="flex flex-col gap-7 md:sticky md:top-28 md:w-[40%] md:min-w-0 md:max-w-[440px] md:flex-shrink-0 md:self-start md:gap-6">
            {/* Hero Image */}
            <CollapsibleFormSection
              id="hero"
              title="Hero image"
              description="Shown at the top of the guest portal (same place as the live preview)."
              open={isSectionOpen('hero')}
              onToggle={toggleSection}
              className={stayvoFormSectionElevatedClass}
            >
              <GuestImageSlot
                propertyId={propertyId}
                slot="detail:0"
                value={heroImagePath}
                onChange={setHeroImagePath}
                allowVideo={false}
                compressImages={false}
                guestMediaPublicBase={guestMediaPublicBase}
              />
            </CollapsibleFormSection>
          </div>

          {/* Right column: all other fields */}
          <div className="flex min-w-0 flex-1 flex-col gap-7 md:gap-6">
        {/* Property Info */}
        <CollapsibleFormSection
          id="property-details"
          title="Property details"
          description="What guests need before arrival."
          open={isSectionOpen('property-details')}
          onToggle={toggleSection}
          className={stayvoFormSectionClass}
        >
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

          <div className="mb-4 rounded-2xl border border-white/50 bg-white/40 p-3 backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
            <div className="grid gap-3">
              <div className="min-w-0">
                <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Location group
                </label>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Which city or area this property belongs to on your dashboard.
                </p>
                <select
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  className={`mt-2 ${stayvoInputPillClass} font-medium`}
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
              <div className="min-w-0">
                <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Location name
                </label>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Shown on your dashboard (e.g. Aspen, Colorado).
                </p>
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  disabled={!locationId}
                  placeholder="e.g. Miami, Florida"
                  className={`mt-2 ${stayvoInputPillClass} font-medium`}
                />
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
                autoCapitalize="words"
                value={propertyName}
                onChange={(e) => setPropertyName(capitalizeWordStarts(e.target.value))}
                placeholder="Property name"
                className={`mt-1 min-h-[4.5rem] ${stayvoTextareaClass}`}
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
                type="text"
                autoCapitalize="words"
                value={internalName}
                onChange={(e) => setInternalName(capitalizeWordStarts(e.target.value))}
                className={`mt-1 ${stayvoInputPillClass}`}
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
                className={`mt-1 resize-none ${stayvoTextareaClass}`}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Google Maps URL
              </label>
              <input
                value={googleMapsUrl}
                onChange={(e) => setGoogleMapsUrl(e.target.value)}
                className={`mt-1 ${stayvoInputPillClass}`}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Waze URL
              </label>
              <input
                value={wazeUrl}
                onChange={(e) => setWazeUrl(e.target.value)}
                className={`mt-1 ${stayvoInputPillClass}`}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Parking details
              </label>
              <textarea
                rows={4}
                value={parkingDetails}
                onChange={(e) => setParkingDetails(e.target.value)}
                className={`mt-1 min-h-[5rem] ${stayvoTextareaClass}`}
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
                className={`mt-1 ${stayvoInputPillClass}`}
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
                className={`mt-1 ${stayvoInputPillClass}`}
                type="text"
                inputMode="text"
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
              />
            </div>
          </div>
        </CollapsibleFormSection>

        <CollapsibleFormSection
          id="checkin"
          title="Check-in instructions"
          description="Add step-by-step instructions for guests."
          open={isSectionOpen('checkin')}
          onToggle={toggleSection}
          className={stayvoFormSectionClass}
        >
          <div className="space-y-3">
            {checkInInstructions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-600 dark:border-white/15 dark:bg-white/5 dark:text-slate-400">
                No steps yet. Add your first step below.
              </div>
            ) : null}

            {checkInInstructions.map((s, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-white/50 bg-white/50 p-3 backdrop-blur-sm dark:border-white/8 dark:bg-white/5"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
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
                      className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-800/50 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-950/50"
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
                  className={`mt-2 resize-none ${stayvoTextareaClass}`}
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
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white/70 px-3 py-2 text-sm font-semibold text-slate-700 backdrop-blur-sm transition disabled:opacity-50 dark:border-white/15 dark:bg-white/8 dark:text-slate-200 dark:hover:bg-white/14"
            >
              + Add step
            </PressButton>
          </div>
        </CollapsibleFormSection>

        <CollapsibleFormSection
          id="house-rules"
          title="House rules"
          description="Add rules guests must follow."
          open={isSectionOpen('house-rules')}
          onToggle={toggleSection}
          className={stayvoFormSectionClass}
        >
          <div className="space-y-3">
            {houseRules.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-600 dark:border-white/15 dark:bg-white/5 dark:text-slate-400">
                No rules yet. Add a rule below.
              </div>
            ) : null}

            {houseRules.map((r, idx) => (
              <div
                key={idx}
                className="flex flex-col gap-2 rounded-2xl border border-white/50 bg-white/50 p-3 backdrop-blur-sm dark:border-white/8 dark:bg-white/5"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
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
                      className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-800/50 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-950/50"
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
                  className={stayvoInputPillClass}
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
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white/70 px-3 py-2 text-sm font-semibold text-slate-700 backdrop-blur-sm transition disabled:opacity-50 dark:border-white/15 dark:bg-white/8 dark:text-slate-200 dark:hover:bg-white/14"
            >
              + Add rule
            </PressButton>
          </div>
        </CollapsibleFormSection>

        <CollapsibleFormSection
          id="faq"
          title="FAQ"
          description="Add common guest questions and answers. Leave empty to hide this section."
          open={isSectionOpen('faq')}
          onToggle={toggleSection}
          className={stayvoFormSectionClass}
        >
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
                    className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-800/50 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-950/50"
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
                      className={`mt-1 ${stayvoInputPillClass}`}
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
                      className={`mt-1 resize-none ${stayvoTextareaClass}`}
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
              onClick={() => setFaqs((prev) => [...prev, { question: '', answer: '' }])}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white/70 px-3 py-2 text-sm font-semibold text-slate-700 backdrop-blur-sm transition dark:border-white/15 dark:bg-white/10 dark:text-slate-200"
            >
              + Add FAQ
            </PressButton>
          </div>
        </CollapsibleFormSection>

        <CollapsibleFormSection
          id="social-links"
          title="Social links"
          description="Optional. Shown as icons at the bottom of the guest page. Leave blank to hide a platform."
          open={isSectionOpen('social-links')}
          onToggle={toggleSection}
          className={stayvoFormSectionClass}
        >
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
                className={`mt-1 ${stayvoInputPillClass}`}
              />
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-500">
                Shown as a &quot;Booking Website&quot; button in the Your host block (hidden when blank).
              </p>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Airbnb listing URL
              </label>
              <input
                value={socialAirbnbUrl}
                onChange={(e) => setSocialAirbnbUrl(e.target.value)}
                placeholder="https://www.airbnb.com/rooms/..."
                inputMode="url"
                autoComplete="off"
                className={`mt-1 ${stayvoInputPillClass}`}
              />
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-500">
                Optional. Stored for reference and future imports.
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
                className={`mt-1 ${stayvoInputPillClass}`}
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
                className={`mt-1 ${stayvoInputPillClass}`}
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
                className={`mt-1 ${stayvoInputPillClass}`}
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
                className={`mt-1 ${stayvoInputPillClass}`}
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
                className={`mt-1 ${stayvoInputPillClass}`}
              />
            </div>
          </div>
        </CollapsibleFormSection>

        <CollapsibleFormSection
          id="custom-blocks"
          title="Custom block"
          description="Add custom sections shown on the guest page."
          open={isSectionOpen('custom-blocks')}
          onToggle={toggleSection}
          className={stayvoFormSectionClass}
        >
          <div className="space-y-3">
            {customDetails.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-600 dark:border-white/15 dark:bg-white/5 dark:text-slate-400">
                No custom blocks yet.
              </div>
            ) : null}

            {customDetails.map((d, idx) => (
              <div key={idx} className="rounded-2xl border border-white/50 bg-white/50 p-3 backdrop-blur-sm dark:border-white/8 dark:bg-white/5">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
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
                      className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-800/50 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-950/50"
                    >
                      Remove
                    </PressButton>
                  </div>
                </div>

                <div className="mt-3 grid gap-3">
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
                      className={`mt-1 ${stayvoInputPillClass}`}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Message
                    </label>
                    <textarea
                      rows={5}
                      value={d.message}
                      onChange={(e) => {
                        const v = e.target.value;
                        setCustomDetails((prev) =>
                          prev.map((it, i) =>
                            i === idx ? { ...it, message: v } : it
                          )
                        );
                      }}
                      className={`mt-1 min-h-[7.5rem] ${stayvoTextareaClass}`}
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
        </CollapsibleFormSection>

        <CollapsibleFormSection
          id="host-contact"
          title="Host contact"
          description="How guests reach you."
          open={isSectionOpen('host-contact')}
          onToggle={toggleSection}
          className={stayvoFormSectionClass}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Host name
              </label>
              <input
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                className={`mt-1 ${stayvoInputPillClass}`}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Call</label>
              <input
                value={hostWhatsappNumber}
                onChange={(e) => setHostWhatsappNumber(e.target.value)}
                className={`mt-1 ${stayvoInputPillClass}`}
                placeholder="+1 555 123 4567"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">WhatsApp</label>
              <input
                value={hostWhatsappChatNumber}
                onChange={(e) => setHostWhatsappChatNumber(e.target.value)}
                className={`mt-1 ${stayvoInputPillClass}`}
                placeholder="+1 555 987 6543"
              />
            </div>
          </div>
        </CollapsibleFormSection>

        {mode === 'edit' && propertyId ? (
          <CollapsibleFormSection
            id="ical-sync"
            title="OTA calendar sync"
            description="Paste your Airbnb, Booking.com, or VRBO iCal export URL. Stayvo Check-in checks for new bookings about every hour and creates or extends guest links from checkout dates."
            open={isSectionOpen('ical-sync')}
            onToggle={toggleSection}
            className={stayvoFormSectionClass}
          >
            <IcalFeedPanel propertyId={propertyId} embedded />
          </CollapsibleFormSection>
        ) : null}

        {mode === 'edit' && propertyId ? (
          <CollapsibleFormSection
            id="danger-zone"
            title="Danger zone"
            description="Permanently delete this property and all guest links created for it."
            open={isSectionOpen('danger-zone')}
            onToggle={toggleSection}
            titleClassName="text-base font-semibold text-rose-900 dark:text-rose-200"
            descriptionClassName="mt-1 text-sm text-rose-800/90 dark:text-rose-300"
            className="rounded-[20px] border border-rose-200 bg-rose-50/40 p-4 backdrop-blur-sm md:rounded-2xl md:p-6 md:shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:border-rose-500/25 dark:bg-rose-950/50 dark:ring-1 dark:ring-inset dark:ring-rose-400/10"
          >
            <PressButton
              type="button"
              onClick={onDeleteProperty}
              disabled={submitting || deleting}
              className="inline-flex items-center justify-center rounded-full border border-rose-300 bg-rose-50/70 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60 dark:border-rose-500/35 dark:bg-rose-900/70 dark:text-rose-100 dark:hover:bg-rose-800/80"
            >
              {deleting ? 'Deleting…' : 'Delete property'}
            </PressButton>
          </CollapsibleFormSection>
        ) : null}

          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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

