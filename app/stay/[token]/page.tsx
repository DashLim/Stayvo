import Link from 'next/link';
import { createSupabasePublicClient } from '@/lib/supabase/public';
import CopyTextButton from '@/app/stay/[token]/CopyTextButton';

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
  host_response_time: string;
  guest_name: string;
  checkout_date: string | null;
  expires_at: string | null;
  is_permanent?: boolean | null;
  check_in_steps: Array<{ instruction: string; step_order: number }>;
  house_rules: Array<{ rule_text: string; rule_order: number }>;
  guidebook_tips: Array<{
    label: string;
    description: string;
    tip_order: number;
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

function toWhatsappUrl(phone: string) {
  const cleaned = phone.replace(/[^\d+]/g, '').replace(/^00/, '+');
  const withoutPlus = cleaned.startsWith('+') ? cleaned.slice(1) : cleaned;
  const message = encodeURIComponent(
    "Hi! I'm your guest and need help with my Stayvo portal details."
  );
  return `https://wa.me/${withoutPlus}?text=${message}`;
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

  return (
    <main className="mx-auto min-h-screen max-w-md bg-slate-50 px-4 py-5">
      <section className="rounded-2xl bg-brand p-5 text-white shadow-sm">
        <h1 className="text-2xl font-semibold">{portal.property_name}</h1>
        <p className="mt-1 text-sm text-white/90">
          Welcome {portal.guest_name}! Everything you need for your stay is here.
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

      <section className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold">Address</h2>
        <p className="mt-2 text-sm text-slate-700">{portal.full_address}</p>
        <p className="mt-1 text-sm text-slate-500">
          {portal.city}, {portal.state}
        </p>
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

      {portal.parking_details ? (
        <section className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold">Parking details</h2>
          <p className="mt-2 text-sm text-slate-700">{portal.parking_details}</p>
        </section>
      ) : null}

      <section className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold">Check-in guide</h2>
        <ol className="mt-2 space-y-2">
          {portal.check_in_steps.length > 0 ? (
            portal.check_in_steps.map((s, idx) => (
              <li key={`${s.step_order}-${idx}`} className="flex gap-2">
                <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                  {idx + 1}
                </span>
                <span className="text-sm text-slate-700">{s.instruction}</span>
              </li>
            ))
          ) : (
            <li className="text-sm text-slate-500">No check-in steps provided.</li>
          )}
        </ol>
      </section>

      <section className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold">Wifi</h2>
        <p className="mt-2 text-sm text-slate-700">
          Network: <span className="font-semibold">{portal.wifi_network_name || '-'}</span>
        </p>
        <p className="mt-1 text-sm text-slate-700">
          Password: <CopyTextButton text={portal.wifi_password || '-'} />
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Tap password to copy on mobile.
        </p>
      </section>

      <section className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold">House rules</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
          {portal.house_rules.length > 0 ? (
            portal.house_rules.map((r, idx) => (
              <li key={`${r.rule_order}-${idx}`}>{r.rule_text}</li>
            ))
          ) : (
            <li>No house rules provided.</li>
          )}
        </ul>
      </section>

      <section className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold">Guidebook tips</h2>
        <div className="mt-2 space-y-2">
          {portal.guidebook_tips.length > 0 ? (
            portal.guidebook_tips.map((tip, idx) => (
              <article
                key={`${tip.tip_order}-${idx}`}
                className="rounded-lg border border-slate-200 bg-slate-50 p-3"
              >
                <h3 className="text-sm font-semibold text-slate-800">
                  {tip.label}
                </h3>
                <p className="mt-1 text-sm text-slate-700">{tip.description}</p>
              </article>
            ))
          ) : (
            <p className="text-sm text-slate-500">No tips provided.</p>
          )}
        </div>
      </section>

      <section className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold">Host contact</h2>
        <p className="mt-2 text-sm text-slate-700">{portal.host_name}</p>
        <p className="mt-1 text-sm text-slate-600">
          Typically responds {portal.host_response_time}
        </p>
        <Link
          href={toWhatsappUrl(portal.host_whatsapp_number)}
          target="_blank"
          className="mt-3 inline-flex rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white"
        >
          Contact on WhatsApp
        </Link>
      </section>

      <p className="mt-6 pb-4 text-center text-xs text-slate-500">
        Powered by Stayvo
      </p>
    </main>
  );
}

