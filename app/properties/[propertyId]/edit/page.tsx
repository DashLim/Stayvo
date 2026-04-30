import { redirect } from 'next/navigation';
import PropertyForm from '@/app/properties/_components/PropertyForm';
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

  const { data: property, error: propertyError } = await supabase
    .from('properties')
    .select(
      'id, property_name, full_address, city, state, google_maps_url, waze_url, parking_details, wifi_network_name, wifi_password, is_live, host_name, host_whatsapp_number, host_response_time'
    )
    .eq('id', propertyId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (propertyError || !property) redirect('/dashboard');

  const [
    { data: steps, error: stepsError },
    { data: rules, error: rulesError },
    { data: tips, error: tipsError },
  ] = await Promise.all([
    supabase
      .from('property_check_in_steps')
      .select('instruction, step_order')
      .eq('property_id', propertyId)
      .order('step_order', { ascending: true }),
    supabase
      .from('property_house_rules')
      .select('rule_text, rule_order')
      .eq('property_id', propertyId)
      .order('rule_order', { ascending: true }),
    supabase
      .from('property_guidebook_tips')
      .select('label, description, tip_order')
      .eq('property_id', propertyId)
      .order('tip_order', { ascending: true }),
  ]);

  if (stepsError || rulesError || tipsError) redirect('/dashboard');

  return (
    <PropertyForm
      mode="edit"
      propertyId={propertyId}
      initialValues={{
        isLive: Boolean(property.is_live),
        propertyName: property.property_name ?? '',
        fullAddress: property.full_address ?? '',
        city: property.city ?? '',
        state: property.state ?? '',
        googleMapsUrl: property.google_maps_url ?? '',
        wazeUrl: property.waze_url ?? '',
        parkingDetails: property.parking_details ?? '',
        wifiNetworkName: property.wifi_network_name ?? '',
        wifiPassword: property.wifi_password ?? '',
        hostName: property.host_name ?? '',
        hostWhatsappNumber: property.host_whatsapp_number ?? '',
        hostResponseTime: property.host_response_time ?? '',
        checkInInstructions: (steps ?? []).map((s) => ({
          instruction: s.instruction ?? '',
        })),
        houseRules: (rules ?? []).map((r) => ({
          ruleText: r.rule_text ?? '',
        })),
        guidebookTips: (tips ?? []).map((t) => ({
          label: t.label ?? '',
          description: t.description ?? '',
        })),
      }}
    />
  );
}

