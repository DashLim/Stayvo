import { redirect } from 'next/navigation';
import PreviewClient from '@/app/properties/[propertyId]/preview/PreviewClient';
import { parseGuestSectionOrderFromDb } from '@/lib/guest-layout';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function PropertyPreviewPage({
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

  if (userError || !user) {
    redirect(`/login?redirect=/properties/${propertyId}/preview`);
  }

  const { data: property, error: propertyError } = await supabase
    .from('properties')
    .select(
      'id, property_name, full_address, city, state, google_maps_url, waze_url, parking_details, wifi_network_name, wifi_password, host_name, host_whatsapp_number, host_whatsapp_message, guest_section_order'
    )
    .eq('id', propertyId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (propertyError || !property) redirect('/dashboard');

  const [
    { data: steps, error: stepsError },
    { data: rules, error: rulesError },
    { data: tips, error: tipsError },
    { data: customDetails, error: customDetailsError },
  ] = await Promise.all([
    supabase
      .from('property_check_in_steps')
      .select('instruction, step_order, is_displayed')
      .eq('property_id', propertyId)
      .order('step_order', { ascending: true }),
    supabase
      .from('property_house_rules')
      .select('rule_text, rule_order, is_displayed')
      .eq('property_id', propertyId)
      .order('rule_order', { ascending: true }),
    supabase
      .from('property_guidebook_tips')
      .select('label, description, tip_order')
      .eq('property_id', propertyId)
      .order('tip_order', { ascending: true }),
    supabase
      .from('property_custom_details')
      .select('detail_order, title, message, is_displayed')
      .eq('property_id', propertyId)
      .order('detail_order', { ascending: true }),
  ]);

  if (stepsError || rulesError || tipsError || customDetailsError) {
    redirect('/dashboard');
  }

  return (
    <PreviewClient
      propertyId={property.id}
      propertyName={property.property_name ?? 'Property'}
      fullAddress={property.full_address ?? ''}
      city={property.city ?? ''}
      state={property.state ?? ''}
      googleMapsUrl={property.google_maps_url ?? null}
      wazeUrl={property.waze_url ?? null}
      parkingDetails={property.parking_details ?? null}
      wifiNetworkName={property.wifi_network_name ?? null}
      wifiPassword={property.wifi_password ?? null}
      hostName={property.host_name ?? ''}
      hostWhatsappNumber={property.host_whatsapp_number ?? ''}
      hostWhatsappMessage={property.host_whatsapp_message ?? null}
      checkInSteps={(steps ?? []).map((s) => ({
        instruction: s.instruction ?? '',
        step_order: s.step_order ?? 0,
        is_displayed: s.is_displayed ?? true,
      }))}
      houseRules={(rules ?? []).map((r) => ({
        rule_text: r.rule_text ?? '',
        rule_order: r.rule_order ?? 0,
        is_displayed: r.is_displayed ?? true,
      }))}
      guidebookTips={(tips ?? []).map((t) => ({
        label: t.label ?? '',
        description: t.description ?? '',
        tip_order: t.tip_order ?? 0,
      }))}
      customDetails={(customDetails ?? []).map((d) => ({
        detail_order: d.detail_order ?? 0,
        title: d.title ?? '',
        message: d.message ?? '',
        is_displayed: d.is_displayed ?? true,
      }))}
      guestSectionOrder={
        parseGuestSectionOrderFromDb(property.guest_section_order) ?? []
      }
    />
  );
}
