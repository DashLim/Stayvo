'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BASE_SECTION_KEYS } from '@/lib/guest-layout';
import type {
  CustomDetailInput,
  HouseRuleInput,
  GuidebookTipInput,
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
  initialValues?: Partial<PropertyFormInput>;
};

function ensureString(v: any) {
  return typeof v === 'string' ? v : '';
}

export default function PropertyForm({
  mode,
  propertyId,
  initialValues,
}: PropertyFormProps) {
  const router = useRouter();

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
      customDetails: [],
      guestSectionOrder: [...BASE_SECTION_KEYS],
      hostName: '',
      hostWhatsappNumber: '',
      hostWhatsappMessage: '',
      isLive: false,
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
  const [customDetails, setCustomDetails] = useState<CustomDetailInput[]>(
    defaults.customDetails?.length ? (defaults.customDetails as any) : []
  );
  const [guestSectionOrder] = useState<string[]>(
    Array.isArray(defaults.guestSectionOrder)
      ? (defaults.guestSectionOrder as string[])
      : [...BASE_SECTION_KEYS]
  );

  const [hostName, setHostName] = useState(ensureString(defaults.hostName));
  const [hostWhatsappNumber, setHostWhatsappNumber] = useState(
    ensureString(defaults.hostWhatsappNumber)
  );
  const [hostWhatsappMessage, setHostWhatsappMessage] = useState(
    ensureString(defaults.hostWhatsappMessage)
  );

  const [isLive, setIsLive] = useState(Boolean(defaults.isLive));

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
        customDetails,
        guestSectionOrder,
        hostName,
        hostWhatsappNumber,
        hostWhatsappMessage,
        isLive,
      };

      if (mode === 'create') {
        const res = await createProperty(input);
        if (!res.ok) throw new Error(res.error);
        setSuccess('Property created!');
        router.push(`/properties/${res.propertyId}/edit`);
        return;
      }

      const res = await updateProperty(propertyId!, input);
      if (!res.ok) throw new Error(res.error);
      setSuccess('Saved!');
      router.push('/dashboard');
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
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.message ?? 'Unable to delete property.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <main className="py-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {mode === 'create' ? 'Add property' : 'Edit property'}
          </h1>
        </div>
        <div className="flex gap-2">
          {mode === 'edit' && propertyId ? (
            <button
              type="button"
              onClick={() => router.push(`/properties/${propertyId}/preview`)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Preview guest view
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </div>

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

        {/* Property Info */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4">
            <h2 className="text-base font-semibold">Property details</h2>
            <p className="mt-1 text-sm text-slate-600">
              What guests need before arrival.
            </p>
          </div>

          <div className="mb-4 flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-sm font-semibold text-slate-800">Status</div>
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
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand/30 focus:ring-2"
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
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand/30 focus:ring-2"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-slate-700">
                Full address
              </label>
              <textarea
                required
                rows={3}
                value={fullAddress}
                onChange={(e) => setFullAddress(e.target.value)}
                className="mt-1 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand/30 focus:ring-2"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Google Maps URL
              </label>
              <input
                value={googleMapsUrl}
                onChange={(e) => setGoogleMapsUrl(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand/30 focus:ring-2"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">
                Waze URL
              </label>
              <input
                value={wazeUrl}
                onChange={(e) => setWazeUrl(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand/30 focus:ring-2"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-slate-700">
                Parking details
              </label>
              <input
                value={parkingDetails}
                onChange={(e) => setParkingDetails(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand/30 focus:ring-2"
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
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand/30 focus:ring-2"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">
                Wifi password
              </label>
              <input
                value={wifiPassword}
                onChange={(e) => setWifiPassword(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand/30 focus:ring-2"
                type="password"
              />
            </div>
          </div>

        </section>

        {/* Check-in steps */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
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
                className="rounded-xl border border-slate-200 bg-white p-3"
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
                  className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand/30 focus:ring-2"
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
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              + Add step
            </button>
          </div>
        </section>

        {/* House rules */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
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
                className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3"
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
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand/30 focus:ring-2"
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
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              + Add rule
            </button>
          </div>
        </section>

        {/* Guidebook tips */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
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
                className="rounded-xl border border-slate-200 bg-white p-3"
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
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand/30 focus:ring-2"
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
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand/30 focus:ring-2"
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
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              + Add tip
            </button>
          </div>
        </section>

        {/* Custom details */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
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
              <div key={idx} className="rounded-xl border border-slate-200 bg-white p-3">
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
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand/30 focus:ring-2"
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
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand/30 focus:ring-2"
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
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              + Add details
            </button>
          </div>
        </section>

        {/* Host Info */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
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
                required
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand/30 focus:ring-2"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">
                Host WhatsApp number
              </label>
              <input
                required
                value={hostWhatsappNumber}
                onChange={(e) => setHostWhatsappNumber(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand/30 focus:ring-2"
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
                className="mt-1 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand/30 focus:ring-2"
              />
            </div>
          </div>
        </section>

        {mode === 'edit' && propertyId ? (
          <section className="rounded-2xl border border-rose-200 bg-rose-50/40 p-4 shadow-sm">
            <h2 className="text-base font-semibold text-rose-900">Danger zone</h2>
            <p className="mt-1 text-sm text-rose-800/90">
              Permanently delete this property and all guest links created for it.
            </p>
            <button
              type="button"
              onClick={onDeleteProperty}
              disabled={submitting || deleting}
              className="mt-3 inline-flex items-center justify-center rounded-xl border border-rose-300 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-60"
            >
              {deleting ? 'Deleting…' : 'Delete property'}
            </button>
          </section>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="submit"
            disabled={submitting || deleting}
            className="inline-flex items-center justify-center rounded-xl bg-brand px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:opacity-60"
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

