'use client';

import Link from 'next/link';
import Image from 'next/image';
import GuestSectionMedia from '@/app/_components/GuestSectionMedia';
import GuestSocialLinks from '@/app/_components/GuestSocialLinks';
import FaqAccordion from '@/app/_components/FaqAccordion';
import StayOpenTracker from '@/app/stay/[token]/StayOpenTracker';
import GuestSectionQuickNav from '@/app/stay/[token]/GuestSectionQuickNav';
import CopyTextButton from '@/app/stay/[token]/CopyTextButton';
import DesktopGuestLeftColumn from '@/app/_guest/DesktopGuestLeftColumn';
import GuestCookieNotice from '@/app/_guest/GuestCookieNotice';
import GuestPortalLegalFooter from '@/app/_guest/GuestPortalLegalFooter';
import GuestSectionHeading from '@/app/_guest/GuestSectionHeading';
import {
  formatDate,
  hasText,
  toTelHref,
  toTitleCase,
  toWhatsappHref,
} from '@/app/_guest/guest-portal-utils';
import { normalizeSectionOrder, type CustomDetail } from '@/lib/guest-layout';
import { guestPropertyMediaPublicUrl } from '@/lib/guest-property-media';

export type GuestPortalViewData = {
  property_name: string;
  full_address: string;
  city: string;
  state: string;
  google_maps_url: string | null;
  waze_url: string | null;
  parking_details: string | null;
  wifi_network_name: string | null;
  wifi_password: string | null;
  host_name: string;
  host_whatsapp_number: string;
  host_whatsapp_chat_number: string | null;
  guest_name?: string | null;
  checkout_date?: string | null;
  expires_at?: string | null;
  is_permanent?: boolean | null;
  guest_section_order?: string[] | null;
  hero_image_path?: string | null;
  check_in_steps: Array<{
    instruction: string;
    step_order: number;
    is_displayed: boolean;
    guest_image_path?: string | null;
    drive_media_url?: string | null;
  }>;
  house_rules: Array<{ rule_text: string; rule_order: number; is_displayed: boolean }>;
  guidebook_tips?: Array<{
    label: string;
    description: string;
    tip_order: number;
    guest_image_path?: string | null;
    drive_media_url?: string | null;
  }>;
  faqs: Array<{ question: string; answer: string; faq_order: number }>;
  custom_details: Array<
    CustomDetail & {
      is_displayed: boolean;
      guest_image_path?: string | null;
      drive_media_url?: string | null;
    }
  >;
  social_facebook_url?: string | null;
  social_instagram_url?: string | null;
  social_x_url?: string | null;
  social_tiktok_url?: string | null;
  social_youtube_url?: string | null;
  social_direct_booking_url?: string | null;
};

export type GuestPortalViewProps = {
  variant: 'guest' | 'preview';
  data: GuestPortalViewData;
  guestMediaPublicBase: string | null;
  token?: string;
};

export default function GuestPortalView({
  variant,
  data,
  guestMediaPublicBase,
  token,
}: GuestPortalViewProps) {
  const customDetails = ((data.custom_details ?? []) as Array<
    CustomDetail & { is_displayed: boolean }
  >).filter(
    (d) =>
      d.is_displayed &&
      (hasText(d.title) ||
        hasText(d.message) ||
        hasText(d.guest_image_path) ||
        hasText(d.drive_media_url))
  );

  const visibleSectionFlags = new Map<string, boolean>([
    [
      'address',
      hasText(data.full_address) ||
        hasText(data.city) ||
        hasText(data.state) ||
        hasText(data.google_maps_url) ||
        hasText(data.waze_url),
    ],
    ['parking', hasText(data.parking_details)],
    [
      'checkin',
      data.check_in_steps.some(
        (s) =>
          s.is_displayed &&
          (hasText(s.instruction) ||
            hasText(s.guest_image_path) ||
            hasText(s.drive_media_url))
      ),
    ],
    ['wifi', hasText(data.wifi_network_name) || hasText(data.wifi_password)],
    [
      'faq',
      (data.faqs ?? []).some((f) => hasText(f.question) && hasText(f.answer)),
    ],
    ['rules', data.house_rules.some((r) => r.is_displayed)],
    [
      'host',
      hasText(data.host_name) ||
        hasText(data.host_whatsapp_number) ||
        hasText(data.host_whatsapp_chat_number) ||
        hasText(data.social_direct_booking_url),
    ],
  ]);
  for (const d of customDetails) {
    visibleSectionFlags.set(`custom:${d.detail_order}`, true);
  }

  const orderedSections = normalizeSectionOrder(
    (data.guest_section_order ?? []) as string[],
    customDetails
  ).filter((key) => visibleSectionFlags.get(key) === true);

  const guestFirstName =
    variant === 'guest' ? toTitleCase((data.guest_name ?? '').trim()) : '';
  const isPreview = variant === 'preview';

  const heroImageUrl = guestPropertyMediaPublicUrl(data.hero_image_path, {
    resolvedPublicBase: guestMediaPublicBase,
  });
  const hasCheckinSection = visibleSectionFlags.get('checkin') === true;
  const hasParkingSection = visibleSectionFlags.get('parking') === true;
  const hasWifiSection = visibleSectionFlags.get('wifi') === true;
  const hasRulesSection = visibleSectionFlags.get('rules') === true;
  const callHref = toTelHref(data.host_whatsapp_number);
  const hostCallHref = toTelHref(data.host_whatsapp_number);
  const whatsappHref = toWhatsappHref(data.host_whatsapp_chat_number);
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

  const heroGuestIntro = (
    <div>
      <h1
        className="whitespace-pre-line text-2xl font-bold leading-tight tracking-tight text-white"
        style={{ textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}
      >
        {data.property_name}
      </h1>
      {isPreview ? (
        <p
          className="mt-1.5 text-sm font-medium text-white/90"
          style={{ textShadow: '0 1px 6px rgba(0,0,0,0.45)' }}
        >
          This is how your guest page looks.
        </p>
      ) : guestFirstName ? (
        <p
          className="mt-1.5 text-sm font-medium text-white/90"
          style={{ textShadow: '0 1px 6px rgba(0,0,0,0.45)' }}
        >
          Welcome, {guestFirstName} 👋
        </p>
      ) : null}
      {!isPreview && data.checkout_date ? (
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 opacity-80" fill="currentColor" aria-hidden>
            <path d="M5 2.5a.5.5 0 0 0-1 0V4H3a1.5 1.5 0 0 0-1.5 1.5v7A1.5 1.5 0 0 0 3 14h10a1.5 1.5 0 0 0 1.5-1.5v-7A1.5 1.5 0 0 0 13 4h-1V2.5a.5.5 0 0 0-1 0V4H5V2.5ZM2.5 7.5h11v5a.5.5 0 0 1-.5.5H3a.5.5 0 0 1-.5-.5v-5Z" />
          </svg>
          Check-out: {formatDate(data.checkout_date)}
        </p>
      ) : null}
    </div>
  );

  const heroGuestIntroDesktop = (
    <div className="px-1 md:px-0">
      <h1 className="text-2xl font-bold leading-tight tracking-tight text-slate-900 md:text-3xl">
        {data.property_name}
      </h1>
      {isPreview ? (
        <p className="mt-2 text-base font-medium text-slate-600">Guest preview</p>
      ) : guestFirstName ? (
        <p className="mt-2 text-base font-medium text-slate-600">Welcome, {guestFirstName} 👋</p>
      ) : null}
      {!isPreview && data.checkout_date ? (
        <p className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[#E0A24D]/35 bg-[#E0A24D]/12 px-3 py-1.5 text-xs font-semibold text-slate-800">
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-brand" fill="currentColor" aria-hidden>
            <path d="M5 2.5a.5.5 0 0 0-1 0V4H3a1.5 1.5 0 0 0-1.5 1.5v7A1.5 1.5 0 0 0 3 14h10a1.5 1.5 0 0 0 1.5-1.5v-7A1.5 1.5 0 0 0 13 4h-1V2.5a.5.5 0 0 0-1 0V4H5V2.5ZM2.5 7.5h11v5a.5.5 0 0 1-.5.5H3a.5.5 0 0 1-.5-.5v-5Z" />
          </svg>
          Check-out: {formatDate(data.checkout_date)}
        </p>
      ) : null}
    </div>
  );

  const showDesktopHostSidebar =
    visibleSectionFlags.get('host') === true &&
    (hasText(data.host_name) ||
      Boolean(whatsappHref) ||
      Boolean(hostCallHref) ||
      hasText(data.social_direct_booking_url));

  const visibleGuidebookTips = (data.guidebook_tips ?? []).filter(
    (t) =>
      hasText(t.label) ||
      hasText(t.description) ||
      hasText(t.guest_image_path) ||
      hasText(t.drive_media_url)
  );

  const desktopExpiryLine =
    !isPreview && data.expires_at && data.is_permanent !== true ? (
      <p className="mt-3 text-xs text-slate-500">
        Guest access expires {formatDate(data.expires_at)}.
      </p>
    ) : null;

  return (
    <main
      className="relative min-h-screen overflow-x-hidden max-md:left-1/2 max-md:right-1/2 max-md:w-screen max-md:-translate-x-1/2 md:mx-auto md:w-full md:max-w-[1100px] md:translate-x-0 md:overflow-x-visible md:px-8 md:py-10"
      style={{ background: 'linear-gradient(160deg, #FDF6EC 0%, #FAF0DC 100%)' }}
    >
      {token ? <StayOpenTracker token={token} /> : null}
      {variant === 'guest' ? <GuestCookieNotice /> : null}

      <div className="flex flex-col md:flex-row md:items-start md:gap-x-10 lg:gap-x-12">
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section
          className={`relative overflow-hidden max-md:left-1/2 max-md:right-1/2 max-md:w-screen max-md:-translate-x-1/2 ${
            heroImageUrl ? 'min-h-[68vh]' : 'bg-brand md:bg-transparent'
          } md:sticky md:top-10 md:w-[40%] md:min-w-0 md:max-w-[440px] md:flex-shrink-0 md:translate-x-0 md:self-start md:overflow-visible md:!min-h-0`}
        >
          {heroImageUrl ? (
            <>
              <div className="md:hidden">
                <img
                  src={heroImageUrl}
                  alt=""
                  aria-hidden
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/30 to-black/70" />
                <div className="relative flex min-h-[68vh] items-end px-5 pb-14">{heroGuestIntro}</div>
              </div>

              <DesktopGuestLeftColumn
                coverSrc={heroImageUrl}
                propertyName={data.property_name}
                introDesktop={heroGuestIntroDesktop}
                expiryLine={desktopExpiryLine}
                showHostSidebar={showDesktopHostSidebar}
                hostName={data.host_name}
                directBookingUrl={data.social_direct_booking_url ?? null}
                whatsappHref={whatsappHref}
                hostCallHref={hostCallHref}
              />
            </>
          ) : (
            <>
              <div className="md:hidden">
                <div className="relative mx-auto w-full max-w-full">
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
                  <div className="absolute inset-x-0 bottom-0 z-10 px-5 pb-14 pt-12 sm:pt-16">{heroGuestIntro}</div>
                </div>
              </div>

              <DesktopGuestLeftColumn
                coverSrc="/brand/stayvo-guest-hero-fallback.png"
                propertyName={data.property_name}
                introDesktop={heroGuestIntroDesktop}
                expiryLine={desktopExpiryLine}
                showHostSidebar={showDesktopHostSidebar}
                hostName={data.host_name}
                directBookingUrl={data.social_direct_booking_url ?? null}
                whatsappHref={whatsappHref}
                hostCallHref={hostCallHref}
              />
            </>
          )}
        </section>

        <GuestSectionQuickNav
          items={quickNavItems}
          callHref={callHref}
          whatsappHref={whatsappHref}
        />

        {/* ── Content card slides over hero ────────────────────────────── */}
        <div
          className="relative z-10 max-md:left-1/2 max-md:right-1/2 max-md:-mt-10 max-md:w-screen max-md:-translate-x-1/2 max-md:rounded-t-[32px] max-md:bg-gradient-to-br max-md:from-[#FDF6EC] max-md:to-[#FAF0DC] md:z-auto md:mt-0 md:flex-1 md:min-w-0 md:max-w-none md:translate-x-0 md:rounded-none md:bg-transparent"
        >
          <div className="space-y-6 pt-4 pb-12 sm:space-y-8 sm:pt-5 md:space-y-8 md:pt-1 md:pb-14 lg:space-y-10">
          {/* Lockup below hero, above first content section (usually Address) */}
          <div className="flex justify-center px-4 py-0.5 md:hidden">
            <Link
              href="https://stayvo.io"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-md outline-none ring-brand/40 transition-opacity hover:opacity-90 focus-visible:ring-2"
              aria-label="Stayvo — opens in a new tab"
            >
              <Image
                src="/brand/stayvo-guest-logo-lockup.png"
                alt=""
                width={1024}
                height={365}
                priority
                unoptimized
                className="block h-9 w-auto max-w-[min(100%,220px)] sm:h-10"
              />
            </Link>
          </div>

          {orderedSections.map((sectionKey) => {

            /* ── Address ──────────────────────────────────────────── */
            if (sectionKey === 'address') {
              return (
                <section
                  key={sectionKey}
                  className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm md:shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
                >
                  <div className="px-4 pt-4 pb-3 md:px-6 md:pt-6 md:pb-4">
                    <GuestSectionHeading
                      label="Address"
                      icon={
                        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden>
                          <path d="M10 1.75A5.75 5.75 0 0 0 4.25 7.5c0 4.13 4.37 9.4 5.03 10.18a.94.94 0 0 0 1.44 0c.66-.78 5.03-6.05 5.03-10.18A5.75 5.75 0 0 0 10 1.75Zm0 8a2.25 2.25 0 1 1 0-4.5 2.25 2.25 0 0 1 0 4.5Z" />
                        </svg>
                      }
                    />
                    {hasText(data.full_address) ? (
                      <p className="mt-2 whitespace-pre-line text-[13px] leading-relaxed text-slate-600">{data.full_address}</p>
                    ) : null}
                    {(hasText(data.city) || hasText(data.state)) && (
                      <p className="mt-0.5 text-[13px] text-slate-400">
                        {[data.city, data.state].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                  {(data.google_maps_url || data.waze_url) && (
                    <div className="grid grid-cols-2 gap-px border-t border-slate-100 bg-slate-100 md:flex md:flex-row md:gap-3 md:border-0 md:bg-transparent md:px-6 md:pb-6 md:pt-0">
                      {data.google_maps_url ? (
                        <Link
                          href={data.google_maps_url}
                          target="_blank"
                          className="flex items-center justify-center gap-2 bg-white py-3.5 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50 active:bg-slate-100 md:flex-1 md:rounded-full md:border-2 md:border-[#E0A24D] md:bg-white md:py-2.5 md:shadow-sm"
                        >
                          <svg viewBox="0 0 20 20" className="h-4 w-4 text-brand" fill="currentColor" aria-hidden>
                            <path d="M10 1.75A5.75 5.75 0 0 0 4.25 7.5c0 4.13 4.37 9.4 5.03 10.18a.94.94 0 0 0 1.44 0c.66-.78 5.03-6.05 5.03-10.18A5.75 5.75 0 0 0 10 1.75Zm0 8a2.25 2.25 0 1 1 0-4.5 2.25 2.25 0 0 1 0 4.5Z" />
                          </svg>
                          Google Maps
                        </Link>
                      ) : null}
                      {data.waze_url ? (
                        <Link
                          href={data.waze_url}
                          target="_blank"
                          className="flex items-center justify-center gap-2 bg-white py-3.5 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50 active:bg-slate-100 md:flex-1 md:rounded-full md:border-2 md:border-[#E0A24D] md:bg-white md:py-2.5 md:shadow-sm"
                        >
                          <svg viewBox="0 0 20 20" className="h-4 w-4 text-brand" fill="currentColor" aria-hidden>
                            <path d="M10 2a6 6 0 0 1 4.33 10.1l-2.93 3.74a.75.75 0 0 1-1.2 0L7.27 12.1a6 6 0 0 1-1.02-1.35A6 6 0 0 1 10 2Zm0 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z" />
                          </svg>
                          Waze
                        </Link>
                      ) : null}
                    </div>
                  )}
                </section>
              );
            }

            /* ── Parking ──────────────────────────────────────────── */
            if (sectionKey === 'parking') {
              return (
                <section
                  id="parking-section"
                  key={sectionKey}
                  className="scroll-mt-20 rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm md:p-6 md:shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
                >
                  <GuestSectionHeading
                    label="Parking"
                    icon={
                      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden>
                        <path d="M6 3.5A1.5 1.5 0 0 0 4.5 5v10A1.5 1.5 0 0 0 6 16.5h2.25V12h2.5a4.25 4.25 0 0 0 0-8.5H6Zm2.25 2h2.5a1.75 1.75 0 0 1 0 3.5h-2.5v-3.5Z" />
                      </svg>
                    }
                  />
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700">{data.parking_details}</p>
                </section>
              );
            }

            /* ── Check-in ─────────────────────────────────────────── */
            if (sectionKey === 'checkin') {
              const visibleSteps = data.check_in_steps.filter(
                (s) =>
                  s.is_displayed &&
                  (hasText(s.instruction) ||
                    hasText(s.guest_image_path) ||
                    hasText(s.drive_media_url))
              );
              return (
                <section
                  id="checkin-section"
                  key={sectionKey}
                  className="scroll-mt-20 rounded-2xl border border-slate-100 bg-white shadow-sm md:shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
                >
                  <div className="px-4 pt-4 pb-3 md:px-6 md:pt-6 md:pb-4">
                    <GuestSectionHeading
                      label="Check-in guide"
                      icon={
                        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden>
                          <path d="M5.5 2.5a.75.75 0 0 1 .75.75V4h7.5v-.75a.75.75 0 0 1 1.5 0V4h.25A2.25 2.25 0 0 1 17.75 6.25v8.5A2.25 2.25 0 0 1 15.5 17h-11a2.25 2.25 0 0 1-2.25-2.25v-8.5A2.25 2.25 0 0 1 4.5 4h.25v-.75a.75.75 0 0 1 .75-.75Zm-1 6.5a.5.5 0 0 0-.5.5v5.25c0 .41.34.75.75.75h10.5a.75.75 0 0 0 .75-.75V9.5a.5.5 0 0 0-.5-.5h-11Z" />
                        </svg>
                      }
                    />
                  </div>
                  <ol className="pb-4 md:pb-6">
                    {visibleSteps.map((s, idx) => {
                      const hasPhoto = hasText(s.guest_image_path) || hasText(s.drive_media_url);
                      return (
                        <li key={`${s.step_order}-${idx}`} className="flex flex-col">
                          {/* Step row */}
                          <div className="flex items-start gap-3 px-4 pb-2 pt-4 md:px-6 md:pt-5">
                            <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-white">
                              {idx + 1}
                            </span>
                            {hasText(s.instruction) ? (
                              <p className="pt-0.5 text-sm leading-relaxed text-slate-700 md:flex-1">{s.instruction}</p>
                            ) : null}
                          </div>
                          {/* Full-width photo below the step text */}
                          {hasPhoto ? (
                            <div className="mt-1 px-4 pb-4 md:mx-auto md:mt-3 md:w-full md:max-w-[50%] md:px-6 md:pb-6 md:[&_button]:mx-auto md:[&_button]:block md:[&_button]:max-w-full md:[&_img]:max-h-[240px] md:[&_img]:w-full md:[&_img]:max-w-full md:[&_img]:rounded-xl md:[&_img]:object-cover md:[&_img]:aspect-auto">
                              <GuestSectionMedia
                                guestImagePath={s.guest_image_path}
                                driveMediaUrl={s.drive_media_url}
                                guestMediaPublicBase={guestMediaPublicBase}
                              />
                            </div>
                          ) : null}
                          {/* Divider (not last) */}
                          {idx !== visibleSteps.length - 1 ? (
                            <div className="mx-4 border-b-2 border-slate-200 md:mx-6" />
                          ) : null}
                        </li>
                      );
                    })}
                  </ol>
                </section>
              );
            }

            /* ── Wi-Fi ────────────────────────────────────────────── */
            if (sectionKey === 'wifi') {
              return (
                <section
                  id="wifi-section"
                  key={sectionKey}
                  className="scroll-mt-20 rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm md:p-6 md:shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
                >
                  <GuestSectionHeading
                    label="Wi-Fi"
                    icon={
                      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden>
                        <path d="M10 15.75a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3ZM3.3 12.46a.75.75 0 0 0 1.06 1.06 7.98 7.98 0 0 1 11.28 0 .75.75 0 1 0 1.06-1.06 9.48 9.48 0 0 0-13.4 0Zm-2.2-3.28a.75.75 0 0 0 1.05 1.07 11.98 11.98 0 0 1 16.7 0 .75.75 0 1 0 1.05-1.07 13.48 13.48 0 0 0-18.8 0Z" />
                      </svg>
                    }
                  />
                  <div className="mt-4 grid grid-cols-2 gap-3 md:hidden">
                    {hasText(data.wifi_network_name) ? (
                      <div className="rounded-xl bg-slate-50 px-3 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Network</p>
                        <p className="mt-1 font-mono text-sm font-semibold text-slate-800">{data.wifi_network_name}</p>
                      </div>
                    ) : null}
                    {hasText(data.wifi_password) ? (
                      <div className="rounded-xl bg-slate-50 px-3 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Password</p>
                        <CopyTextButton
                          text={data.wifi_password || ''}
                          idleLabel={data.wifi_password || ''}
                          copiedLabel="Copied!"
                          className="mt-1 block font-mono text-sm font-semibold text-brand active:opacity-70"
                        />
                        <p className="mt-1 text-[11px] text-slate-400">Tap password to copy.</p>
                      </div>
                    ) : null}
                  </div>
                  <div className="mt-4 hidden md:block">
                    <div className="grid grid-cols-2 gap-0 overflow-hidden rounded-xl border border-slate-200">
                      {hasText(data.wifi_network_name) ? (
                        <div className="border-r border-slate-200 bg-slate-50/80 px-4 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Network name</p>
                          <p className="mt-1 font-mono text-sm font-semibold text-slate-900">{data.wifi_network_name}</p>
                        </div>
                      ) : (
                        <div className="border-r border-slate-200 bg-slate-50/80 px-4 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Network name</p>
                          <p className="mt-1 text-sm text-slate-400">—</p>
                        </div>
                      )}
                      {hasText(data.wifi_password) ? (
                        <div className="bg-slate-50/80 px-4 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Password</p>
                          <p className="mt-1 font-mono text-sm font-semibold text-slate-900">{data.wifi_password}</p>
                        </div>
                      ) : (
                        <div className="bg-slate-50/80 px-4 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Password</p>
                          <p className="mt-1 text-sm text-slate-400">—</p>
                        </div>
                      )}
                    </div>
                    {hasText(data.wifi_password) ? (
                      <CopyTextButton
                        text={data.wifi_password || ''}
                        idleLabel="Tap to copy password"
                        copiedLabel="Copied!"
                        className="mt-4 flex w-full items-center justify-center rounded-xl border-2 border-[#E0A24D] bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 active:opacity-80"
                      />
                    ) : null}
                  </div>
                </section>
              );
            }

            /* ── House rules ──────────────────────────────────────── */
            if (sectionKey === 'rules') {
              return (
                <section
                  id="rules-section"
                  key={sectionKey}
                  className="scroll-mt-20 rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm md:p-6 md:shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
                >
                  <GuestSectionHeading
                    label="House rules"
                    icon={
                      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden>
                        <path d="M4.25 2.5A1.75 1.75 0 0 0 2.5 4.25v11.5c0 .97.78 1.75 1.75 1.75h11.5c.97 0 1.75-.78 1.75-1.75V7.38a1.75 1.75 0 0 0-.51-1.24l-3.63-3.63a1.75 1.75 0 0 0-1.24-.51H4.25Zm2.25 4a.75.75 0 0 1 .75-.75h5a.75.75 0 0 1 0 1.5h-5A.75.75 0 0 1 6.5 6.5Zm0 3.5a.75.75 0 0 1 .75-.75h5a.75.75 0 0 1 0 1.5h-5a.75.75 0 0 1-.75-.75Zm0 3.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 0 1.5h-3a.75.75 0 0 1-.75-.75Z" />
                      </svg>
                    }
                  />
                  <ul className="mt-4 space-y-3.5">
                    {data.house_rules
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

            /* ── FAQ ──────────────────────────────────────────────── */
            if (sectionKey === 'faq') {
              const faqItems = (data.faqs ?? [])
                .filter((f) => hasText(f.question) && hasText(f.answer))
                .map((f) => ({ question: f.question, answer: f.answer }));
              return (
                <section
                  key={sectionKey}
                  className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm md:p-6 md:shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
                >
                  <GuestSectionHeading
                    label="FAQ"
                    icon={
                      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden>
                        <path d="M10 2.25a7.75 7.75 0 1 0 0 15.5 7.75 7.75 0 0 0 0-15.5Zm0 11a1 1 0 1 1 0 2 1 1 0 0 1 0-2Zm1.05-2.98c-.58.25-.8.52-.8.98a.75.75 0 0 1-1.5 0c0-1.22.78-1.95 1.7-2.35.76-.33 1.3-.58 1.3-1.35a1.75 1.75 0 0 0-3.5 0 .75.75 0 0 1-1.5 0 3.25 3.25 0 1 1 6.5 0c0 1.83-1.4 2.43-2.2 2.77Z" />
                      </svg>
                    }
                  />
                  <FaqAccordion items={faqItems} className="mt-4" />
                </section>
              );
            }

            /* ── Host contact ─────────────────────────────────────── */
            if (sectionKey === 'host') {
              return (
                <section
                  id="host-section"
                  key={sectionKey}
                  className={`scroll-mt-20 rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm md:p-6 md:shadow-[0_2px_12px_rgba(0,0,0,0.06)]${
                    showDesktopHostSidebar ? ' md:hidden' : ''
                  }`}
                >
                  <GuestSectionHeading
                    label="Your host"
                    icon={
                      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden>
                        <path d="M10 2.5a4.25 4.25 0 1 0 0 8.5 4.25 4.25 0 0 0 0-8.5ZM3 16.25A5.75 5.75 0 0 1 8.75 10.5h2.5A5.75 5.75 0 0 1 17 16.25c0 .69-.56 1.25-1.25 1.25h-11A1.25 1.25 0 0 1 3 16.25Z" />
                      </svg>
                    }
                  />
                  {hasText(data.host_name) ? (
                    <p className="mt-2 text-sm font-medium text-slate-800">{data.host_name}</p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {hasText(data.social_direct_booking_url) ? (
                      <a
                        href={(data.social_direct_booking_url ?? '').trim()}
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

            /* ── Custom section ───────────────────────────────────── */
            if (sectionKey.startsWith('custom:')) {
              const idx = Number(sectionKey.split(':')[1] ?? '-1');
              const detail = customDetails.find((d) => d.detail_order === idx);
              if (!detail) return null;
              return (
                <section
                  key={sectionKey}
                  className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm md:p-6 md:shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
                >
                  {hasText(detail.title) ? (
                    <GuestSectionHeading
                      label={detail.title}
                      icon={
                        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden>
                          <path d="M10 2.25a.75.75 0 0 1 .73.57l.85 3.24a.75.75 0 0 0 .53.53l3.24.85a.75.75 0 0 1 0 1.46l-3.24.85a.75.75 0 0 0-.53.53l-.85 3.24a.75.75 0 0 1-1.46 0l-.85-3.24a.75.75 0 0 0-.53-.53l-3.24-.85a.75.75 0 0 1 0-1.46l3.24-.85a.75.75 0 0 0 .53-.53l.85-3.24A.75.75 0 0 1 10 2.25Z" />
                        </svg>
                      }
                    />
                  ) : null}
                  {hasText(detail.message) ? (
                    <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700">{detail.message}</p>
                  ) : null}
                  <GuestSectionMedia
                    guestImagePath={detail.guest_image_path}
                    driveMediaUrl={detail.drive_media_url}
                    guestMediaPublicBase={guestMediaPublicBase}
                  />
                </section>
              );
            }

            return null;
          })}

          {visibleGuidebookTips.length > 0 ? (
            <section className="scroll-mt-20 rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm md:p-6 md:shadow-[0_2px_12px_rgba(0,0,0,0.06)] md:[&_img]:max-h-[240px] md:[&_img]:rounded-xl md:[&_img]:object-cover">
              <GuestSectionHeading
                label="Guidebook tips"
                icon={
                  <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden>
                    <path d="M10 2.25a.75.75 0 0 1 .73.57l.85 3.24a.75.75 0 0 0 .53.53l3.24.85a.75.75 0 0 1 0 1.46l-3.24.85a.75.75 0 0 0-.53.53l-.85 3.24a.75.75 0 0 1-1.46 0l-.85-3.24a.75.75 0 0 0-.53-.53l-3.24-.85a.75.75 0 0 1 0-1.46l3.24-.85a.75.75 0 0 0 .53-.53l.85-3.24A.75.75 0 0 1 10 2.25Z" />
                  </svg>
                }
              />
              <ul className="mt-4 space-y-6">
                {visibleGuidebookTips.map((t, idx) => (
                  <li key={`${t.tip_order}-${idx}`}>
                    {hasText(t.label) ? <p className="text-sm font-semibold text-slate-900">{t.label}</p> : null}
                    {hasText(t.description) ? (
                      <p className="mt-1 text-sm leading-relaxed text-slate-700">{t.description}</p>
                    ) : null}
                    <GuestSectionMedia
                      guestImagePath={t.guest_image_path}
                      driveMediaUrl={t.drive_media_url}
                      guestMediaPublicBase={guestMediaPublicBase}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* Social links */}
          <GuestSocialLinks
            className="pt-2 md:pt-1 md:pb-1"
            links={{
              facebook: data.social_facebook_url,
              instagram: data.social_instagram_url,
              x: data.social_x_url,
              tiktok: data.social_tiktok_url,
              youtube: data.social_youtube_url,
            }}
          />

          <GuestPortalLegalFooter variant={variant} />
        </div>
      </div>
      </div>
    </main>
  );
}
