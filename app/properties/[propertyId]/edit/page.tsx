import { redirect } from 'next/navigation';
import PropertyForm from '@/app/properties/_components/PropertyForm';
import { parseGuestSectionOrderFromDb } from '@/lib/guest-layout';
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
        .select(
          'id, property_name, internal_name, full_address, google_maps_url, waze_url, parking_details, wifi_network_name, wifi_password, is_live, host_name, host_whatsapp_number, host_whatsapp_message, guest_section_order, location_id, hero_image_path, social_facebook_url, social_instagram_url, social_x_url, social_tiktok_url, social_youtube_url, social_airbnb_url'
        )
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

  const [
    { data: steps, error: stepsError },
    { data: rules, error: rulesError },
    { data: tips, error: tipsError },
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
      .from('property_guidebook_tips')
      .select('label, description, tip_order, guest_image_path, drive_media_url')
      .eq('property_id', propertyId)
      .order('tip_order', { ascending: true }),
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

  if (stepsError || rulesError || tipsError || faqsError || customDetailsError) redirect('/dashboard');

  return (
    <PropertyForm
      mode="edit"
      propertyId={propertyId}
      locations={locations ?? []}
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
        hostWhatsappMessage: property.host_whatsapp_message ?? '',
        checkInInstructions: (steps ?? []).map((s) => ({
          instruction: s.instruction ?? '',
          isDisplayed: s.is_displayed ?? true,
          guestImagePath: s.guest_image_path ?? '',
        })),
        houseRules: (rules ?? []).map((r) => ({
          ruleText: r.rule_text ?? '',
          isDisplayed: r.is_displayed ?? true,
        })),
        guidebookTips: (tips ?? []).map((t) => ({
          label: t.label ?? '',
          description: t.description ?? '',
          guestImagePath: t.guest_image_path ?? '',
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
        socialAirbnbUrl: property.social_airbnb_url ?? '',
      }}
    />
  );
}

