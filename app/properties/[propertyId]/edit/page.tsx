import { redirect } from 'next/navigation';
import PropertyFormClient from '@/app/properties/_components/PropertyFormClient';
import { getHostTier } from '@/lib/host-plan';
import { parseGuestSectionOrderFromDb } from '@/lib/guest-layout';
import { guestPropertyMediaResolvedPublicBase } from '@/lib/guest-property-media';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ propertyId: string }>;
}) {
  const { propertyId } = await params;
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) redirect('/login?redirect=/dashboard');

  const [{ data: property, error: propertyError }, { data: locations }] =
    await Promise.all([
      supabase
        .from('properties')
        // Use * so older DBs without optional columns (e.g. host_whatsapp_chat_number) still load.
        .select('*')
        .eq('id', propertyId)
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('locations')
        .select('id, name')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true }),
    ]);

  if (propertyError || !property) redirect('/dashboard');

  const row = property as Record<string, unknown>;
  const hostWhatsappChat =
    typeof row.host_whatsapp_chat_number === 'string'
      ? row.host_whatsapp_chat_number
      : '';

  const [
    { data: steps, error: stepsError },
    { data: rules, error: rulesError },
    { data: faqs, error: faqsError },
    { data: customDetails, error: customDetailsError },
  ] = await Promise.all([
    supabase
      .from('property_check_in_steps')
      .select('instruction, step_order, is_displayed, guest_image_path, drive_media_url')
      .eq('property_id', propertyId)
      .order('step_order', { ascending: true }),
    supabase
      .from('property_house_rules')
      .select('rule_text, rule_order, is_displayed')
      .eq('property_id', propertyId)
      .order('rule_order', { ascending: true }),
    supabase
      .from('property_faqs')
      .select('question, answer, faq_order')
      .eq('property_id', propertyId)
      .order('faq_order', { ascending: true }),
    supabase
      .from('property_custom_details')
      .select('title, message, detail_order, is_displayed, guest_image_path, drive_media_url')
      .eq('property_id', propertyId)
      .order('detail_order', { ascending: true }),
  ]);

  if (stepsError || rulesError || faqsError || customDetailsError) redirect('/dashboard');

  const hostTier = await getHostTier(supabase, user.id);
  const guestMediaPublicBase = guestPropertyMediaResolvedPublicBase();

  return (
    <PropertyFormClient
      mode="edit"
      propertyId={propertyId}
      locations={locations ?? []}
      hostTier={hostTier}
      guestMediaPublicBase={guestMediaPublicBase}
      initialValues={{
        isLive: Boolean(property.is_live),
        locationId: property.location_id ?? '',
        propertyName: property.property_name ?? '',
        internalName: property.internal_name ?? '',
        fullAddress: property.full_address ?? '',
        googleMapsUrl: property.google_maps_url ?? '',
        wazeUrl: property.waze_url ?? '',
        parkingDetails: property.parking_details ?? '',
        wifiNetworkName: property.wifi_network_name ?? '',
        wifiPassword: property.wifi_password ?? '',
        hostName: property.host_name ?? '',
        hostWhatsappNumber: property.host_whatsapp_number ?? '',
        hostWhatsappChatNumber: hostWhatsappChat,
        checkInInstructions: (steps ?? []).map((s) => ({
          instruction: s.instruction ?? '',
          isDisplayed: s.is_displayed ?? true,
          guestImagePath: s.guest_image_path ?? '',
        })),
        houseRules: (rules ?? []).map((r) => ({
          ruleText: r.rule_text ?? '',
          isDisplayed: r.is_displayed ?? true,
        })),
        faqs: (faqs ?? []).map((f) => ({
          question: f.question ?? '',
          answer: f.answer ?? '',
        })),
        customDetails: (customDetails ?? []).map((d) => ({
          title: d.title ?? '',
          message: d.message ?? '',
          isDisplayed: d.is_displayed ?? true,
          guestImagePath: d.guest_image_path ?? '',
        })),
        guestSectionOrder: parseGuestSectionOrderFromDb(
          property.guest_section_order
        ),
        heroImagePath: property.hero_image_path ?? '',
        socialFacebookUrl: property.social_facebook_url ?? '',
        socialInstagramUrl: property.social_instagram_url ?? '',
        socialXUrl: property.social_x_url ?? '',
        socialTiktokUrl: property.social_tiktok_url ?? '',
        socialYoutubeUrl: property.social_youtube_url ?? '',
        socialDirectBookingUrl:
          (property as { social_direct_booking_url?: string | null })
            .social_direct_booking_url ?? '',
      }}
    />
  );
}


