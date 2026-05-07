import Link from 'next/link';
import GuestSectionMedia from '@/app/_components/GuestSectionMedia';
import GuestSocialLinks from '@/app/_components/GuestSocialLinks';
import FaqAccordion from '@/app/_components/FaqAccordion';
import StayOpenTracker from '@/app/stay/[token]/StayOpenTracker';
import { createSupabasePublicClient } from '@/lib/supabase/public';
import CopyTextButton from '@/app/stay/[token]/CopyTextButton';
import { normalizeSectionOrder, type CustomDetail } from '@/lib/guest-layout';
import { guestPropertyMediaPublicUrl } from '@/lib/guest-property-media';
import type { ReactNode } from 'react';

type PortalPayload = {
  property_id: string;
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
  host_whatsapp_message: string | null;
  host_response_time: string;
  guest_name: string | null;
  checkout_date: string | null;
  expires_at: string | null;
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
  guidebook_tips: Array<{
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
  custom_details: Array<{
    detail_order: number;
    title: string;
    message: string;
    is_displayed: boolean;
    guest_image_path?: string | null;
    drive_media_url?: string | null;
  }>;
  social_facebook_url?: string | null;
  social_instagram_url?: string | null;
  social_x_url?: string | null;
  social_tiktok_url?: string | null;
  social_youtube_url?: string | null;
  social_airbnb_url?: string | null;
};

function toTitleCase(str: string) {
  return str.replace(/\S+/g, (word) => word.charAt(0).toUpperCase() + word.slice(1));
}

function formatDate(dateValue: string) {
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return dateValue;
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

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

function SectionHeading({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <h2 className="flex items-center gap-2.5 text-[15px] font-semibold tracking-tight text-slate-900">
      <span className="text-brand">{icon}</span>
      {label}
    </h2>
  );
}

export default async function StayPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = createSupabasePublicClient();

  const { data, error } = await supabase.rpc('get_guest_portal_by_token', {
    p_token: token,
  });

  if (error || !data || data.length === 0) {
    return (
      <main className="mx-auto min-h-screen max-w-md px-4 py-10">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h1 className="text-xl font-semibold">Link not found</h1>
          <p className="mt-2 text-sm text-slate-600">
            This guest link does not exist. Please contact your host for a valid link.
          </p>
        </section>
      </main>
    );
  }

  const portal = data[0] as PortalPayload;
  const guestFirstName = toTitleCase((portal.guest_name ?? '').trim());
  const expired =
    portal.is_permanent !== true &&
    portal.expires_at != null &&
    new Date(portal.expires_at).getTime() < Date.now();

  if (expired) {
    return (
      <main className="mx-auto min-h-screen max-w-md px-4 py-10">
        <section className="rounded-2xl border border-rose-200 bg-white p-5 shadow-sm">
          <h1 className="text-xl font-semibold text-rose-700">This link has expired</h1>
          <p className="mt-2 text-sm text-slate-700">
            <span className="font-semibold">{portal.property_name}</span> is no longer available
            from this link.
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Please contact your host for an updated guest link.
          </p>
        </section>
        <p className="mt-6 text-center text-xs text-slate-400">Powered by Stayvo</p>
      </main>
    );
  }

  const customDetails = ((portal.custom_details ?? []) as Array<
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
      hasText(portal.full_address) ||
        hasText(portal.city) ||
        hasText(portal.state) ||
        hasText(portal.google_maps_url) ||
        hasText(portal.waze_url),
    ],
    ['parking', hasText(portal.parking_details)],
    [
      'checkin',
      portal.check_in_steps.some(
        (s) =>
          s.is_displayed &&
          (hasText(s.instruction) ||
            hasText(s.guest_image_path) ||
            hasText(s.drive_media_url))
      ),
    ],
    ['wifi', hasText(portal.wifi_network_name) || hasText(portal.wifi_password)],
    [
      'faq',
      (portal.faqs ?? []).some((f) => hasText(f.question) && hasText(f.answer)),
    ],
    ['rules', portal.house_rules.some((r) => r.is_displayed)],
    [
      'guidebook',
      portal.guidebook_tips.some(
        (t) =>
          hasText(t.label) ||
          hasText(t.description) ||
          hasText(t.guest_image_path) ||
          hasText(t.drive_media_url)
      ),
    ],
    ['host', hasText(portal.host_name) || hasText(portal.host_whatsapp_number)],
  ]);
  for (const d of customDetails) {
    visibleSectionFlags.set(`custom:${d.detail_order}`, true);
  }

  const orderedSections = normalizeSectionOrder(
    (portal.guest_section_order ?? []) as string[],
    customDetails
  ).filter((key) => visibleSectionFlags.get(key) === true);

  const heroImageUrl = guestPropertyMediaPublicUrl(portal.hero_image_path);

  return (
    <main className="min-h-screen overflow-x-hidden">
      <StayOpenTracker token={token} />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section
        className={`relative left-1/2 right-1/2 min-h-[68vh] w-screen -translate-x-1/2 overflow-hidden ${heroImageUrl ? '' : 'bg-brand'}`}
      >
        {heroImageUrl ? (
          <>
            <img
              src={heroImageUrl}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div
              className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/30 to-black/70"
            />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-brand to-amber-600" />
        )}

        {/* Small Stayvo watermark top-left */}
        <div className="absolute left-4 top-4 z-10">
          <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            Stayvo
          </span>
        </div>

        {/* Property name + guest greeting anchored to bottom */}
        <div className="relative flex min-h-[68vh] items-end px-5 pb-14">
          <div>
            <h1
              className="text-2xl font-bold leading-tight tracking-tight text-white"
              style={{ textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}
            >
              {portal.property_name}
            </h1>
            {guestFirstName ? (
              <p
                className="mt-1.5 text-sm font-medium text-white/90"
                style={{ textShadow: '0 1px 6px rgba(0,0,0,0.45)' }}
              >
                Welcome, {guestFirstName} 👋
              </p>
            ) : null}
            {portal.checkout_date ? (
              <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 opacity-80" fill="currentColor" aria-hidden>
                  <path d="M5 2.5a.5.5 0 0 0-1 0V4H3a1.5 1.5 0 0 0-1.5 1.5v7A1.5 1.5 0 0 0 3 14h10a1.5 1.5 0 0 0 1.5-1.5v-7A1.5 1.5 0 0 0 13 4h-1V2.5a.5.5 0 0 0-1 0V4H5V2.5ZM2.5 7.5h11v5a.5.5 0 0 1-.5.5H3a.5.5 0 0 1-.5-.5v-5Z" />
                </svg>
                Check-out: {formatDate(portal.checkout_date)}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      {/* ── Content card slides over hero ────────────────────────────── */}
      <div
        className="relative left-1/2 right-1/2 z-10 -mt-10 w-screen -translate-x-1/2 rounded-t-[32px]"
        style={{ background: 'linear-gradient(160deg, #FDF6EC 0%, #FAF0DC 100%)' }}
      >
        <div className="pt-6 pb-12 space-y-3">

          {orderedSections.map((sectionKey) => {

            /* ── Address ──────────────────────────────────────────── */
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
                    {hasText(portal.full_address) ? (
                      <p className="mt-2 text-[13px] leading-relaxed text-slate-600">{portal.full_address}</p>
                    ) : null}
                    {(hasText(portal.city) || hasText(portal.state)) && (
                      <p className="mt-0.5 text-[13px] text-slate-400">
                        {[portal.city, portal.state].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                  {(portal.google_maps_url || portal.waze_url) && (
                    <div className="grid grid-cols-2 gap-px border-t border-slate-100 bg-slate-100">
                      {portal.google_maps_url ? (
                        <Link
                          href={portal.google_maps_url}
                          target="_blank"
                          className="flex items-center justify-center gap-2 bg-white py-3.5 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50 active:bg-slate-100"
                        >
                          <svg viewBox="0 0 20 20" className="h-4 w-4 text-brand" fill="currentColor" aria-hidden>
                            <path d="M10 1.75A5.75 5.75 0 0 0 4.25 7.5c0 4.13 4.37 9.4 5.03 10.18a.94.94 0 0 0 1.44 0c.66-.78 5.03-6.05 5.03-10.18A5.75 5.75 0 0 0 10 1.75Zm0 8a2.25 2.25 0 1 1 0-4.5 2.25 2.25 0 0 1 0 4.5Z" />
                          </svg>
                          Google Maps
                        </Link>
                      ) : null}
                      {portal.waze_url ? (
                        <Link
                          href={portal.waze_url}
                          target="_blank"
                          className="flex items-center justify-center gap-2 bg-white py-3.5 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50 active:bg-slate-100"
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
                <section key={sectionKey} className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
                  <SectionHeading
                    label="Parking"
                    icon={
                      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden>
                        <path d="M6 3.5A1.5 1.5 0 0 0 4.5 5v10A1.5 1.5 0 0 0 6 16.5h2.25V12h2.5a4.25 4.25 0 0 0 0-8.5H6Zm2.25 2h2.5a1.75 1.75 0 0 1 0 3.5h-2.5v-3.5Z" />
                      </svg>
                    }
                  />
                  <p className="mt-2 text-sm leading-relaxed text-slate-700">{portal.parking_details}</p>
                </section>
              );
            }

            /* ── Check-in ─────────────────────────────────────────── */
            if (sectionKey === 'checkin') {
              const visibleSteps = portal.check_in_steps.filter(
                (s) =>
                  s.is_displayed &&
                  (hasText(s.instruction) ||
                    hasText(s.guest_image_path) ||
                    hasText(s.drive_media_url))
              );
              return (
                <section key={sectionKey} className="rounded-2xl border border-slate-100 bg-white shadow-sm">
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
                          {/* Step row */}
                          <div className="flex items-start gap-3 px-4 py-2">
                            <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-white">
                              {idx + 1}
                            </span>
                            {hasText(s.instruction) ? (
                              <p className="pt-0.5 text-sm leading-relaxed text-slate-700">{s.instruction}</p>
                            ) : null}
                          </div>
                          {/* Full-width photo below the step text */}
                          {hasPhoto ? (
                            <div className="mt-1 px-4 pb-2">
                              <GuestSectionMedia
                                guestImagePath={s.guest_image_path}
                                driveMediaUrl={s.drive_media_url}
                              />
                            </div>
                          ) : null}
                          {/* Divider (not last) */}
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

            /* ── Wi-Fi ────────────────────────────────────────────── */
            if (sectionKey === 'wifi') {
              return (
                <section key={sectionKey} className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
                  <SectionHeading
                    label="Wi-Fi"
                    icon={
                      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden>
                        <path d="M10 15.75a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3ZM3.3 12.46a.75.75 0 0 0 1.06 1.06 7.98 7.98 0 0 1 11.28 0 .75.75 0 1 0 1.06-1.06 9.48 9.48 0 0 0-13.4 0Zm-2.2-3.28a.75.75 0 0 0 1.05 1.07 11.98 11.98 0 0 1 16.7 0 .75.75 0 1 0 1.05-1.07 13.48 13.48 0 0 0-18.8 0Z" />
                      </svg>
                    }
                  />
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    {hasText(portal.wifi_network_name) ? (
                      <div className="rounded-xl bg-slate-50 px-3 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Network</p>
                        <p className="mt-1 font-mono text-sm font-semibold text-slate-800">{portal.wifi_network_name}</p>
                      </div>
                    ) : null}
                    {hasText(portal.wifi_password) ? (
                      <div className="rounded-xl bg-slate-50 px-3 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Password</p>
                        <CopyTextButton
                          text={portal.wifi_password || ''}
                          idleLabel={portal.wifi_password || ''}
                          copiedLabel="Copied!"
                          className="mt-1 block font-mono text-sm font-semibold text-brand active:opacity-70"
                        />
                      </div>
                    ) : null}
                  </div>
                  {hasText(portal.wifi_password) ? (
                    <p className="mt-2 text-[11px] text-slate-400">Tap password to copy.</p>
                  ) : null}
                </section>
              );
            }

            /* ── House rules ──────────────────────────────────────── */
            if (sectionKey === 'rules') {
              return (
                <section key={sectionKey} className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
                  <SectionHeading
                    label="House rules"
                    icon={
                      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden>
                        <path d="M4.25 2.5A1.75 1.75 0 0 0 2.5 4.25v11.5c0 .97.78 1.75 1.75 1.75h11.5c.97 0 1.75-.78 1.75-1.75V7.38a1.75 1.75 0 0 0-.51-1.24l-3.63-3.63a1.75 1.75 0 0 0-1.24-.51H4.25Zm2.25 4a.75.75 0 0 1 .75-.75h5a.75.75 0 0 1 0 1.5h-5A.75.75 0 0 1 6.5 6.5Zm0 3.5a.75.75 0 0 1 .75-.75h5a.75.75 0 0 1 0 1.5h-5a.75.75 0 0 1-.75-.75Zm0 3.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 0 1.5h-3a.75.75 0 0 1-.75-.75Z" />
                      </svg>
                    }
                  />
                  <ul className="mt-3 space-y-2.5">
                    {portal.house_rules
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
              const faqItems = (portal.faqs ?? [])
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

            /* ── Guidebook ────────────────────────────────────────── */
            if (sectionKey === 'guidebook') {
              return (
                <section key={sectionKey} className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
                  <SectionHeading
                    label="Guidebook"
                    icon={
                      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden>
                        <path d="M4.75 3A2.75 2.75 0 0 0 2 5.75v8.5A2.75 2.75 0 0 0 4.75 17h10.5A2.75 2.75 0 0 0 18 14.25v-8.5A2.75 2.75 0 0 0 15.25 3H4.75ZM5.5 6.5a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 5.5 6.5Zm0 3a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1-.75-.75Zm0 3a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1-.75-.75Z" />
                      </svg>
                    }
                  />
                  <div className="mt-3 space-y-3">
                    {portal.guidebook_tips
                      .filter(
                        (tip) =>
                          hasText(tip.label) ||
                          hasText(tip.description) ||
                          hasText(tip.guest_image_path) ||
                          hasText(tip.drive_media_url)
                      )
                      .map((tip, idx) => (
                        <div key={`${tip.tip_order}-${idx}`}>
                          {idx > 0 ? <div className="mb-3 border-t border-slate-100" /> : null}
                          {hasText(tip.label) ? (
                            <h3 className="text-sm font-semibold text-slate-800">{tip.label}</h3>
                          ) : null}
                          {hasText(tip.description) ? (
                            <p className="mt-1 text-sm leading-relaxed text-slate-600">{tip.description}</p>
                          ) : null}
                          <GuestSectionMedia
                            guestImagePath={tip.guest_image_path}
                            driveMediaUrl={tip.drive_media_url}
                          />
                        </div>
                      ))}
                  </div>
                </section>
              );
            }

            /* ── Host contact ─────────────────────────────────────── */
            if (sectionKey === 'host') {
              return (
                <section key={sectionKey} className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
                  <SectionHeading
                    label="Your host"
                    icon={
                      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden>
                        <path d="M10 2.5a4.25 4.25 0 1 0 0 8.5 4.25 4.25 0 0 0 0-8.5ZM3 16.25A5.75 5.75 0 0 1 8.75 10.5h2.5A5.75 5.75 0 0 1 17 16.25c0 .69-.56 1.25-1.25 1.25h-11A1.25 1.25 0 0 1 3 16.25Z" />
                      </svg>
                    }
                  />
                  {hasText(portal.host_name) ? (
                    <p className="mt-2 text-sm font-medium text-slate-800">{portal.host_name}</p>
                  ) : null}
                  {hasText(portal.host_whatsapp_number) ? (
                    <Link
                      href={toWhatsappUrl(portal.host_whatsapp_number, portal.host_whatsapp_message)}
                      target="_blank"
                      className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white shadow-sm active:opacity-80"
                    >
                      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden>
                        <path d="M10 2a8 8 0 0 0-7.07 11.73L2 18l4.4-.93A8 8 0 1 0 10 2Zm0 14.5a6.5 6.5 0 0 1-3.32-.91l-.24-.14-2.62.56.56-2.55-.15-.25A6.5 6.5 0 1 1 10 16.5Zm3.58-4.85c-.2-.1-1.17-.58-1.35-.65-.18-.07-.31-.1-.44.1-.13.2-.5.65-.62.78-.11.14-.23.15-.43.05-.2-.1-.84-.31-1.6-.99-.59-.53-.99-1.18-1.1-1.38-.12-.2-.01-.3.09-.4l.38-.44c.1-.12.13-.2.2-.33.07-.14.03-.26-.02-.36-.05-.1-.44-1.07-.6-1.46-.16-.38-.32-.33-.44-.34H7.2c-.13 0-.34.05-.52.25-.18.2-.68.67-.68 1.62s.7 1.88.8 2.01c.1.13 1.37 2.1 3.33 2.94.47.2.83.32 1.12.41.47.15.9.13 1.24.08.38-.06 1.17-.48 1.33-.94.16-.46.16-.86.12-.94-.05-.09-.18-.13-.38-.23Z" />
                      </svg>
                      Message on WhatsApp
                    </Link>
                  ) : null}
                </section>
              );
            }

            /* ── Custom section ───────────────────────────────────── */
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
                  />
                </section>
              );
            }

            return null;
          })}

          {/* Social links */}
          <GuestSocialLinks
            className="pt-4"
            links={{
              facebook: portal.social_facebook_url,
              instagram: portal.social_instagram_url,
              x: portal.social_x_url,
              tiktok: portal.social_tiktok_url,
              youtube: portal.social_youtube_url,
              airbnb: portal.social_airbnb_url,
            }}
          />

          <p className="pt-4 text-center text-[11px] text-slate-400">Powered by Stayvo</p>
        </div>
      </div>
    </main>
  );
}
