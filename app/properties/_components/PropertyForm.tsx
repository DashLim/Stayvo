'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type {
  HouseRuleInput,
  GuidebookTipInput,
  CheckInStepInput,
  PropertyFormInput,
} from '@/app/actions/properties';
import { createProperty, updateProperty } from '@/app/actions/properties';

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
      fullAddress: '',
      city: '',
      state: '',
      googleMapsUrl: '',
      wazeUrl: '',
      parkingDetails: '',
      wifiNetworkName: '',
      wifiPassword: '',
      checkInInstructions: [],
      houseRules: [],
      guidebookTips: [],
      hostName: '',
      hostWhatsappNumber: '',
      hostResponseTime: '',
      isLive: false,
      ...(initialValues ?? {}),
    }),
    [initialValues]
  );

  const [propertyName, setPropertyName] = useState(
    ensureString(defaults.propertyName)
  );
  const [fullAddress, setFullAddress] = useState(
    ensureString(defaults.fullAddress)
  );
  const [city, setCity] = useState(ensureString(defaults.city));
  const [state, setState] = useState(ensureString(defaults.state));
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

  const [hostName, setHostName] = useState(ensureString(defaults.hostName));
  const [hostWhatsappNumber, setHostWhatsappNumber] = useState(
    ensureString(defaults.hostWhatsappNumber)
  );
  const [hostResponseTime, setHostResponseTime] = useState(
    ensureString(defaults.hostResponseTime)
  );

  const [isLive, setIsLive] = useState(Boolean(defaults.isLive));

  const [submitting, setSubmitting] = useState(false);
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
        fullAddress,
        city,
        state,
        googleMapsUrl,
        wazeUrl,
        parkingDetails,
        wifiNetworkName,
        wifiPassword,
        checkInInstructions,
        houseRules,
        guidebookTips,
        hostName,
        hostWhatsappNumber,
        hostResponseTime,
        isLive,
      };

      const res =
        mode === 'create'
          ? await createProperty(input)
          : await updateProperty(propertyId!, input);

      if (!res.ok) throw new Error(res.error);

      setSuccess(mode === 'create' ? 'Property created!' : 'Saved!');
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.message ?? 'Unable to save property.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="py-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {mode === 'create' ? 'Add property' : 'Edit property'}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Phase 1: set up your guest portal details.
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Cancel
        </button>
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

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-slate-700">
                Property name
              </label>
              <input
                required
                value={propertyName}
                onChange={(e) => setPropertyName(e.target.value)}
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
                City
              </label>
              <input
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand/30 focus:ring-2"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">
                State
              </label>
              <input
                required
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand/30 focus:ring-2"
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

          <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div>
              <div className="text-sm font-semibold text-slate-800">
                Portal status
              </div>
              <div className="text-xs text-slate-600">
                Live portals show as Live in your dashboard.
              </div>
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
                <textarea
                  required={idx === 0}
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
                  className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand/30 focus:ring-2"
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
                  { instruction: '' },
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
                setHouseRules((prev) => [...prev, { ruleText: '' }])
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
              </div>
            ))}
          </div>

          <div className="mt-3">
            <button
              type="button"
              onClick={() =>
                setGuidebookTips((prev) => [
                  ...prev,
                  { label: '', description: '' },
                ])
              }
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              + Add tip
            </button>
          </div>
        </section>

        {/* Host Info */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4">
            <h2 className="text-base font-semibold">Host contact</h2>
            <p className="mt-1 text-sm text-slate-600">
              How guests reach you and how quickly you respond.
            </p>
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
                Host response time (e.g. "within 30 minutes")
              </label>
              <input
                required
                value={hostResponseTime}
                onChange={(e) => setHostResponseTime(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand/30 focus:ring-2"
              />
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center rounded-xl bg-brand px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:opacity-60"
          >
            {submitting
              ? 'Saving...'
              : mode === 'create'
                ? 'Create property'
                : 'Save changes'}
          </button>
          <p className="text-xs text-slate-500">
            Your guest portal will use this content in Phase 2.
          </p>
        </div>
      </form>
    </main>
  );
}

