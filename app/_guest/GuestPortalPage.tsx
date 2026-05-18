import Link from 'next/link';
import Image from 'next/image';
import GuestPortalView, { type GuestPortalViewData } from '@/app/_guest/GuestPortalView';
import { createSupabasePublicClient } from '@/lib/supabase/public';
import { guestPropertyMediaResolvedPublicBase } from '@/lib/guest-property-media';
import type { CustomDetail } from '@/lib/guest-layout';

type PortalPayload = GuestPortalViewData & {
  property_id: string;
  host_whatsapp_message: string | null;
  host_response_time: string;
  social_airbnb_url?: string | null;
};

export default async function GuestPortalPage({ token }: { token: string }) {
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
            <span className="inline-block whitespace-pre-line font-semibold">{portal.property_name}</span>{' '}
            is no longer available from this link.
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Please contact your host for an updated guest link.
          </p>
        </section>
        <div className="mt-5 flex justify-center">
          <span className="inline-flex flex-col items-center gap-1.5 text-[11px] text-slate-500">
            <span>Powered by</span>
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
                unoptimized
                className="h-7 w-auto max-w-[180px]"
              />
            </Link>
          </span>
        </div>
      </main>
    );
  }

  const guestMediaPublicBase = guestPropertyMediaResolvedPublicBase();

  const viewData: GuestPortalViewData = {
    property_name: portal.property_name,
    full_address: portal.full_address,
    city: portal.city,
    state: portal.state,
    google_maps_url: portal.google_maps_url,
    waze_url: portal.waze_url,
    parking_details: portal.parking_details,
    wifi_network_name: portal.wifi_network_name,
    wifi_password: portal.wifi_password,
    host_name: portal.host_name,
    host_whatsapp_number: portal.host_whatsapp_number,
    host_whatsapp_chat_number: portal.host_whatsapp_chat_number,
    guest_name: portal.guest_name,
    checkout_date: portal.checkout_date,
    expires_at: portal.expires_at,
    is_permanent: portal.is_permanent,
    guest_section_order: portal.guest_section_order,
    hero_image_path: portal.hero_image_path,
    check_in_steps: portal.check_in_steps,
    house_rules: portal.house_rules,
    guidebook_tips: portal.guidebook_tips,
    faqs: portal.faqs ?? [],
    custom_details: (portal.custom_details ?? []) as Array<
      CustomDetail & {
        is_displayed: boolean;
        guest_image_path?: string | null;
        drive_media_url?: string | null;
      }
    >,
    social_facebook_url: portal.social_facebook_url,
    social_instagram_url: portal.social_instagram_url,
    social_x_url: portal.social_x_url,
    social_tiktok_url: portal.social_tiktok_url,
    social_youtube_url: portal.social_youtube_url,
    social_direct_booking_url: portal.social_direct_booking_url,
  };

  return (
    <GuestPortalView
      variant="guest"
      token={token}
      data={viewData}
      guestMediaPublicBase={guestMediaPublicBase}
    />
  );
}
