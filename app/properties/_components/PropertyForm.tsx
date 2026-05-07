'use client';

import Link from 'next/link';
import { createPortal } from 'react-dom';
import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  closestCenter,
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
import { BASE_SECTION_KEYS } from '@/lib/guest-layout';
import type {
  CustomDetailInput,
  HouseRuleInput,
  GuidebookTipInput,
  FaqInput,
  CheckInStepInput,
  PropertyFormInput,
} from '@/app/actions/properties';
import {
  createProperty,
  deleteProperty,
  updateProperty,
} from '@/app/actions/properties';
import GuestImageSlot from '@/app/properties/_components/GuestImageSlot';

type PropertyFormProps = {
  mode: 'create' | 'edit';
  propertyId?: string;
  /** Host’s locations (for grouping on dashboard). */
  locations: Array<{ id: string; name: string }>;
  initialValues?: Partial<PropertyFormInput>;
};

function ensureString(v: any) {
  return typeof v === 'string' ? v : '';
}

const SECTION_LABELS: Record<string, string> = {
  address: 'Address',
  parking: 'Parking',
  checkin: 'Check-in',
  wifi: 'Wi-Fi',
  faq: 'FAQ',
  rules: 'House rules',
  guidebook: 'Guidebook',
  host: 'Host contact',
};

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
      className="flex touch-none items-center gap-3 rounded-2xl border border-white/50 bg-white/50 px-3 py-2.5 backdrop-blur-sm"
    >
      <button
        type="button"
        className="select-none text-slate-400"
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
      <span className="text-sm font-medium text-slate-800">{label}</span>
    </li>
  );
}

export default function PropertyForm({
  mode,
  propertyId,
  locations,
  initialValues,
}: PropertyFormProps) {
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
      guidebookTips: [],
      faqs: [],
      customDetails: [],
      guestSectionOrder: [...BASE_SECTION_KEYS],
      hostName: '',
      hostWhatsappNumber: '',
      hostWhatsappMessage: '',
      isLive: false,
      locationId: '',
      socialFacebookUrl: '',
      socialInstagramUrl: '',
      socialXUrl: '',
      socialTiktokUrl: '',
      socialYoutubeUrl: '',
      socialAirbnbUrl: '',
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
  const [guidebookTips, setGuidebookTips] = useState<GuidebookTipInput[]>(
    defaults.guidebookTips?.length ? (defaults.guidebookTips as any) : []
  );
  const [faqs, setFaqs] = useState<FaqInput[]>(
    defaults.faqs?.length ? (defaults.faqs as any) : []
  );
  const [customDetails, setCustomDetails] = useState<CustomDetailInput[]>(
    defaults.customDetails?.length ? (defaults.customDetails as any) : []
  );
  const [guestSectionOrder, setGuestSectionOrder] = useState<string[]>(
    Array.isArray(defaults.guestSectionOrder)
      ? (defaults.guestSectionOrder as string[])
      : [...BASE_SECTION_KEYS]
  );
  const [sectionOrderOpen, setSectionOrderOpen] = useState(false);

  const sectionOrderSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } })
  );

  function onSectionDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setGuestSectionOrder((prev) => {
      const oldIdx = prev.indexOf(active.id as string);
      const newIdx = prev.indexOf(over.id as string);
      if (oldIdx < 0 || newIdx < 0) return prev;
      return arrayMove(prev, oldIdx, newIdx);
    });
  }

  const [hostName, setHostName] = useState(ensureString(defaults.hostName));
  const [hostWhatsappNumber, setHostWhatsappNumber] = useState(
    ensureString(defaults.hostWhatsappNumber)
  );
  const [hostWhatsappMessage, setHostWhatsappMessage] = useState(
    ensureString(defaults.hostWhatsappMessage)
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

  const [locationId, setLocationId] = useState(
    ensureString(defaults.locationId) ||
      (locations[0]?.id ?? '')
  );

  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      const input: PropertyFormInput = {
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
        guidebookTips,
        faqs,
        customDetails,
        guestSectionOrder,
        hostName,
        hostWhatsappNumber,
        hostWhatsappMessage,
        isLive,
        locationId,
        heroImagePath,
        socialFacebookUrl,
        socialInstagramUrl,
        socialXUrl,
        socialTiktokUrl,
        socialYoutubeUrl,
        socialAirbnbUrl,
      };

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
        <div className="mx-auto flex w-full max-w-5xl items-center gap-3">
          <button
            type="button"
            onClick={() => router.push(returnTo)}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
            aria-label="Back"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden>
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 0 1 0 1.414L9.414 10l3.293 3.293a1 1 0 0 1-1.414 1.414l-4-4a1 1 0 0 1 0-1.414l4-4a1 1 0 0 1 1.414 0Z" clipRule="evenodd" />
            </svg>
          </button>
          <h1 className="flex-1 text-xl font-semibold tracking-tight text-slate-900">
            {mode === 'create' ? 'Add property' : 'Edit'}
          </h1>
          {mode === 'edit' ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSectionOrderOpen(true)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
                aria-label="Reorder sections"
                title="Reorder sections"
              >
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden>
                  <path fillRule="evenodd" clipRule="evenodd" d="M10 2.5a.75.75 0 0 1 .57.26l2.5 3a.75.75 0 1 1-1.14.98L10 4.84l-1.93 2.9a.75.75 0 1 1-1.14-.98l2.5-3A.75.75 0 0 1 10 2.5ZM3.75 8.5a.75.75 0 0 1 .75-.75h11a.75.75 0 0 1 0 1.5h-11a.75.75 0 0 1-.75-.75ZM3.75 11.5a.75.75 0 0 1 .75-.75h11a.75.75 0 0 1 0 1.5h-11a.75.75 0 0 1-.75-.75ZM7.43 14.26a.75.75 0 0 1 1.14-.98L10 15.16l1.93-1.88a.75.75 0 1 1 1.14.98l-2.5 2.24a.75.75 0 0 1-1.14 0l-2.5-2.24Z" />
                </svg>
              </button>
              {propertyId ? (
                <Link
                  href={`/properties/${propertyId}/preview`}
                  prefetch={false}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
                  aria-label="Preview guest view"
                  title="Preview guest view"
                >
                  <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden>
                    <path d="M10 3C5.5 3 2 10 2 10s3.5 7 8 7 8-7 8-7-3.5-7-8-7Zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm0-6a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" />
                  </svg>
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>
      </header>

      {/* Section order modal */}
      {sectionOrderOpen && typeof document !== 'undefined'
        ? createPortal(
            <div className="fixed inset-0 z-[70] flex items-center justify-center">
              <button
                type="button"
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                aria-label="Close"
                onClick={() => setSectionOrderOpen(false)}
              />
              <div className="glass relative w-[calc(100%-2rem)] max-w-sm rounded-[20px] p-5">
                <h2 className="text-base font-semibold text-slate-900">Reorder sections</h2>
                <p className="mt-1 text-xs text-slate-500">Drag to change the order shown to guests.</p>
                <DndContext
                  sensors={sectionOrderSensors}
                  collisionDetection={closestCenter}
                  onDragEnd={onSectionDragEnd}
                >
                  <SortableContext items={guestSectionOrder} strategy={verticalListSortingStrategy}>
                    <ul className="mt-4 space-y-2">
                      {guestSectionOrder.map((key) => (
                        <SortableSectionRow key={key} id={key} />
                      ))}
                    </ul>
                  </SortableContext>
                </DndContext>
                <button
                  type="button"
                  onClick={() => setSectionOrderOpen(false)}
                  className="mt-4 w-full rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white shadow-md hover:opacity-90"
                >
                  Done
                </button>
              </div>
            </div>,
            document.body
          )
        : null}

      <form onSubmit={onSubmit} className="mt-6 space-y-7">
        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        ) : null}
        {success ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            {success}
          </div>
        ) : null}

        {/* Hero Image */}
        <section className="glass rounded-[20px] p-4">
          <div className="mb-3">
            <h2 className="text-base font-semibold">Hero image</h2>
            <p className="mt-1 text-sm text-slate-600">
              Displayed as the full-width background of the guest welcome header.
            </p>
          </div>
          <GuestImageSlot
            propertyId={propertyId}
            slot="detail:0"
            value={heroImagePath}
            onChange={setHeroImagePath}
          />
        </section>

        {/* Property Info */}
        <section className="glass rounded-[20px] p-4">
          <div className="mb-4">
            <h2 className="text-base font-semibold">Property details</h2>
            <p className="mt-1 text-sm text-slate-600">
              What guests need before arrival.
            </p>
          </div>

          <div className="mb-4 flex items-center justify-between gap-4 rounded-2xl border border-white/50 bg-white/40 p-3 backdrop-blur-sm">
            <div>
              <div className="text-sm font-semibold text-slate-800">Status</div>
            </div>
            <label className="inline-flex items-center gap-3">
              <span className="text-sm font-semibold text-slate-700">
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

          <div className="mb-4 rounded-2xl border border-white/50 bg-white/40 p-3 backdrop-blur-sm">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="min-w-0 flex-1">
                <label className="text-sm font-semibold text-slate-800">Location</label>
                <select
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  className="mt-2 w-full max-w-md rounded-full border border-slate-200 bg-white/70 px-3 py-2 text-sm outline-none ring-brand/30 focus:ring-2"
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
              <label className="text-sm font-medium text-slate-700">
                Property name
              </label>
              <p className="mt-1 text-xs text-slate-500">Guest will see this.</p>
              <input
                required
                value={propertyName}
                onChange={(e) => setPropertyName(e.target.value)}
                className="mt-1 w-full rounded-full border border-slate-200 bg-white/70 px-3 py-2 text-sm outline-none ring-brand/30 focus:ring-2"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-slate-700">
                Internal name
              </label>
              <p className="mt-1 text-xs text-slate-500">
                For internal record only.
              </p>
              <input
                value={internalName}
                onChange={(e) => setInternalName(e.target.value)}
                className="mt-1 w-full rounded-full border border-slate-200 bg-white/70 px-3 py-2 text-sm outline-none ring-brand/30 focus:ring-2"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-slate-700">
                Full address
              </label>
              <textarea
                rows={3}
                value={fullAddress}
                onChange={(e) => setFullAddress(e.target.value)}
                className="mt-1 w-full resize-none rounded-full border border-slate-200 bg-white/70 px-3 py-2 text-sm outline-none ring-brand/30 focus:ring-2"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Google Maps URL
              </label>
              <input
                value={googleMapsUrl}
                onChange={(e) => setGoogleMapsUrl(e.target.value)}
                className="mt-1 w-full rounded-full border border-slate-200 bg-white/70 px-3 py-2 text-sm outline-none ring-brand/30 focus:ring-2"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">
                Waze URL
              </label>
              <input
                value={wazeUrl}
                onChange={(e) => setWazeUrl(e.target.value)}
                className="mt-1 w-full rounded-full border border-slate-200 bg-white/70 px-3 py-2 text-sm outline-none ring-brand/30 focus:ring-2"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-slate-700">
                Parking details
              </label>
              <input
                value={parkingDetails}
                onChange={(e) => setParkingDetails(e.target.value)}
                className="mt-1 w-full rounded-full border border-slate-200 bg-white/70 px-3 py-2 text-sm outline-none ring-brand/30 focus:ring-2"
              />
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700">
                Wifi network name
              </label>
              <input
                value={wifiNetworkName}
                onChange={(e) => setWifiNetworkName(e.target.value)}
                className="mt-1 w-full rounded-full border border-slate-200 bg-white/70 px-3 py-2 text-sm outline-none ring-brand/30 focus:ring-2"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">
                Wifi password
              </label>
              <input
                value={wifiPassword}
                onChange={(e) => setWifiPassword(e.target.value)}
                className="mt-1 w-full rounded-full border border-slate-200 bg-white/70 px-3 py-2 text-sm outline-none ring-brand/30 focus:ring-2"
                type="password"
              />
            </div>
          </div>

        </section>

        {/* Check-in steps */}
        <section className="glass rounded-[20px] p-4">
          <div className="mb-4">
            <h2 className="text-base font-semibold">Check-in instructions</h2>
            <p className="mt-1 text-sm text-slate-600">
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
                className="rounded-2xl border border-white/50 bg-white/50 p-3 backdrop-blur-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-semibold text-slate-500">
                    Step {idx + 1}
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600">
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
                    <button
                      type="button"
                      onClick={() =>
                        setCheckInInstructions((prev) =>
                          prev.filter((_, i) => i !== idx)
                        )
                      }
                      className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                    >
                      Remove
                    </button>
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
                  className="mt-2 w-full resize-none rounded-full border border-slate-200 bg-white/70 px-3 py-2 text-sm outline-none ring-brand/30 focus:ring-2"
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
                />
              </div>
            ))}
          </div>

          <div className="mt-3">
            <button
              type="button"
              onClick={() =>
                setCheckInInstructions((prev) => [
                  ...prev,
                  { instruction: '', isDisplayed: true, guestImagePath: '' },
                ])
              }
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white/70 px-3 py-2 text-sm font-semibold text-slate-700 backdrop-blur-sm transition"
            >
              + Add step
            </button>
          </div>
        </section>

        {/* House rules */}
        <section className="glass rounded-[20px] p-4">
          <div className="mb-4">
            <h2 className="text-base font-semibold">House rules</h2>
            <p className="mt-1 text-sm text-slate-600">
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
                className="flex flex-col gap-2 rounded-2xl border border-white/50 bg-white/50 p-3 backdrop-blur-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-semibold text-slate-500">
                    Rule {idx + 1}
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600">
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
                    <button
                      type="button"
                      onClick={() =>
                        setHouseRules((prev) =>
                          prev.filter((_, i) => i !== idx)
                        )
                      }
                      className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                    >
                      Remove
                    </button>
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
                  className="w-full rounded-full border border-slate-200 bg-white/70 px-3 py-2 text-sm outline-none ring-brand/30 focus:ring-2"
                />
              </div>
            ))}
          </div>

          <div className="mt-3">
            <button
              type="button"
              onClick={() =>
                setHouseRules((prev) => [...prev, { ruleText: '', isDisplayed: true }])
              }
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white/70 px-3 py-2 text-sm font-semibold text-slate-700 backdrop-blur-sm transition"
            >
              + Add rule
            </button>
          </div>
        </section>

        {/* Guidebook tips */}
        <section className="glass rounded-[20px] p-4">
          <div className="mb-4">
            <h2 className="text-base font-semibold">Guidebook tips</h2>
            <p className="mt-1 text-sm text-slate-600">
              Short labeled tips with descriptions.
            </p>
          </div>

          <div className="space-y-3">
            {guidebookTips.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-600">
                No tips yet. Add your first tip below.
              </div>
            ) : null}

            {guidebookTips.map((t, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-white/50 bg-white/50 p-3 backdrop-blur-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-semibold text-slate-500">
                    Tip {idx + 1}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setGuidebookTips((prev) =>
                        prev.filter((_, i) => i !== idx)
                      )
                    }
                    className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                  >
                    Remove
                  </button>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <label className="text-xs font-semibold text-slate-600">
                      Label
                    </label>
                    <input
                      value={t.label}
                      onChange={(e) => {
                        const v = e.target.value;
                        setGuidebookTips((prev) =>
                          prev.map((it, i) =>
                            i === idx ? { ...it, label: v } : it
                          )
                        );
                      }}
                      className="mt-1 w-full rounded-full border border-slate-200 bg-white/70 px-3 py-2 text-sm outline-none ring-brand/30 focus:ring-2"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="text-xs font-semibold text-slate-600">
                      Description
                    </label>
                    <input
                      value={t.description}
                      onChange={(e) => {
                        const v = e.target.value;
                        setGuidebookTips((prev) =>
                          prev.map((it, i) =>
                            i === idx
                              ? { ...it, description: v }
                              : it
                          )
                        );
                      }}
                      className="mt-1 w-full rounded-full border border-slate-200 bg-white/70 px-3 py-2 text-sm outline-none ring-brand/30 focus:ring-2"
                    />
                  </div>
                </div>
                <GuestImageSlot
                  propertyId={propertyId}
                  slot={`tip:${idx}`}
                  value={t.guestImagePath ?? ''}
                  onChange={(v) =>
                    setGuidebookTips((prev) =>
                      prev.map((it, i) =>
                        i === idx ? { ...it, guestImagePath: v } : it
                      )
                    )
                  }
                />
              </div>
            ))}
          </div>

          <div className="mt-3">
            <button
              type="button"
              onClick={() =>
                setGuidebookTips((prev) => [
                  ...prev,
                  { label: '', description: '', guestImagePath: '' },
                ])
              }
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white/70 px-3 py-2 text-sm font-semibold text-slate-700 backdrop-blur-sm transition"
            >
              + Add tip
            </button>
          </div>
        </section>

        {/* FAQ */}
        <section className="glass rounded-[20px] p-4">
          <div className="mb-4">
            <h2 className="text-base font-semibold">FAQ</h2>
            <p className="mt-1 text-sm text-slate-600">
              Add common guest questions and answers. Leave empty to hide this section.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-600">
                No FAQ entries yet.
              </div>
            ) : null}

            {faqs.map((f, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-white/50 bg-white/50 p-3 backdrop-blur-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-semibold text-slate-500">
                    FAQ {idx + 1}
                  </div>
                  <button
                    type="button"
                    onClick={() => setFaqs((prev) => prev.filter((_, i) => i !== idx))}
                    className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                  >
                    Remove
                  </button>
                </div>

                <div className="mt-3 grid gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600">
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
                      className="mt-1 w-full rounded-full border border-slate-200 bg-white/70 px-3 py-2 text-sm outline-none ring-brand/30 focus:ring-2"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600">
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
                      className="mt-1 w-full resize-none rounded-2xl border border-slate-200 bg-white/70 px-3 py-2 text-sm outline-none ring-brand/30 focus:ring-2"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3">
            <button
              type="button"
              onClick={() =>
                setFaqs((prev) => [...prev, { question: '', answer: '' }])
              }
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white/70 px-3 py-2 text-sm font-semibold text-slate-700 backdrop-blur-sm transition"
            >
              + Add FAQ
            </button>
          </div>
        </section>

        {/* Social links (guest page footer) */}
        <section className="glass rounded-[20px] p-4">
          <div className="mb-4">
            <h2 className="text-base font-semibold">Social links</h2>
            <p className="mt-1 text-sm text-slate-600">
              Optional. Shown as icons at the bottom of the guest page. Leave blank to hide a
              platform.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-slate-600">Instagram</label>
              <input
                value={socialInstagramUrl}
                onChange={(e) => setSocialInstagramUrl(e.target.value)}
                placeholder="https://instagram.com/yourhandle"
                inputMode="url"
                autoComplete="off"
                className="mt-1 w-full rounded-full border border-slate-200 bg-white/70 px-3 py-2 text-sm outline-none ring-brand/30 focus:ring-2"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Facebook</label>
              <input
                value={socialFacebookUrl}
                onChange={(e) => setSocialFacebookUrl(e.target.value)}
                placeholder="https://facebook.com/..."
                inputMode="url"
                autoComplete="off"
                className="mt-1 w-full rounded-full border border-slate-200 bg-white/70 px-3 py-2 text-sm outline-none ring-brand/30 focus:ring-2"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Airbnb listing</label>
              <input
                value={socialAirbnbUrl}
                onChange={(e) => setSocialAirbnbUrl(e.target.value)}
                placeholder="https://airbnb.com/rooms/..."
                inputMode="url"
                autoComplete="off"
                className="mt-1 w-full rounded-full border border-slate-200 bg-white/70 px-3 py-2 text-sm outline-none ring-brand/30 focus:ring-2"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">TikTok</label>
              <input
                value={socialTiktokUrl}
                onChange={(e) => setSocialTiktokUrl(e.target.value)}
                placeholder="https://tiktok.com/@..."
                inputMode="url"
                autoComplete="off"
                className="mt-1 w-full rounded-full border border-slate-200 bg-white/70 px-3 py-2 text-sm outline-none ring-brand/30 focus:ring-2"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">YouTube</label>
              <input
                value={socialYoutubeUrl}
                onChange={(e) => setSocialYoutubeUrl(e.target.value)}
                placeholder="https://youtube.com/@..."
                inputMode="url"
                autoComplete="off"
                className="mt-1 w-full rounded-full border border-slate-200 bg-white/70 px-3 py-2 text-sm outline-none ring-brand/30 focus:ring-2"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">X</label>
              <input
                value={socialXUrl}
                onChange={(e) => setSocialXUrl(e.target.value)}
                placeholder="https://x.com/..."
                inputMode="url"
                autoComplete="off"
                className="mt-1 w-full rounded-full border border-slate-200 bg-white/70 px-3 py-2 text-sm outline-none ring-brand/30 focus:ring-2"
              />
            </div>
          </div>
        </section>

        {/* Custom details */}
        <section className="glass rounded-[20px] p-4">
          <div className="mb-4">
            <h2 className="text-base font-semibold">Extra details</h2>
            <p className="mt-1 text-sm text-slate-600">
              Add custom info boxes shown in guest preview.
            </p>
          </div>

          <div className="space-y-3">
            {customDetails.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-600">
                No extra detail boxes yet.
              </div>
            ) : null}

            {customDetails.map((d, idx) => (
              <div key={idx} className="rounded-2xl border border-white/50 bg-white/50 p-3 backdrop-blur-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-semibold text-slate-500">
                    Detail box {idx + 1}
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600">
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
                    <button
                      type="button"
                      onClick={() =>
                        setCustomDetails((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-600">
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
                      className="mt-1 w-full rounded-full border border-slate-200 bg-white/70 px-3 py-2 text-sm outline-none ring-brand/30 focus:ring-2"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600">
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
                      className="mt-1 w-full rounded-full border border-slate-200 bg-white/70 px-3 py-2 text-sm outline-none ring-brand/30 focus:ring-2"
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
                />
              </div>
            ))}
          </div>

          <div className="mt-3">
            <button
              type="button"
              onClick={() =>
                setCustomDetails((prev) => [
                  ...prev,
                  { title: '', message: '', isDisplayed: true, guestImagePath: '' },
                ])
              }
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white/70 px-3 py-2 text-sm font-semibold text-slate-700 backdrop-blur-sm transition"
            >
              + Add details
            </button>
          </div>
        </section>

        {/* Host Info */}
        <section className="glass rounded-[20px] p-4">
          <div className="mb-4">
            <h2 className="text-base font-semibold">Host contact</h2>
            <p className="mt-1 text-sm text-slate-600">How guests reach you.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700">
                Host name
              </label>
              <input
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                className="mt-1 w-full rounded-full border border-slate-200 bg-white/70 px-3 py-2 text-sm outline-none ring-brand/30 focus:ring-2"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">
                Host WhatsApp number
              </label>
              <input
                value={hostWhatsappNumber}
                onChange={(e) => setHostWhatsappNumber(e.target.value)}
                className="mt-1 w-full rounded-full border border-slate-200 bg-white/70 px-3 py-2 text-sm outline-none ring-brand/30 focus:ring-2"
                placeholder="+1 555 123 4567"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-slate-700">
                Pre-fileld message (optional)
              </label>
              <textarea
                rows={3}
                value={hostWhatsappMessage}
                onChange={(e) => setHostWhatsappMessage(e.target.value)}
                className="mt-1 w-full resize-none rounded-full border border-slate-200 bg-white/70 px-3 py-2 text-sm outline-none ring-brand/30 focus:ring-2"
              />
            </div>
          </div>
        </section>

        {mode === 'edit' && propertyId ? (
          <section className="rounded-[20px] border border-rose-200 bg-rose-50/40 p-4 backdrop-blur-sm">
            <h2 className="text-base font-semibold text-rose-900">Danger zone</h2>
            <p className="mt-1 text-sm text-rose-800/90">
              Permanently delete this property and all guest links created for it.
            </p>
            <button
              type="button"
              onClick={onDeleteProperty}
              disabled={submitting || deleting}
              className="mt-3 inline-flex items-center justify-center rounded-full border border-rose-300 bg-rose-50/70 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
            >
              {deleting ? 'Deleting…' : 'Delete property'}
            </button>
          </section>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="submit"
            disabled={submitting || deleting}
            className="inline-flex items-center justify-center rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-90 disabled:opacity-60"
          >
            {submitting
              ? 'Saving...'
              : mode === 'create'
                ? 'Create property'
                : 'Save changes'}
          </button>
        </div>
      </form>
    </main>
  );
}

