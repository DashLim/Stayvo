import Link from 'next/link';
import { createSupabasePublicClient } from '@/lib/supabase/public';
import CopyTextButton from '@/app/stay/[token]/CopyTextButton';
import { normalizeSectionOrder, type CustomDetail } from '@/lib/guest-layout';

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
  check_in_steps: Array<{ instruction: string; step_order: number; is_displayed: boolean }>;
  house_rules: Array<{ rule_text: string; rule_order: number; is_displayed: boolean }>;
  guidebook_tips: Array<{
    label: string;
    description: string;
    tip_order: number;
  }>;
  custom_details: Array<{
    detail_order: number;
    title: string;
    message: string;
    is_displayed: boolean;
  }>;
};

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
      <main className="mx-auto min-h-screen max-w-md bg-slate-50 px-4 py-10">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h1 className="text-xl font-semibold">Link not found</h1>
          <p className="mt-2 text-sm text-slate-600">
            This guest link does not exist. Please contact your host for a valid
            link.
          </p>
        </section>
      </main>
    );
  }

  const portal = data[0] as PortalPayload;
  const guestFirstName = (portal.guest_name ?? '').trim();
  const expired =
    portal.is_permanent !== true &&
    portal.expires_at != null &&
    new Date(portal.expires_at).getTime() < Date.now();

  if (expired) {
    return (
      <main className="mx-auto min-h-screen max-w-md bg-slate-50 px-4 py-10">
        <section className="rounded-2xl border border-rose-200 bg-white p-5 shadow-sm">
          <h1 className="text-xl font-semibold text-rose-700">
            This link has expired
          </h1>
          <p className="mt-2 text-sm text-slate-700">
            <span className="font-semibold">{portal.property_name}</span> is no
            longer available from this link.
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Please contact your host for an updated guest link.
          </p>
        </section>
        <p className="mt-6 text-center text-xs text-slate-500">
          Powered by Stayvo
        </p>
      </main>
    );
  }

  const customDetails = ((portal.custom_details ?? []) as Array<
    CustomDetail & { is_displayed: boolean }
  >).filter((d) => d.is_displayed && (hasText(d.title) || hasText(d.message)));

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
    ['checkin', portal.check_in_steps.some((s) => s.is_displayed)],
    ['wifi', hasText(portal.wifi_network_name) || hasText(portal.wifi_password)],
    ['rules', portal.house_rules.some((r) => r.is_displayed)],
    ['guidebook', portal.guidebook_tips.length > 0],
    ['host', hasText(portal.host_name) || hasText(portal.host_whatsapp_number)],
  ]);
  for (const d of customDetails) {
    visibleSectionFlags.set(`custom:${d.detail_order}`, true);
  }

  const orderedSections = normalizeSectionOrder(
    (portal.guest_section_order ?? []) as string[],
    customDetails
  ).filter((key) => visibleSectionFlags.get(key) === true);

  return (
    <main className="mx-auto min-h-screen max-w-md bg-slate-50 px-4 py-5">
      <section className="rounded-2xl bg-brand p-5 text-white shadow-sm">
        <h1 className="text-2xl font-semibold">{portal.property_name}</h1>
        <p className="mt-1 text-sm text-white/90">
          {guestFirstName ? (
            <>
              Welcome {guestFirstName}! Everything you need for your stay is here.
            </>
          ) : (
            <>Welcome! Everything you need for your stay is here.</>
          )}
        </p>
      </section>

      <section className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
        {portal.is_permanent === true ? (
          <>
            This is a <strong>permanent</strong> guest link. It stays valid until
            your host removes it.
          </>
        ) : portal.expires_at ? (
          <>
            This link expires on <strong>{formatDate(portal.expires_at)}</strong>.
          </>
        ) : (
          <>This guest link has no expiry date set.</>
        )}
      </section>

      {orderedSections.map((sectionKey) => {
        if (sectionKey === 'address') {
          return (
            <section
              key={sectionKey}
              className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <h2 className="text-base font-semibold">Address</h2>
              {hasText(portal.full_address) ? (
                <p className="mt-2 text-sm text-slate-700">{portal.full_address}</p>
              ) : null}
              {(hasText(portal.city) || hasText(portal.state)) && (
                <p className="mt-1 text-sm text-slate-500">
                  {[portal.city, portal.state].filter(Boolean).join(', ')}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                {portal.google_maps_url ? (
                  <Link
                    href={portal.google_maps_url}
                    target="_blank"
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700"
                  >
                    Open Google Maps
                  </Link>
                ) : null}
                {portal.waze_url ? (
                  <Link
                    href={portal.waze_url}
                    target="_blank"
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700"
                  >
                    Open Waze
                  </Link>
                ) : null}
              </div>
            </section>
          );
        }

        if (sectionKey === 'parking') {
          return (
            <section
              key={sectionKey}
              className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <h2 className="text-base font-semibold">Parking details</h2>
              <p className="mt-2 text-sm text-slate-700">{portal.parking_details}</p>
            </section>
          );
        }

        if (sectionKey === 'checkin') {
          return (
            <section
              key={sectionKey}
              className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <h2 className="text-base font-semibold">Check-in guide</h2>
              <ol className="mt-2 space-y-2">
                {portal.check_in_steps
                  .filter((s) => s.is_displayed)
                  .map((s, idx) => (
                  <li key={`${s.step_order}-${idx}`} className="flex gap-2">
                    <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                      {idx + 1}
                    </span>
                    <span className="text-sm text-slate-700">{s.instruction}</span>
                  </li>
                ))}
              </ol>
            </section>
          );
        }

        if (sectionKey === 'wifi') {
          return (
            <section
              key={sectionKey}
              className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <h2 className="text-base font-semibold">Wifi</h2>
              {hasText(portal.wifi_network_name) ? (
                <p className="mt-2 text-sm text-slate-700">
                  Network:{' '}
                  <span className="font-semibold">{portal.wifi_network_name}</span>
                </p>
              ) : null}
              {hasText(portal.wifi_password) ? (
                <>
                  <p className="mt-1 text-sm text-slate-700">
                    Password: <CopyTextButton text={portal.wifi_password || ''} />
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Tap password to copy on mobile.
                  </p>
                </>
              ) : null}
            </section>
          );
        }

        if (sectionKey === 'rules') {
          return (
            <section
              key={sectionKey}
              className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <h2 className="text-base font-semibold">House rules</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                {portal.house_rules
                  .filter((r) => r.is_displayed)
                  .map((r, idx) => (
                  <li key={`${r.rule_order}-${idx}`}>{r.rule_text}</li>
                ))}
              </ul>
            </section>
          );
        }

        if (sectionKey === 'guidebook') {
          return (
            <section
              key={sectionKey}
              className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <h2 className="text-base font-semibold">Guidebook tips</h2>
              <div className="mt-2 space-y-2">
                {portal.guidebook_tips.map((tip, idx) => (
                  <article
                    key={`${tip.tip_order}-${idx}`}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                  >
                    <h3 className="text-sm font-semibold text-slate-800">{tip.label}</h3>
                    <p className="mt-1 text-sm text-slate-700">{tip.description}</p>
                  </article>
                ))}
              </div>
            </section>
          );
        }

        if (sectionKey === 'host') {
          return (
            <section
              key={sectionKey}
              className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <h2 className="text-base font-semibold">Host contact</h2>
              {hasText(portal.host_name) ? (
                <p className="mt-2 text-sm text-slate-700">{portal.host_name}</p>
              ) : null}
              {hasText(portal.host_whatsapp_number) ? (
                <Link
                  href={toWhatsappUrl(
                    portal.host_whatsapp_number,
                    portal.host_whatsapp_message
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

        if (sectionKey.startsWith('custom:')) {
          const idx = Number(sectionKey.split(':')[1] ?? '-1');
          const detail = customDetails.find((d) => d.detail_order === idx);
          if (!detail) return null;
          return (
            <section
              key={sectionKey}
              className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              {hasText(detail.title) ? (
                <h2 className="text-base font-semibold">{detail.title}</h2>
              ) : null}
              {hasText(detail.message) ? (
                <p className="mt-2 text-sm text-slate-700">{detail.message}</p>
              ) : null}
            </section>
          );
        }

        return null;
      })}

      <p className="mt-6 pb-4 text-center text-xs text-slate-500">
        Powered by Stayvo
      </p>
    </main>
  );
}

