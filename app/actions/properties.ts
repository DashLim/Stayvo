'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';

export type CheckInStepInput = {
  instruction: string;
};

export type HouseRuleInput = {
  ruleText: string;
};

export type GuidebookTipInput = {
  label: string;
  description: string;
};

export type PropertyFormInput = {
  propertyName: string;
  fullAddress: string;
  city: string;
  state: string;
  googleMapsUrl: string;
  wazeUrl: string;
  parkingDetails: string;
  wifiNetworkName: string;
  wifiPassword: string;
  checkInInstructions: CheckInStepInput[];
  houseRules: HouseRuleInput[];
  guidebookTips: GuidebookTipInput[];
  hostName: string;
  hostWhatsappNumber: string;
  hostResponseTime: string;
  isLive: boolean;
};

function normalizeString(value: string | null | undefined) {
  return (value ?? '').trim();
}

export async function createProperty(input: PropertyFormInput) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false as const, error: 'Unauthorized' };
  }

  const payload = {
    user_id: user.id,
    property_name: normalizeString(input.propertyName),
    full_address: normalizeString(input.fullAddress),
    city: normalizeString(input.city),
    state: normalizeString(input.state),
    google_maps_url: normalizeString(input.googleMapsUrl) || null,
    waze_url: normalizeString(input.wazeUrl) || null,
    parking_details: normalizeString(input.parkingDetails) || null,
    wifi_network_name: normalizeString(input.wifiNetworkName) || null,
    wifi_password: normalizeString(input.wifiPassword) || null,
    host_name: normalizeString(input.hostName),
    host_whatsapp_number: normalizeString(input.hostWhatsappNumber),
    host_response_time: normalizeString(input.hostResponseTime),
    is_live: input.isLive,
  };

  // Minimal server-side validation (Phase 1).
  const requiredFields: Array<[keyof typeof payload, string]> = [
    ['property_name', 'Property name is required.'],
    ['full_address', 'Full address is required.'],
    ['city', 'City is required.'],
    ['state', 'State is required.'],
    ['host_name', 'Host name is required.'],
    ['host_whatsapp_number', 'Host WhatsApp number is required.'],
    ['host_response_time', 'Host response time is required.'],
  ];

  for (const [field, message] of requiredFields) {
    const v = payload[field];
    if (typeof v !== 'string' || v.trim().length === 0) {
      return { ok: false as const, error: message };
    }
  }

  const { data: property, error: propertyError } = await supabase
    .from('properties')
    .insert(payload)
    .select('id')
    .single();

  if (propertyError || !property) {
    return {
      ok: false as const,
      error: propertyError?.message ?? 'Unable to create property.',
    };
  }

  const propertyId = property.id as string;

  const checkInInstructions = input.checkInInstructions
    .map((s) => normalizeString(s.instruction))
    .filter(Boolean)
    .map((instruction, idx) => ({
      property_id: propertyId,
      step_order: idx,
      instruction,
    }));

  const houseRules = input.houseRules
    .map((r) => normalizeString(r.ruleText))
    .filter(Boolean)
    .map((ruleText, idx) => ({
      property_id: propertyId,
      rule_order: idx,
      rule_text: ruleText,
    }));

  const guidebookTips = input.guidebookTips
    .map((t) => ({
      label: normalizeString(t.label),
      description: normalizeString(t.description),
    }))
    .filter((t) => t.label.length > 0 || t.description.length > 0)
    .map((tip, idx) => ({
      property_id: propertyId,
      tip_order: idx,
      label: tip.label || 'Tip',
      description: tip.description || '',
    }));

  // Nested inserts. (No need to support empty arrays.)
  if (checkInInstructions.length > 0) {
    const { error } = await supabase
      .from('property_check_in_steps')
      .insert(checkInInstructions);
    if (error) {
      return { ok: false as const, error: error.message };
    }
  }

  if (houseRules.length > 0) {
    const { error } = await supabase
      .from('property_house_rules')
      .insert(houseRules);
    if (error) {
      return { ok: false as const, error: error.message };
    }
  }

  if (guidebookTips.length > 0) {
    const { error } = await supabase
      .from('property_guidebook_tips')
      .insert(guidebookTips);
    if (error) {
      return { ok: false as const, error: error.message };
    }
  }

  return { ok: true as const, propertyId };
}

export async function updateProperty(propertyId: string, input: PropertyFormInput) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false as const, error: 'Unauthorized' };
  }

  const {
    data: existing,
    error: existingError,
  } = await supabase
    .from('properties')
    .select('id')
    .eq('id', propertyId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existingError || !existing) {
    return {
      ok: false as const,
      error: existingError?.message ?? 'Property not found.',
    };
  }

  const payload = {
    property_name: normalizeString(input.propertyName),
    full_address: normalizeString(input.fullAddress),
    city: normalizeString(input.city),
    state: normalizeString(input.state),
    google_maps_url: normalizeString(input.googleMapsUrl) || null,
    waze_url: normalizeString(input.wazeUrl) || null,
    parking_details: normalizeString(input.parkingDetails) || null,
    wifi_network_name: normalizeString(input.wifiNetworkName) || null,
    wifi_password: normalizeString(input.wifiPassword) || null,
    host_name: normalizeString(input.hostName),
    host_whatsapp_number: normalizeString(input.hostWhatsappNumber),
    host_response_time: normalizeString(input.hostResponseTime),
    is_live: input.isLive,
  };

  const requiredFields: Array<[keyof typeof payload, string]> = [
    ['property_name', 'Property name is required.'],
    ['full_address', 'Full address is required.'],
    ['city', 'City is required.'],
    ['state', 'State is required.'],
    ['host_name', 'Host name is required.'],
    ['host_whatsapp_number', 'Host WhatsApp number is required.'],
    ['host_response_time', 'Host response time is required.'],
  ];

  for (const [field, message] of requiredFields) {
    const v = payload[field];
    if (typeof v !== 'string' || v.trim().length === 0) {
      return { ok: false as const, error: message };
    }
  }

  const { error: updateError } = await supabase
    .from('properties')
    .update(payload)
    .eq('id', propertyId)
    .eq('user_id', user.id);

  if (updateError) {
    return { ok: false as const, error: updateError.message };
  }

  // Replace nested content.
  await supabase
    .from('property_check_in_steps')
    .delete()
    .eq('property_id', propertyId);
  await supabase
    .from('property_house_rules')
    .delete()
    .eq('property_id', propertyId);
  await supabase
    .from('property_guidebook_tips')
    .delete()
    .eq('property_id', propertyId);

  const checkInInstructions = input.checkInInstructions
    .map((s) => normalizeString(s.instruction))
    .filter(Boolean)
    .map((instruction, idx) => ({
      property_id: propertyId,
      step_order: idx,
      instruction,
    }));

  const houseRules = input.houseRules
    .map((r) => normalizeString(r.ruleText))
    .filter(Boolean)
    .map((ruleText, idx) => ({
      property_id: propertyId,
      rule_order: idx,
      rule_text: ruleText,
    }));

  const guidebookTips = input.guidebookTips
    .map((t) => ({
      label: normalizeString(t.label),
      description: normalizeString(t.description),
    }))
    .filter((t) => t.label.length > 0 || t.description.length > 0)
    .map((tip, idx) => ({
      property_id: propertyId,
      tip_order: idx,
      label: tip.label || 'Tip',
      description: tip.description || '',
    }));

  if (checkInInstructions.length > 0) {
    const { error } = await supabase
      .from('property_check_in_steps')
      .insert(checkInInstructions);
    if (error) return { ok: false as const, error: error.message };
  }

  if (houseRules.length > 0) {
    const { error } = await supabase
      .from('property_house_rules')
      .insert(houseRules);
    if (error) return { ok: false as const, error: error.message };
  }

  if (guidebookTips.length > 0) {
    const { error } = await supabase
      .from('property_guidebook_tips')
      .insert(guidebookTips);
    if (error) return { ok: false as const, error: error.message };
  }

  return { ok: true as const };
}

