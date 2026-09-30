'use client';

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
import { arrayMove } from '@dnd-kit/sortable';
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
import PropertyEditorShell from '@/app/properties/_components/property-editor/PropertyEditorShell';
import PropertyEditorHeader from '@/app/properties/_components/property-editor/PropertyEditorHeader';
import PropertyEditorNav from '@/app/properties/_components/property-editor/PropertyEditorNav';
import PropertyEditorMobileNav from '@/app/properties/_components/property-editor/PropertyEditorMobileNav';
import PropertyEditorActiveModule from '@/app/properties/_components/property-editor/PropertyEditorActiveModule';
import { usePropertyEditorModule } from '@/app/properties/_components/property-editor/usePropertyEditorModule';
import type { PropertyFormModuleSharedProps } from '@/app/properties/_components/property-editor/property-form-types';
import { CHECKIN_ALLOW_GUEST_VIDEO, maxCustomBlocksForCheckIn } from '@/lib/host-tier';

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
  useEffect(() => {
    setGuestSectionOrder((prev) =>
      normalizeSectionOrder(prev, customInputsToOrderStubs(customDetails))
    );
  }, [customDetails]);

  const sectionOrderStubs = useMemo(
    () => customInputsToOrderStubs(customDetails),
    [customDetails]
  );

  const middleSectionKeys = useMemo(
    () => getMiddleSectionKeysFromOrder(guestSectionOrder, sectionOrderStubs),
    [guestSectionOrder, sectionOrderStubs]
  );

  const sectionOrderSensors = useGuestSectionOrderSensors();
  const { activeModule, setActiveModule, mobileNavOpen, setMobileNavOpen } =
    usePropertyEditorModule(propertyId, mode);

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


  const pageTitle = mode === 'create' ? 'Add property' : 'Edit property';

  const moduleProps: PropertyFormModuleSharedProps = {
    mode,
    propertyId,
    locations,
    initialValues,
    guestMediaPublicBase,
    customBlocksCap,
    mediaAllowVideo,
    formRef,
    error,
    success,
    submitting,
    deleting,
    propertyName,
    setPropertyName,
    internalName,
    setInternalName,
    fullAddress,
    setFullAddress,
    googleMapsUrl,
    setGoogleMapsUrl,
    wazeUrl,
    setWazeUrl,
    parkingDetails,
    setParkingDetails,
    wifiNetworkName,
    setWifiNetworkName,
    wifiPassword,
    setWifiPassword,
    checkInInstructions,
    setCheckInInstructions,
    houseRules,
    setHouseRules,
    faqs,
    setFaqs,
    customDetails,
    setCustomDetails,
    guestSectionOrder,
    setGuestSectionOrder,
    middleSectionKeys,
    sectionOrderSensors,
    onSectionDragEnd,
    hostName,
    setHostName,
    hostWhatsappNumber,
    setHostWhatsappNumber,
    hostWhatsappChatNumber,
    setHostWhatsappChatNumber,
    isLive,
    setIsLive,
    heroImagePath,
    setHeroImagePath,
    socialFacebookUrl,
    setSocialFacebookUrl,
    socialInstagramUrl,
    setSocialInstagramUrl,
    socialXUrl,
    setSocialXUrl,
    socialTiktokUrl,
    setSocialTiktokUrl,
    socialYoutubeUrl,
    setSocialYoutubeUrl,
    socialAirbnbUrl,
    setSocialAirbnbUrl,
    socialDirectBookingUrl,
    setSocialDirectBookingUrl,
    airbnbImportUrl,
    setAirbnbImportUrl,
    airbnbImporting,
    airbnbImportError,
    airbnbImportNotes,
    airbnbImportSummary,
    onImportAirbnb,
    locationId,
    setLocationId,
    locationName,
    setLocationName,
    onDeleteProperty,
    checkinStepsLimit: CHECKIN_STEPS_LIMIT,
  };

  return (
    <PropertyEditorShell>
      <PropertyEditorHeader
        mode={mode}
        propertyId={propertyId}
        title={pageTitle}
        submitting={submitting}
        deleting={deleting}
        onBack={navigateBack}
        onSave={() => formRef.current?.requestSubmit()}
        onOpenModulePicker={() => setMobileNavOpen(true)}
        onSelectModule={setActiveModule}
      />
      <PropertyEditorMobileNav
        open={mobileNavOpen}
        onOpenChange={setMobileNavOpen}
        mode={mode}
        activeModule={activeModule}
        onSelect={setActiveModule}
      />
      <form
        ref={formRef}
        id="stayvo-property-form"
        onSubmit={onSubmit}
        autoComplete="off"
        className="mx-auto w-full max-w-6xl px-4 lg:px-6"
      >
        {error ? (
          <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : null}
        {success ? (
          <div className="mb-4 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-800 dark:text-emerald-200">
            {success}
          </div>
        ) : null}
        <div className="flex flex-col lg:flex-row">
          <PropertyEditorNav
            mode={mode}
            activeModule={activeModule}
            onSelect={setActiveModule}
          />
          <div className="min-w-0 flex-1 pb-6 pt-4 lg:pl-6 lg:pt-6">
            <PropertyEditorActiveModule activeModule={activeModule} {...moduleProps} />
          </div>
        </div>
      </form>
    </PropertyEditorShell>
  );
}
