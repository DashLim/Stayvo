'use client';

import Link from 'next/link';
import GuestPortalView, { type GuestPortalViewData } from '@/app/_guest/GuestPortalView';

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
  checkInSteps: GuestPortalViewData['check_in_steps'];
  houseRules: GuestPortalViewData['house_rules'];
  faqs: GuestPortalViewData['faqs'];
  customDetails: GuestPortalViewData['custom_details'];
  guestSectionOrder: string[];
  heroImagePath?: string | null;
  socialFacebookUrl?: string | null;
  socialInstagramUrl?: string | null;
  socialXUrl?: string | null;
  socialTiktokUrl?: string | null;
  socialYoutubeUrl?: string | null;
  socialDirectBookingUrl?: string | null;
  guestMediaPublicBase?: string | null;
};

export default function PreviewClient(props: PreviewClientProps) {
  const data: GuestPortalViewData = {
    property_name: props.propertyName,
    full_address: props.fullAddress,
    city: props.city,
    state: props.state,
    google_maps_url: props.googleMapsUrl,
    waze_url: props.wazeUrl,
    parking_details: props.parkingDetails,
    wifi_network_name: props.wifiNetworkName,
    wifi_password: props.wifiPassword,
    host_name: props.hostName,
    host_whatsapp_number: props.hostWhatsappNumber,
    host_whatsapp_chat_number: props.hostWhatsappChatNumber,
    check_in_steps: props.checkInSteps,
    house_rules: props.houseRules,
    faqs: props.faqs,
    custom_details: props.customDetails,
    guest_section_order: props.guestSectionOrder,
    hero_image_path: props.heroImagePath,
    social_facebook_url: props.socialFacebookUrl,
    social_instagram_url: props.socialInstagramUrl,
    social_x_url: props.socialXUrl,
    social_tiktok_url: props.socialTiktokUrl,
    social_youtube_url: props.socialYoutubeUrl,
    social_direct_booking_url: props.socialDirectBookingUrl,
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-white/60 bg-white/85 backdrop-blur-xl">
        <div
          className="mx-auto flex w-full max-w-[1100px] items-center justify-between px-4 pb-2 pt-4 md:px-8"
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
      <GuestPortalView variant="preview" data={data} guestMediaPublicBase={props.guestMediaPublicBase ?? null} />
    </div>
  );
}
