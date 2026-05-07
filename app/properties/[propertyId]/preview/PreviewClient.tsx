'use client';

import Link from 'next/link';
import GuestSectionMedia from '@/app/_components/GuestSectionMedia';
import GuestSocialLinks from '@/app/_components/GuestSocialLinks';
import { useMemo } from 'react';
import CopyTextButton from '@/app/stay/[token]/CopyTextButton';
import FaqAccordion from '@/app/_components/FaqAccordion';
import { normalizeSectionOrder, type CustomDetail } from '@/lib/guest-layout';
import { guestPropertyMediaPublicUrl } from '@/lib/guest-property-media';

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
  faqs: Array<{
    question: string;
    answer: string;
    faq_order: number;
  }>;
  customDetails: Array<CustomDetail & { is_displayed: boolean }>;
  guestSectionOrder: string[];
  heroImagePath?: string | null;
  socialFacebookUrl?: string | null;
  socialInstagramUrl?: string | null;
  socialXUrl?: string | null;
  socialTiktokUrl?: string | null;
  socialYoutubeUrl?: string | null;
  socialAirbnbUrl?: string | null;
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
      [
        'faq',
        props.faqs.some(
          (f) => hasText(f.question) && hasText(f.answer)
        ),
      ],
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

  const order = visibleSections.map((s) => s.key);

  return (
    <main className="mx-auto min-h-screen max-w-md px-4 py-6 sm:px-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h1 className="text-base font-semibold text-slate-700">Guest preview</h1>
        <Link
          href={`/properties/${props.propertyId}/edit`}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
        >
          ← Back
        </Link>
      </div>

      <div className="rounded-2xl bg-white shadow-sm">
        {(() => {
          const heroUrl = guestPropertyMediaPublicUrl(props.heroImagePath);
          return (
            <section
              className={`relative overflow-hidden rounded-t-2xl ${heroUrl ? '' : 'bg-brand'}`}
            >
              {heroUrl ? (
                <>
                  <img src={heroUrl} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-80" />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/60" />
                </>
              ) : null}
              <div className="relative px-5 py-6">
                <h3
                  className="text-xl font-semibold text-white"
                  style={{ textShadow: heroUrl ? '0 2px 8px rgba(0,0,0,0.55)' : undefined }}
                >
                  {props.propertyName}
                </h3>
                <p
                  className="mt-1 text-sm text-white/90"
                  style={{ textShadow: heroUrl ? '0 1px 6px rgba(0,0,0,0.5)' : undefined }}
                >
                  Everything guests need for their stay.
                </p>
              </div>
            </section>
          );
        })()}

        <div className="space-y-3 p-4">
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
                      <ol className="mt-3 space-y-4">
                        {props.checkInSteps
                          .filter(
                            (step) =>
                              step.is_displayed &&
                              (hasText(step.instruction) ||
                                hasText(step.guest_image_path) ||
                                hasText(step.drive_media_url))
                          )
                          .map((step, idx) => (
                          <li key={`${step.step_order}-${idx}`} className="flex gap-3">
                            <div className="relative flex w-6 shrink-0 justify-center">
                              <span className="z-10 inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                                {idx + 1}
                              </span>
                              {idx !==
                              props.checkInSteps.filter(
                                (s) =>
                                  s.is_displayed &&
                                  (hasText(s.instruction) ||
                                    hasText(s.guest_image_path) ||
                                    hasText(s.drive_media_url))
                              ).length -
                                1 ? (
                                <span className="absolute top-6 h-[calc(100%-0.25rem)] w-px bg-slate-200" />
                              ) : null}
                            </div>
                            <div className="min-w-0 flex-1 pb-1">
                              {hasText(step.instruction) ? (
                                <p className="text-sm text-slate-700">{step.instruction}</p>
                              ) : null}
                              <div className="mt-2">
                                <GuestSectionMedia
                                  guestImagePath={step.guest_image_path}
                                  driveMediaUrl={step.drive_media_url}
                                />
                              </div>
                            </div>
                          </li>
                        ))}
                      </ol>
                    </section>
                  );
                }

                if (key === 'wifi') {
                  return (
                    <section key={key} className="rounded-2xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
                      <h4 className="text-base font-semibold">Wifi</h4>
                      {hasText(props.wifiNetworkName) ? (
                        <p className="mt-2 text-sm text-slate-700">Network</p>
                      ) : null}
                      {hasText(props.wifiNetworkName) ? (
                        <p className="font-mono text-lg font-semibold text-slate-900">{props.wifiNetworkName}</p>
                      ) : null}
                      {hasText(props.wifiPassword) ? (
                        <p className="mt-3 text-sm text-slate-700">Password</p>
                      ) : null}
                      {hasText(props.wifiPassword) ? (
                        <CopyTextButton
                          text={props.wifiPassword || ''}
                          idleLabel={props.wifiPassword || ''}
                          copiedLabel="Copied!"
                          className="mt-1 rounded-full border border-blue-300 bg-white px-4 py-2 font-mono text-lg font-semibold text-slate-900"
                        />
                      ) : null}
                    </section>
                  );
                }

                if (key === 'faq') {
                  const faqs = props.faqs.filter(
                    (f) => hasText(f.question) && hasText(f.answer)
                  );
                  return (
                    <section key={key} className="rounded-2xl border border-slate-200 bg-white p-4">
                      <h4 className="text-base font-semibold">FAQ</h4>
                      <FaqAccordion
                        items={faqs.map((f) => ({ question: f.question, answer: f.answer }))}
                        className="mt-3"
                      />
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

        <GuestSocialLinks
          className="mt-8"
          links={{
            facebook: props.socialFacebookUrl,
            instagram: props.socialInstagramUrl,
            x: props.socialXUrl,
            tiktok: props.socialTiktokUrl,
            youtube: props.socialYoutubeUrl,
            airbnb: props.socialAirbnbUrl,
          }}
        />
      </div>
    </main>
  );
}
