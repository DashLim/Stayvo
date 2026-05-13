'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import type { ReactNode } from 'react';
import GuestSectionMedia from '@/app/_components/GuestSectionMedia';
import GuestSocialLinks from '@/app/_components/GuestSocialLinks';
import CopyTextButton from '@/app/stay/[token]/CopyTextButton';
import FaqAccordion from '@/app/_components/FaqAccordion';
import GuestSectionQuickNav from '@/app/stay/[token]/GuestSectionQuickNav';
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
  hostWhatsappChatNumber: string;
  checkInSteps: Array<{
    instruction: string;
    step_order: number;
    is_displayed: boolean;
    guest_image_path?: string | null;
    drive_media_url?: string | null;
  }>;
  houseRules: Array<{ rule_text: string; rule_order: number; is_displayed: boolean }>;
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
  socialDirectBookingUrl?: string | null;
  guestMediaPublicBase?: string | null;
};

function hasText(value: string | null | undefined) {
  return (value ?? '').trim().length > 0;
}

function toTelHref(phone: string | null | undefined) {
  const raw = (phone ?? '').trim();
  if (!raw) return null;
  const cleaned = raw.replace(/[^\d+]/g, '');
  const normalized = cleaned.startsWith('00') ? `+${cleaned.slice(2)}` : cleaned;
  return normalized.length > 0 ? `tel:${normalized}` : null;
}

function toWhatsappHref(phone: string | null | undefined) {
  const raw = (phone ?? '').trim();
  if (!raw) return null;
  let digits = raw.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('00')) digits = digits.slice(2);
  return `https://wa.me/${digits}`;
}

function SectionHeading({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <h2 className="flex items-center gap-2.5 text-[15px] font-semibold tracking-tight text-slate-900">
      <span className="text-brand">{icon}</span>
      {label}
    </h2>
  );
}

export default function PreviewClient(props: PreviewClientProps) {
  const customDetails = useMemo(
    () =>
      props.customDetails.filter(
        (d) =>
          d.is_displayed &&
          (hasText(d.title) ||
            hasText(d.message) ||
            hasText(d.guest_image_path) ||
            hasText(d.drive_media_url))
      ),
    [props.customDetails]
  );

  const orderedSections = useMemo(() => {
    const visibleSectionFlags = new Map<string, boolean>([
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
        'host',
        hasText(props.hostName) ||
          hasText(props.hostWhatsappNumber) ||
          hasText(props.hostWhatsappChatNumber) ||
          hasText(props.socialDirectBookingUrl),
      ],
    ]);

    for (const d of customDetails) {
      visibleSectionFlags.set(`custom:${d.detail_order}`, true);
    }

    return normalizeSectionOrder(props.guestSectionOrder, customDetails).filter(
      (key) => visibleSectionFlags.get(key) === true
    );
  }, [customDetails, props]);

  const heroImageUrl = guestPropertyMediaPublicUrl(props.heroImagePath, {
    resolvedPublicBase: props.guestMediaPublicBase,
  });
  const hasCheckinSection = orderedSections.includes('checkin');
  const hasParkingSection = orderedSections.includes('parking');
  const hasWifiSection = orderedSections.includes('wifi');
  const hasRulesSection = orderedSections.includes('rules');
  const callHref = toTelHref(props.hostWhatsappNumber);
  const hostCallHref = toTelHref(props.hostWhatsappNumber);
  const whatsappHref = toWhatsappHref(props.hostWhatsappChatNumber);
  const quickNavItems: Array<{
    key: 'checkin' | 'parking' | 'wifi' | 'rules' | 'call' | 'whatsapp';
    targetId: 'checkin-section' | 'parking-section' | 'wifi-section' | 'rules-section' | 'host-section';
  }> = [];

  if (hasCheckinSection) quickNavItems.push({ key: 'checkin', targetId: 'checkin-section' });
  if (hasParkingSection) quickNavItems.push({ key: 'parking', targetId: 'parking-section' });
  if (hasWifiSection) quickNavItems.push({ key: 'wifi', targetId: 'wifi-section' });
  if (hasRulesSection) quickNavItems.push({ key: 'rules', targetId: 'rules-section' });
  if (callHref) quickNavItems.push({ key: 'call', targetId: 'host-section' });
  if (whatsappHref) quickNavItems.push({ key: 'whatsapp', targetId: 'host-section' });

  const heroPreviewIntro = (
    <div>
      <h1
        className="whitespace-pre-line text-2xl font-bold leading-tight tracking-tight text-white"
        style={{ textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}
      >
        {props.propertyName}
      </h1>
      <p
        className="mt-1.5 text-sm font-medium text-white/90"
        style={{ textShadow: '0 1px 6px rgba(0,0,0,0.45)' }}
      >
        This is how your guest page looks.
      </p>
    </div>
  );

  const previewHeroBadge = (
    <div className="absolute left-4 top-4 z-20">
      <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
        Stayvo
      </span>
    </div>
  );

  return (
    <main
      className="relative left-1/2 right-1/2 min-h-screen w-screen -translate-x-1/2 overflow-x-hidden"
      style={{ background: 'linear-gradient(160deg, #FDF6EC 0%, #FAF0DC 100%)' }}
    >
      <header className="sticky top-0 z-40 border-b border-white/60 bg-white/85 backdrop-blur-xl">
        <div
          className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 pb-2 pt-4"
          style={{ paddingTop: 'calc(env(safe-area-inset-top) + 14px)' }}
        >
          <span className="text-sm font-semibold text-slate-800">Guest preview</span>
          <Link
            href={`/properties/${props.propertyId}/edit`}
            className="inline-flex min-h-9 items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.97]"
          >
            Back
          </Link>
        </div>
      </header>

      <section
        className={`relative left-1/2 right-1/2 w-screen -translate-x-1/2 overflow-hidden ${
          heroImageUrl ? 'min-h-[68vh]' : 'bg-brand'
        }`}
      >
        {heroImageUrl ? (
          <>
            <img src={heroImageUrl} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/30 to-black/70" />
            {previewHeroBadge}
            <div className="relative flex min-h-[68vh] items-end px-5 pb-14">{heroPreviewIntro}</div>
          </>
        ) : (
          <div className="relative mx-auto w-full max-w-full">
            {previewHeroBadge}
            <img
              src="/brand/stayvo-guest-hero-fallback.png"
              alt=""
              aria-hidden
              className="mx-auto block h-auto w-full max-w-full"
            />
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/25 via-black/30 to-black/70"
              aria-hidden
            />
            <div className="absolute inset-x-0 bottom-0 z-10 px-5 pb-14 pt-12 sm:pt-16">{heroPreviewIntro}</div>
          </div>
        )}
      </section>
      <GuestSectionQuickNav items={quickNavItems} callHref={callHref} whatsappHref={whatsappHref} />

      <div
        className="relative left-1/2 right-1/2 z-10 -mt-10 w-screen -translate-x-1/2 rounded-t-[32px]"
        style={{ background: 'linear-gradient(160deg, #FDF6EC 0%, #FAF0DC 100%)' }}
      >
        <div className="space-y-3 pb-12 pt-6">
          {orderedSections.map((sectionKey) => {
            if (sectionKey === 'address') {
              return (
                <section key={sectionKey} className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                  <div className="px-4 pt-4 pb-3">
                    <SectionHeading
                      label="Address"
                      icon={
                        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden>
                          <path d="M10 1.75A5.75 5.75 0 0 0 4.25 7.5c0 4.13 4.37 9.4 5.03 10.18a.94.94 0 0 0 1.44 0c.66-.78 5.03-6.05 5.03-10.18A5.75 5.75 0 0 0 10 1.75Zm0 8a2.25 2.25 0 1 1 0-4.5 2.25 2.25 0 0 1 0 4.5Z" />
                        </svg>
                      }
                    />
                    {hasText(props.fullAddress) ? (
                      <p className="mt-2 text-[13px] leading-relaxed text-slate-600">{props.fullAddress}</p>
                    ) : null}
                    {(hasText(props.city) || hasText(props.state)) && (
                      <p className="mt-0.5 text-[13px] text-slate-400">
                        {[props.city, props.state].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                  {(props.googleMapsUrl || props.wazeUrl) && (
                    <div className="grid grid-cols-2 gap-px border-t border-slate-100 bg-slate-100">
                      {props.googleMapsUrl ? (
                        <Link
                          href={props.googleMapsUrl}
                          target="_blank"
                          className="flex items-center justify-center gap-2 bg-white py-3.5 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50 active:bg-slate-100"
                        >
                          <svg viewBox="0 0 20 20" className="h-4 w-4 text-brand" fill="currentColor" aria-hidden>
                            <path d="M10 1.75A5.75 5.75 0 0 0 4.25 7.5c0 4.13 4.37 9.4 5.03 10.18a.94.94 0 0 0 1.44 0c.66-.78 5.03-6.05 5.03-10.18A5.75 5.75 0 0 0 10 1.75Zm0 8a2.25 2.25 0 1 1 0-4.5 2.25 2.25 0 0 1 0 4.5Z" />
                          </svg>
                          Open Google Map
                        </Link>
                      ) : null}
                      {props.wazeUrl ? (
                        <Link
                          href={props.wazeUrl}
                          target="_blank"
                          className="flex items-center justify-center gap-2 bg-white py-3.5 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50 active:bg-slate-100"
                        >
                          <svg viewBox="0 0 20 20" className="h-4 w-4 text-brand" fill="currentColor" aria-hidden>
                            <path d="M10 2a6 6 0 0 1 4.33 10.1l-2.93 3.74a.75.75 0 0 1-1.2 0L7.27 12.1a6 6 0 0 1-1.02-1.35A6 6 0 0 1 10 2Zm0 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z" />
                          </svg>
                          Open Waze
                        </Link>
                      ) : null}
                    </div>
                  )}
                </section>
              );
            }

            if (sectionKey === 'parking') {
              return (
                <section id="parking-section" key={sectionKey} className="scroll-mt-20 rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
                  <SectionHeading
                    label="Parking"
                    icon={
                      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden>
                        <path d="M6 3.5A1.5 1.5 0 0 0 4.5 5v10A1.5 1.5 0 0 0 6 16.5h2.25V12h2.5a4.25 4.25 0 0 0 0-8.5H6Zm2.25 2h2.5a1.75 1.75 0 0 1 0 3.5h-2.5v-3.5Z" />
                      </svg>
                    }
                  />
                  <p className="mt-2 text-sm leading-relaxed text-slate-700">{props.parkingDetails}</p>
                </section>
              );
            }

            if (sectionKey === 'checkin') {
              const visibleSteps = props.checkInSteps.filter(
                (s) =>
                  s.is_displayed &&
                  (hasText(s.instruction) ||
                    hasText(s.guest_image_path) ||
                    hasText(s.drive_media_url))
              );
              return (
                <section id="checkin-section" key={sectionKey} className="scroll-mt-20 rounded-2xl border border-slate-100 bg-white shadow-sm">
                  <div className="px-4 pt-4 pb-3">
                    <SectionHeading
                      label="Check-in guide"
                      icon={
                        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden>
                          <path d="M5.5 2.5a.75.75 0 0 1 .75.75V4h7.5v-.75a.75.75 0 0 1 1.5 0V4h.25A2.25 2.25 0 0 1 17.75 6.25v8.5A2.25 2.25 0 0 1 15.5 17h-11a2.25 2.25 0 0 1-2.25-2.25v-8.5A2.25 2.25 0 0 1 4.5 4h.25v-.75a.75.75 0 0 1 .75-.75Zm-1 6.5a.5.5 0 0 0-.5.5v5.25c0 .41.34.75.75.75h10.5a.75.75 0 0 0 .75-.75V9.5a.5.5 0 0 0-.5-.5h-11Z" />
                        </svg>
                      }
                    />
                  </div>
                  <ol className="pb-4">
                    {visibleSteps.map((s, idx) => {
                      const hasPhoto = hasText(s.guest_image_path) || hasText(s.drive_media_url);
                      return (
                        <li key={`${s.step_order}-${idx}`}>
                          <div className="flex items-start gap-3 px-4 pb-1 pt-3">
                            <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-white">
                              {idx + 1}
                            </span>
                            {hasText(s.instruction) ? (
                              <p className="pt-0.5 text-sm leading-relaxed text-slate-700">{s.instruction}</p>
                            ) : null}
                          </div>
                          {hasPhoto ? (
                            <div className="mt-0.5 px-4 pb-3">
                              <GuestSectionMedia
                                guestImagePath={s.guest_image_path}
                                driveMediaUrl={s.drive_media_url}
                                guestMediaPublicBase={props.guestMediaPublicBase}
                              />
                            </div>
                          ) : null}
                          {idx !== visibleSteps.length - 1 ? (
                            <div className="mx-4 border-b-2 border-slate-200" />
                          ) : null}
                        </li>
                      );
                    })}
                  </ol>
                </section>
              );
            }

            if (sectionKey === 'wifi') {
              return (
                <section id="wifi-section" key={sectionKey} className="scroll-mt-20 rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
                  <SectionHeading
                    label="Wi-Fi"
                    icon={
                      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden>
                        <path d="M10 15.75a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3ZM3.3 12.46a.75.75 0 0 0 1.06 1.06 7.98 7.98 0 0 1 11.28 0 .75.75 0 1 0 1.06-1.06 9.48 9.48 0 0 0-13.4 0Zm-2.2-3.28a.75.75 0 0 0 1.05 1.07 11.98 11.98 0 0 1 16.7 0 .75.75 0 1 0 1.05-1.07 13.48 13.48 0 0 0-18.8 0Z" />
                      </svg>
                    }
                  />
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    {hasText(props.wifiNetworkName) ? (
                      <div className="rounded-xl bg-slate-50 px-3 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Network</p>
                        <p className="mt-1 font-mono text-sm font-semibold text-slate-800">{props.wifiNetworkName}</p>
                      </div>
                    ) : null}
                    {hasText(props.wifiPassword) ? (
                      <div className="rounded-xl bg-slate-50 px-3 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Password</p>
                        <CopyTextButton
                          text={props.wifiPassword || ''}
                          idleLabel={props.wifiPassword || ''}
                          copiedLabel="Copied!"
                          className="mt-1 block font-mono text-sm font-semibold text-brand active:opacity-70"
                        />
                        <p className="mt-1 text-[11px] text-slate-400">Tap password to copy.</p>
                      </div>
                    ) : null}
                  </div>
                </section>
              );
            }

            if (sectionKey === 'rules') {
              return (
                <section id="rules-section" key={sectionKey} className="scroll-mt-20 rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
                  <SectionHeading
                    label="House rules"
                    icon={
                      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden>
                        <path d="M4.25 2.5A1.75 1.75 0 0 0 2.5 4.25v11.5c0 .97.78 1.75 1.75 1.75h11.5c.97 0 1.75-.78 1.75-1.75V7.38a1.75 1.75 0 0 0-.51-1.24l-3.63-3.63a1.75 1.75 0 0 0-1.24-.51H4.25Zm2.25 4a.75.75 0 0 1 .75-.75h5a.75.75 0 0 1 0 1.5h-5A.75.75 0 0 1 6.5 6.5Zm0 3.5a.75.75 0 0 1 .75-.75h5a.75.75 0 0 1 0 1.5h-5a.75.75 0 0 1-.75-.75Zm0 3.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 0 1.5h-3a.75.75 0 0 1-.75-.75Z" />
                      </svg>
                    }
                  />
                  <ul className="mt-3 space-y-2.5">
                    {props.houseRules
                      .filter((r) => r.is_displayed)
                      .map((r, idx) => (
                        <li key={`${r.rule_order}-${idx}`} className="flex items-start gap-2.5 text-sm text-slate-700">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                          {r.rule_text}
                        </li>
                      ))}
                  </ul>
                </section>
              );
            }

            if (sectionKey === 'faq') {
              const faqItems = props.faqs
                .filter((f) => hasText(f.question) && hasText(f.answer))
                .map((f) => ({ question: f.question, answer: f.answer }));
              return (
                <section key={sectionKey} className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
                  <SectionHeading
                    label="FAQ"
                    icon={
                      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden>
                        <path d="M10 2.25a7.75 7.75 0 1 0 0 15.5 7.75 7.75 0 0 0 0-15.5Zm0 11a1 1 0 1 1 0 2 1 1 0 0 1 0-2Zm1.05-2.98c-.58.25-.8.52-.8.98a.75.75 0 0 1-1.5 0c0-1.22.78-1.95 1.7-2.35.76-.33 1.3-.58 1.3-1.35a1.75 1.75 0 0 0-3.5 0 .75.75 0 0 1-1.5 0 3.25 3.25 0 1 1 6.5 0c0 1.83-1.4 2.43-2.2 2.77Z" />
                      </svg>
                    }
                  />
                  <FaqAccordion items={faqItems} className="mt-3" />
                </section>
              );
            }

            if (sectionKey === 'host') {
              return (
                <section id="host-section" key={sectionKey} className="scroll-mt-20 rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
                  <SectionHeading
                    label="Your host"
                    icon={
                      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden>
                        <path d="M10 2.5a4.25 4.25 0 1 0 0 8.5 4.25 4.25 0 0 0 0-8.5ZM3 16.25A5.75 5.75 0 0 1 8.75 10.5h2.5A5.75 5.75 0 0 1 17 16.25c0 .69-.56 1.25-1.25 1.25h-11A1.25 1.25 0 0 1 3 16.25Z" />
                      </svg>
                    }
                  />
                  {hasText(props.hostName) ? (
                    <p className="mt-2 text-sm font-medium text-slate-800">{props.hostName}</p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {hasText(props.socialDirectBookingUrl) ? (
                      <a
                        href={(props.socialDirectBookingUrl ?? '').trim()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm active:opacity-80"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className="h-4 w-4 shrink-0"
                          fill="none"
                          aria-hidden
                        >
                          <path
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 0 1 9-9"
                          />
                        </svg>
                        Booking Website
                      </a>
                    ) : null}
                    {hostCallHref ? (
                      <Link
                        href={hostCallHref}
                        className="inline-flex items-center gap-2 rounded-full border-2 border-brand bg-white px-5 py-2.5 text-sm font-semibold text-brand shadow-sm active:opacity-80"
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
                          <path
                            d="M6.5 4.75a1.5 1.5 0 0 1 1.5-1.5h1.58a1.5 1.5 0 0 1 1.43 1.05l.52 1.65a1.5 1.5 0 0 1-.38 1.5l-.9.9a12 12 0 0 0 4.04 4.04l.9-.9a1.5 1.5 0 0 1 1.5-.38l1.65.52a1.5 1.5 0 0 1 1.05 1.43v1.58a1.5 1.5 0 0 1-1.5 1.5h-1.05C10.6 19.25 4.75 13.4 4.75 6.55V5.5a1.5 1.5 0 0 1 1.5-1.5Z"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        Call host
                      </Link>
                    ) : null}
                    {whatsappHref ? (
                      <a
                        href={whatsappHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white shadow-sm active:opacity-80"
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                          <path d="M20.52 3.48A11.88 11.88 0 0 0 12.06 0C5.52 0 .29 5.23.29 11.66c0 2.06.54 4.07 1.57 5.86L0 24l6.63-1.74a11.7 11.7 0 0 0 5.43 1.38h.01c6.54 0 11.77-5.23 11.77-11.66 0-3.12-1.22-6.05-3.32-8.5ZM12.06 21.5h-.01a9.4 9.4 0 0 1-4.8-1.32l-.34-.2-3.8 1 1.02-3.7-.22-.36a9.43 9.43 0 0 1-1.44-5.01c0-5.2 4.24-9.43 9.47-9.43 2.53 0 4.9.99 6.68 2.77a9.36 9.36 0 0 1 2.77 6.66c0 5.2-4.24 9.44-9.47 9.44Zm5.48-7.49c-.3-.15-1.77-.87-2.04-.97-.28-.1-.48-.15-.68.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.89-.8-1.49-1.79-1.66-2.09-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.68-1.64-.93-2.25-.25-.58-.5-.5-.68-.51l-.58-.01c-.2 0-.52.07-.79.37-.28.3-1.05 1.02-1.05 2.5 0 1.47 1.08 2.9 1.23 3.1.15.2 2.12 3.23 5.14 4.52.72.31 1.28.5 1.72.64.72.23 1.37.2 1.88.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.18-1.42-.08-.12-.28-.2-.58-.35Z" />
                        </svg>
                        WhatsApp
                      </a>
                    ) : null}
                  </div>
                </section>
              );
            }

            if (sectionKey.startsWith('custom:')) {
              const idx = Number(sectionKey.split(':')[1] ?? '-1');
              const detail = customDetails.find((d) => d.detail_order === idx);
              if (!detail) return null;
              return (
                <section key={sectionKey} className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
                  {hasText(detail.title) ? (
                    <SectionHeading
                      label={detail.title}
                      icon={
                        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden>
                          <path d="M10 2.25a.75.75 0 0 1 .73.57l.85 3.24a.75.75 0 0 0 .53.53l3.24.85a.75.75 0 0 1 0 1.46l-3.24.85a.75.75 0 0 0-.53.53l-.85 3.24a.75.75 0 0 1-1.46 0l-.85-3.24a.75.75 0 0 0-.53-.53l-3.24-.85a.75.75 0 0 1 0-1.46l3.24-.85a.75.75 0 0 0 .53-.53l.85-3.24A.75.75 0 0 1 10 2.25Z" />
                        </svg>
                      }
                    />
                  ) : null}
                  {hasText(detail.message) ? (
                    <p className="mt-2 text-sm leading-relaxed text-slate-700">{detail.message}</p>
                  ) : null}
                  <GuestSectionMedia
                    guestImagePath={detail.guest_image_path}
                    driveMediaUrl={detail.drive_media_url}
                    guestMediaPublicBase={props.guestMediaPublicBase}
                  />
                </section>
              );
            }

            return null;
          })}
          <GuestSocialLinks
            className="pt-4"
            links={{
              facebook: props.socialFacebookUrl,
              instagram: props.socialInstagramUrl,
              x: props.socialXUrl,
              tiktok: props.socialTiktokUrl,
              youtube: props.socialYoutubeUrl,
            }}
          />
          <p className="pb-24 pt-6 text-center text-[11px] text-slate-400">Powered by Stayvo</p>
        </div>
      </div>
    </main>
  );
}
