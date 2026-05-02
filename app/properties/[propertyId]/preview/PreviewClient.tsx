'use client';

import Link from 'next/link';
import GuestSectionMedia from '@/app/_components/GuestSectionMedia';
import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateGuestSectionOrder } from '@/app/actions/properties';
import { normalizeSectionOrder, type CustomDetail } from '@/lib/guest-layout';

type PreviewClientProps = {
  propertyId: string;
  propertyName: string;
  fullAddress: string;
  city: string;
  state: string;
  googleMapsUrl: string | null;
  wazeUrl: string | null;
  parkingDetails: string | null;
  wifiNetworkName: string | null;
  wifiPassword: string | null;
  hostName: string;
  hostWhatsappNumber: string;
  hostWhatsappMessage: string | null;
  checkInSteps: Array<{
    instruction: string;
    step_order: number;
    is_displayed: boolean;
    guest_image_path?: string | null;
    drive_media_url?: string | null;
  }>;
  houseRules: Array<{ rule_text: string; rule_order: number; is_displayed: boolean }>;
  guidebookTips: Array<{
    label: string;
    description: string;
    tip_order: number;
    guest_image_path?: string | null;
    drive_media_url?: string | null;
  }>;
  customDetails: Array<CustomDetail & { is_displayed: boolean }>;
  guestSectionOrder: string[];
};

function toWhatsappUrl(phone: string, prefilled: string | null) {
  const cleaned = phone.replace(/[^\d+]/g, '').replace(/^00/, '+');
  const withoutPlus = cleaned.startsWith('+') ? cleaned.slice(1) : cleaned;
  const text = (prefilled ?? '').trim();
  if (!text) return `https://wa.me/${withoutPlus}`;
  return `https://wa.me/${withoutPlus}?text=${encodeURIComponent(text)}`;
}

function hasText(value: string | null | undefined) {
  return (value ?? '').trim().length > 0;
}

export default function PreviewClient(props: PreviewClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const visibleSections = useMemo(() => {
    const customMap = new Map<number, CustomDetail>();
    for (const detail of props.customDetails) {
      customMap.set(detail.detail_order, detail);
    }

    const visibility = new Map<string, boolean>([
      [
        'address',
        hasText(props.fullAddress) ||
          hasText(props.city) ||
          hasText(props.state) ||
          hasText(props.googleMapsUrl) ||
          hasText(props.wazeUrl),
      ],
      ['parking', hasText(props.parkingDetails)],
      [
        'checkin',
        props.checkInSteps.some(
          (s) =>
            s.is_displayed &&
            (hasText(s.instruction) ||
              hasText(s.guest_image_path) ||
              hasText(s.drive_media_url))
        ),
      ],
      ['wifi', hasText(props.wifiNetworkName) || hasText(props.wifiPassword)],
      ['rules', props.houseRules.some((r) => r.is_displayed)],
      [
        'guidebook',
        props.guidebookTips.some(
          (t) =>
            hasText(t.label) ||
            hasText(t.description) ||
            hasText(t.guest_image_path) ||
            hasText(t.drive_media_url)
        ),
      ],
      ['host', hasText(props.hostName) || hasText(props.hostWhatsappNumber)],
    ]);

    for (const detail of props.customDetails) {
      visibility.set(
        `custom:${detail.detail_order}`,
        detail.is_displayed &&
          (hasText(detail.title) ||
            hasText(detail.message) ||
            hasText(detail.guest_image_path) ||
            hasText(detail.drive_media_url))
      );
    }

    const normalizedOrder = normalizeSectionOrder(
      props.guestSectionOrder,
      props.customDetails
    );

    return normalizedOrder
      .filter((key) => visibility.get(key) === true)
      .map((key) => {
        if (!key.startsWith('custom:')) {
          return { key, label: key };
        }
        const index = Number(key.split(':')[1] ?? '-1');
        const detail = customMap.get(index);
        return {
          key,
          label: detail?.title?.trim() || `Custom detail ${index + 1}`,
        };
      });
  }, [props]);

  const [order, setOrder] = useState<string[]>(() => visibleSections.map((s) => s.key));

  function moveItem(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= order.length) return;
    setOrder((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setSuccess(null);
    setError(null);
  }

  function onSaveOrder() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await updateGuestSectionOrder({
        propertyId: props.propertyId,
        sectionOrder: order,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSuccess('Preview layout saved. Guest view now uses this order.');
      router.refresh();
    });
  }

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-6 sm:px-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">Guest preview: {props.propertyName}</h1>
          <p className="mt-1 text-sm text-slate-600">
            Rearrange visible boxes. Empty sections are hidden automatically.
          </p>
        </div>
        <Link
          href={`/properties/${props.propertyId}/edit`}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
        >
          Back to edit property
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px,1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800">Visible boxes order</h2>
          <p className="mt-1 text-xs text-slate-500">
            Move up/down, then save. Hidden empty boxes are excluded.
          </p>

          <div className="mt-3 space-y-2">
            {order.map((key, idx) => {
              const section = visibleSections.find((s) => s.key === key);
              const label = section?.label ?? key;
              return (
                <div
                  key={key}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-2"
                >
                  <div className="text-sm font-medium text-slate-800">{label}</div>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => moveItem(idx, -1)}
                      disabled={idx === 0}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 disabled:opacity-40"
                    >
                      Up
                    </button>
                    <button
                      type="button"
                      onClick={() => moveItem(idx, 1)}
                      disabled={idx === order.length - 1}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 disabled:opacity-40"
                    >
                      Down
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {error ? (
            <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700">
              {error}
            </p>
          ) : null}
          {success ? (
            <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-700">
              {success}
            </p>
          ) : null}

          <button
            type="button"
            onClick={onSaveOrder}
            disabled={isPending}
            className="mt-3 w-full rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isPending ? 'Saving...' : 'Save order'}
          </button>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Mobile guest preview
          </h2>
          <div className="mx-auto max-w-md rounded-2xl bg-white p-4 shadow-sm">
            <section className="rounded-2xl bg-brand p-5 text-white">
              <h3 className="text-xl font-semibold">{props.propertyName}</h3>
              <p className="mt-1 text-sm text-white/90">Everything guests need for their stay.</p>
            </section>

            <div className="mt-3 space-y-3">
              {order.map((key) => {
                if (key === 'address') {
                  return (
                    <section key={key} className="rounded-2xl border border-slate-200 bg-white p-4">
                      <h4 className="text-base font-semibold">Address</h4>
                      {hasText(props.fullAddress) ? (
                        <p className="mt-2 text-sm text-slate-700">{props.fullAddress}</p>
                      ) : null}
                      {(hasText(props.city) || hasText(props.state)) && (
                        <p className="mt-1 text-sm text-slate-500">
                          {[props.city, props.state].filter(Boolean).join(', ')}
                        </p>
                      )}
                    </section>
                  );
                }

                if (key === 'parking') {
                  return (
                    <section key={key} className="rounded-2xl border border-slate-200 bg-white p-4">
                      <h4 className="text-base font-semibold">Parking details</h4>
                      <p className="mt-2 text-sm text-slate-700">{props.parkingDetails}</p>
                    </section>
                  );
                }

                if (key === 'checkin') {
                  return (
                    <section key={key} className="rounded-2xl border border-slate-200 bg-white p-4">
                      <h4 className="text-base font-semibold">Check-in guide</h4>
                      <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-700">
                        {props.checkInSteps
                          .filter(
                            (step) =>
                              step.is_displayed &&
                              (hasText(step.instruction) ||
                                hasText(step.guest_image_path) ||
                                hasText(step.drive_media_url))
                          )
                          .map((step, idx) => (
                          <li key={`${step.step_order}-${idx}`} className="space-y-2">
                            {hasText(step.instruction) ? (
                              <span>{step.instruction}</span>
                            ) : null}
                            <GuestSectionMedia
                              guestImagePath={step.guest_image_path}
                              driveMediaUrl={step.drive_media_url}
                            />
                          </li>
                        ))}
                      </ol>
                    </section>
                  );
                }

                if (key === 'wifi') {
                  return (
                    <section key={key} className="rounded-2xl border border-slate-200 bg-white p-4">
                      <h4 className="text-base font-semibold">Wifi</h4>
                      {hasText(props.wifiNetworkName) ? (
                        <p className="mt-2 text-sm text-slate-700">Network: {props.wifiNetworkName}</p>
                      ) : null}
                      {hasText(props.wifiPassword) ? (
                        <p className="mt-1 text-sm text-slate-700">Password: {props.wifiPassword}</p>
                      ) : null}
                    </section>
                  );
                }

                if (key === 'rules') {
                  return (
                    <section key={key} className="rounded-2xl border border-slate-200 bg-white p-4">
                      <h4 className="text-base font-semibold">House rules</h4>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                        {props.houseRules
                          .filter((rule) => rule.is_displayed)
                          .map((rule, idx) => (
                          <li key={`${rule.rule_order}-${idx}`}>{rule.rule_text}</li>
                        ))}
                      </ul>
                    </section>
                  );
                }

                if (key === 'guidebook') {
                  return (
                    <section key={key} className="rounded-2xl border border-slate-200 bg-white p-4">
                      <h4 className="text-base font-semibold">Guidebook tips</h4>
                      <div className="mt-2 space-y-2">
                        {props.guidebookTips
                          .filter(
                            (tip) =>
                              hasText(tip.label) ||
                              hasText(tip.description) ||
                              hasText(tip.guest_image_path) ||
                              hasText(tip.drive_media_url)
                          )
                          .map((tip, idx) => (
                          <article key={`${tip.tip_order}-${idx}`} className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                            {hasText(tip.label) ? (
                              <h5 className="text-sm font-semibold">{tip.label}</h5>
                            ) : null}
                            {hasText(tip.description) ? (
                              <p className="mt-1 text-sm text-slate-700">{tip.description}</p>
                            ) : null}
                            <GuestSectionMedia
                              guestImagePath={tip.guest_image_path}
                              driveMediaUrl={tip.drive_media_url}
                            />
                          </article>
                        ))}
                      </div>
                    </section>
                  );
                }

                if (key === 'host') {
                  return (
                    <section key={key} className="rounded-2xl border border-slate-200 bg-white p-4">
                      <h4 className="text-base font-semibold">Host contact</h4>
                      {hasText(props.hostName) ? (
                        <p className="mt-2 text-sm text-slate-700">{props.hostName}</p>
                      ) : null}
                      {hasText(props.hostWhatsappNumber) ? (
                        <Link
                          href={toWhatsappUrl(
                            props.hostWhatsappNumber,
                            props.hostWhatsappMessage
                          )}
                          target="_blank"
                          className="mt-3 inline-flex rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white"
                        >
                          Contact on WhatsApp
                        </Link>
                      ) : null}
                    </section>
                  );
                }

                if (key.startsWith('custom:')) {
                  const idx = Number(key.split(':')[1] ?? '-1');
                  const custom = props.customDetails.find((d) => d.detail_order === idx);
                  if (!custom || !custom.is_displayed) return null;
                  if (
                    !hasText(custom.title) &&
                    !hasText(custom.message) &&
                    !hasText(custom.guest_image_path) &&
                    !hasText(custom.drive_media_url)
                  ) {
                    return null;
                  }
                  return (
                    <section key={key} className="rounded-2xl border border-slate-200 bg-white p-4">
                      {hasText(custom.title) ? (
                        <h4 className="text-base font-semibold">{custom.title}</h4>
                      ) : null}
                      {hasText(custom.message) ? (
                        <p className="mt-2 text-sm text-slate-700">{custom.message}</p>
                      ) : null}
                      <GuestSectionMedia
                        guestImagePath={custom.guest_image_path}
                        driveMediaUrl={custom.drive_media_url}
                      />
                    </section>
                  );
                }

                return null;
              })}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
