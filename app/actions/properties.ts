'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { deleteGuestMediaFolderForProperty } from '@/app/actions/guest-property-media';
import { GUEST_PROPERTY_MEDIA_BUCKET } from '@/lib/guest-property-media';
import { BASE_SECTION_KEYS } from '@/lib/guest-layout';

export type CustomDetailInput = {
  title: string;
  message: string;
  isDisplayed: boolean;
  guestImagePath?: string;
};

export type CheckInStepInput = {
  instruction: string;
  isDisplayed: boolean;
  guestImagePath?: string;
};

export type HouseRuleInput = {
  ruleText: string;
  isDisplayed: boolean;
};

export type GuidebookTipInput = {
  label: string;
  description: string;
  guestImagePath?: string;
};

export type FaqInput = {
  question: string;
  answer: string;
};

export type PropertyFormInput = {
  propertyName: string;
  internalName: string;
  fullAddress: string;
  googleMapsUrl: string;
  wazeUrl: string;
  parkingDetails: string;
  wifiNetworkName: string;
  wifiPassword: string;
  checkInInstructions: CheckInStepInput[];
  houseRules: HouseRuleInput[];
  guidebookTips: GuidebookTipInput[];
  faqs: FaqInput[];
  customDetails: CustomDetailInput[];
  guestSectionOrder: string[];
  hostName: string;
  hostWhatsappNumber: string;
  hostWhatsappMessage: string;
  isLive: boolean;
  locationId: string;
  heroImagePath?: string;
  socialFacebookUrl?: string;
  socialInstagramUrl?: string;
  socialXUrl?: string;
  socialTiktokUrl?: string;
  socialYoutubeUrl?: string;
  socialAirbnbUrl?: string;
};

function normalizeString(value: string | null | undefined) {
  return (value ?? '').trim();
}

function parseHttpUrlForStorage(
  raw: string | undefined | null,
  fieldLabel: string
): { ok: true; value: string | null } | { ok: false; error: string } {
  const s = normalizeString(raw);
  if (!s) return { ok: true, value: null };
  try {
    const withScheme = /^https?:\/\//i.test(s) ? s : `https://${s}`;
    const u = new URL(withScheme);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') {
      return {
        ok: false,
        error: `${fieldLabel} must use http or https.`,
      };
    }
    return { ok: true, value: u.href };
  } catch {
    return {
      ok: false,
      error: `${fieldLabel} doesn’t look like a valid URL.`,
    };
  }
}

function parseSocialUrlsFromForm(input: PropertyFormInput) {
  const fb = parseHttpUrlForStorage(input.socialFacebookUrl, 'Facebook');
  if (!fb.ok) return fb;
  const ig = parseHttpUrlForStorage(input.socialInstagramUrl, 'Instagram');
  if (!ig.ok) return ig;
  const x = parseHttpUrlForStorage(input.socialXUrl, 'X');
  if (!x.ok) return x;
  const tt = parseHttpUrlForStorage(input.socialTiktokUrl, 'TikTok');
  if (!tt.ok) return tt;
  const yt = parseHttpUrlForStorage(input.socialYoutubeUrl, 'YouTube');
  if (!yt.ok) return yt;
  const ab = parseHttpUrlForStorage(input.socialAirbnbUrl, 'Airbnb');
  if (!ab.ok) return ab;
  return {
    ok: true as const,
    urls: {
      social_facebook_url: fb.value,
      social_instagram_url: ig.value,
      social_x_url: x.value,
      social_tiktok_url: tt.value,
      social_youtube_url: yt.value,
      social_airbnb_url: ab.value,
    },
  };
}

function normalizeSectionOrder(order: string[] | null | undefined, customCount: number) {
  const allowedCustom = new Set(
    Array.from({ length: customCount }, (_, idx) => `custom:${idx}`)
  );
  const allowed = new Set<string>([...BASE_SECTION_KEYS, ...Array.from(allowedCustom)]);

  const result: string[] = [];
  for (const raw of order ?? []) {
    const key = normalizeString(raw);
    if (!key || !allowed.has(key) || result.includes(key)) continue;
    result.push(key);
  }

  const defaults = [...BASE_SECTION_KEYS, ...Array.from(allowedCustom)];
  for (const key of defaults) {
    if (!result.includes(key)) result.push(key);
  }

  return result;
}

async function nextPropertySortOrderForLocation(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  locationId: string
) {
  const { data: maxRow } = await supabase
    .from('properties')
    .select('sort_order')
    .eq('location_id', locationId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();
  return (maxRow?.sort_order ?? -1) + 1;
}

function normalizeCustomDetails(input: CustomDetailInput[] | null | undefined) {
  return (input ?? [])
    .map((d) => ({
      title: normalizeString(d.title),
      message: normalizeString(d.message),
      isDisplayed: Boolean(d.isDisplayed),
      guestImagePath: normalizeString(d.guestImagePath) || null,
    }))
    .filter(
      (d) =>
        d.title.length > 0 ||
        d.message.length > 0 ||
        Boolean(d.guestImagePath && d.guestImagePath.length > 0)
    );
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

  const customDetails = normalizeCustomDetails(input.customDetails);
  const sectionOrder = normalizeSectionOrder(
    input.guestSectionOrder,
    customDetails.length
  );

  const locationId = normalizeString(input.locationId);
  if (!locationId) {
    return { ok: false as const, error: 'Location is required.' };
  }

  const { data: locRow, error: locErr } = await supabase
    .from('locations')
    .select('id')
    .eq('id', locationId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (locErr || !locRow) {
    return { ok: false as const, error: 'Choose a valid location.' };
  }

  const sortOrder = await nextPropertySortOrderForLocation(supabase, locationId);

  const socialParsed = parseSocialUrlsFromForm(input);
  if (!socialParsed.ok) {
    return { ok: false as const, error: socialParsed.error };
  }

  const payload = {
    user_id: user.id,
    property_name: normalizeString(input.propertyName),
    internal_name: normalizeString(input.internalName) || null,
    full_address: normalizeString(input.fullAddress),
    city: '',
    state: '',
    google_maps_url: normalizeString(input.googleMapsUrl) || null,
    waze_url: normalizeString(input.wazeUrl) || null,
    parking_details: normalizeString(input.parkingDetails) || null,
    wifi_network_name: normalizeString(input.wifiNetworkName) || null,
    wifi_password: normalizeString(input.wifiPassword) || null,
    host_name: normalizeString(input.hostName),
    host_whatsapp_number: normalizeString(input.hostWhatsappNumber),
    host_whatsapp_message: normalizeString(input.hostWhatsappMessage) || null,
    host_response_time: '',
    is_live: input.isLive,
    guest_section_order: sectionOrder,
    location_id: locationId,
    sort_order: sortOrder,
    hero_image_path: normalizeString(input.heroImagePath) || null,
    ...socialParsed.urls,
  };

  const requiredFields: Array<[keyof typeof payload, string]> = [
    ['property_name', 'Property name is required.'],
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
    .map((s) => ({
      instruction: normalizeString(s.instruction),
      isDisplayed: Boolean(s.isDisplayed),
      guestImagePath: normalizeString(s.guestImagePath) || null,
    }))
    .filter(
      (s) =>
        s.instruction.length > 0 ||
        Boolean(s.guestImagePath && s.guestImagePath.length > 0)
    )
    .map((s, idx) => ({
      property_id: propertyId,
      step_order: idx,
      instruction: s.instruction,
      is_displayed: s.isDisplayed,
      guest_image_path: s.guestImagePath,
      drive_media_url: null,
    }));

  const houseRules = input.houseRules
    .map((r) => ({
      ruleText: normalizeString(r.ruleText),
      isDisplayed: Boolean(r.isDisplayed),
    }))
    .filter((r) => r.ruleText.length > 0)
    .map((r, idx) => ({
      property_id: propertyId,
      rule_order: idx,
      rule_text: r.ruleText,
      is_displayed: r.isDisplayed,
    }));

  const guidebookTips = input.guidebookTips
    .map((t) => ({
      label: normalizeString(t.label),
      description: normalizeString(t.description),
      guestImagePath: normalizeString(t.guestImagePath) || null,
    }))
    .filter(
      (t) =>
        t.label.length > 0 ||
        t.description.length > 0 ||
        Boolean(t.guestImagePath && t.guestImagePath.length > 0)
    )
    .map((tip, idx) => ({
      property_id: propertyId,
      tip_order: idx,
      label: tip.label || 'Tip',
      description: tip.description || '',
      guest_image_path: tip.guestImagePath,
      drive_media_url: null,
    }));

  const faqs = input.faqs
    .map((f) => ({
      question: normalizeString(f.question),
      answer: normalizeString(f.answer),
    }))
    .filter((f) => f.question.length > 0 || f.answer.length > 0)
    .map((f, idx) => ({
      property_id: propertyId,
      faq_order: idx,
      question: f.question,
      answer: f.answer,
    }));

  const customDetailsRows = customDetails.map((detail, idx) => ({
    property_id: propertyId,
    detail_order: idx,
    title: detail.title || 'Detail',
    message: detail.message || '',
    is_displayed: Boolean(detail.isDisplayed),
    guest_image_path: detail.guestImagePath,
    drive_media_url: null,
  }));

  if (checkInInstructions.length > 0) {
    const { error } = await supabase
      .from('property_check_in_steps')
      .insert(checkInInstructions);
    if (error) return { ok: false as const, error: error.message };
  }

  if (houseRules.length > 0) {
    const { error } = await supabase.from('property_house_rules').insert(houseRules);
    if (error) return { ok: false as const, error: error.message };
  }

  if (guidebookTips.length > 0) {
    const { error } = await supabase
      .from('property_guidebook_tips')
      .insert(guidebookTips);
    if (error) return { ok: false as const, error: error.message };
  }

  if (faqs.length > 0) {
    const { error } = await supabase.from('property_faqs').insert(faqs);
    if (error) return { ok: false as const, error: error.message };
  }

  if (customDetailsRows.length > 0) {
    const { error } = await supabase
      .from('property_custom_details')
      .insert(customDetailsRows);
    if (error) return { ok: false as const, error: error.message };
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
    .select('id, location_id, sort_order')
    .eq('id', propertyId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existingError || !existing) {
    return {
      ok: false as const,
      error: existingError?.message ?? 'Property not found.',
    };
  }

  const customDetails = normalizeCustomDetails(input.customDetails);
  const sectionOrder = normalizeSectionOrder(
    input.guestSectionOrder,
    customDetails.length
  );

  const newLocationId = normalizeString(input.locationId);
  if (!newLocationId) {
    return { ok: false as const, error: 'Location is required.' };
  }

  const { data: locRow, error: locErr } = await supabase
    .from('locations')
    .select('id')
    .eq('id', newLocationId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (locErr || !locRow) {
    return { ok: false as const, error: 'Choose a valid location.' };
  }

  let sortOrder = existing.sort_order ?? 0;
  if (newLocationId !== existing.location_id) {
    sortOrder = await nextPropertySortOrderForLocation(supabase, newLocationId);
  }

  const socialParsed = parseSocialUrlsFromForm(input);
  if (!socialParsed.ok) {
    return { ok: false as const, error: socialParsed.error };
  }

  const payload = {
    property_name: normalizeString(input.propertyName),
    internal_name: normalizeString(input.internalName) || null,
    full_address: normalizeString(input.fullAddress),
    city: '',
    state: '',
    google_maps_url: normalizeString(input.googleMapsUrl) || null,
    waze_url: normalizeString(input.wazeUrl) || null,
    parking_details: normalizeString(input.parkingDetails) || null,
    wifi_network_name: normalizeString(input.wifiNetworkName) || null,
    wifi_password: normalizeString(input.wifiPassword) || null,
    host_name: normalizeString(input.hostName),
    host_whatsapp_number: normalizeString(input.hostWhatsappNumber),
    host_whatsapp_message: normalizeString(input.hostWhatsappMessage) || null,
    host_response_time: '',
    is_live: input.isLive,
    guest_section_order: sectionOrder,
    location_id: newLocationId,
    sort_order: sortOrder,
    hero_image_path: normalizeString(input.heroImagePath) || null,
    ...socialParsed.urls,
  };

  const requiredFields: Array<[keyof typeof payload, string]> = [
    ['property_name', 'Property name is required.'],
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

  const [
    { data: prevSteps },
    { data: prevTips },
    { data: prevDetails },
  ] = await Promise.all([
    supabase
      .from('property_check_in_steps')
      .select('guest_image_path')
      .eq('property_id', propertyId),
    supabase
      .from('property_guidebook_tips')
      .select('guest_image_path')
      .eq('property_id', propertyId),
    supabase
      .from('property_custom_details')
      .select('guest_image_path')
      .eq('property_id', propertyId),
  ]);

  const previousImagePaths = new Set<string>();
  for (const row of [
    ...(prevSteps ?? []),
    ...(prevTips ?? []),
    ...(prevDetails ?? []),
  ]) {
    const p = row.guest_image_path?.trim();
    if (p) previousImagePaths.add(p);
  }

  await supabase.from('property_check_in_steps').delete().eq('property_id', propertyId);
  await supabase.from('property_house_rules').delete().eq('property_id', propertyId);
  await supabase.from('property_guidebook_tips').delete().eq('property_id', propertyId);
  await supabase.from('property_faqs').delete().eq('property_id', propertyId);
  await supabase.from('property_custom_details').delete().eq('property_id', propertyId);

  const checkInInstructions = input.checkInInstructions
    .map((s) => ({
      instruction: normalizeString(s.instruction),
      isDisplayed: Boolean(s.isDisplayed),
      guestImagePath: normalizeString(s.guestImagePath) || null,
    }))
    .filter(
      (s) =>
        s.instruction.length > 0 ||
        Boolean(s.guestImagePath && s.guestImagePath.length > 0)
    )
    .map((s, idx) => ({
      property_id: propertyId,
      step_order: idx,
      instruction: s.instruction,
      is_displayed: s.isDisplayed,
      guest_image_path: s.guestImagePath,
      drive_media_url: null,
    }));

  const houseRules = input.houseRules
    .map((r) => ({
      ruleText: normalizeString(r.ruleText),
      isDisplayed: Boolean(r.isDisplayed),
    }))
    .filter((r) => r.ruleText.length > 0)
    .map((r, idx) => ({
      property_id: propertyId,
      rule_order: idx,
      rule_text: r.ruleText,
      is_displayed: r.isDisplayed,
    }));

  const guidebookTips = input.guidebookTips
    .map((t) => ({
      label: normalizeString(t.label),
      description: normalizeString(t.description),
      guestImagePath: normalizeString(t.guestImagePath) || null,
    }))
    .filter(
      (t) =>
        t.label.length > 0 ||
        t.description.length > 0 ||
        Boolean(t.guestImagePath && t.guestImagePath.length > 0)
    )
    .map((tip, idx) => ({
      property_id: propertyId,
      tip_order: idx,
      label: tip.label || 'Tip',
      description: tip.description || '',
      guest_image_path: tip.guestImagePath,
      drive_media_url: null,
    }));

  const faqs = input.faqs
    .map((f) => ({
      question: normalizeString(f.question),
      answer: normalizeString(f.answer),
    }))
    .filter((f) => f.question.length > 0 || f.answer.length > 0)
    .map((f, idx) => ({
      property_id: propertyId,
      faq_order: idx,
      question: f.question,
      answer: f.answer,
    }));

  const customDetailsRows = customDetails.map((detail, idx) => ({
    property_id: propertyId,
    detail_order: idx,
    title: detail.title || 'Detail',
    message: detail.message || '',
    is_displayed: Boolean(detail.isDisplayed),
    guest_image_path: detail.guestImagePath,
    drive_media_url: null,
  }));

  if (checkInInstructions.length > 0) {
    const { error } = await supabase
      .from('property_check_in_steps')
      .insert(checkInInstructions);
    if (error) return { ok: false as const, error: error.message };
  }

  if (houseRules.length > 0) {
    const { error } = await supabase.from('property_house_rules').insert(houseRules);
    if (error) return { ok: false as const, error: error.message };
  }

  if (guidebookTips.length > 0) {
    const { error } = await supabase
      .from('property_guidebook_tips')
      .insert(guidebookTips);
    if (error) return { ok: false as const, error: error.message };
  }

  if (faqs.length > 0) {
    const { error } = await supabase.from('property_faqs').insert(faqs);
    if (error) return { ok: false as const, error: error.message };
  }

  if (customDetailsRows.length > 0) {
    const { error } = await supabase
      .from('property_custom_details')
      .insert(customDetailsRows);
    if (error) return { ok: false as const, error: error.message };
  }

  const nextImagePaths = new Set<string>();
  for (const row of checkInInstructions) {
    const p = row.guest_image_path?.trim();
    if (p) nextImagePaths.add(p);
  }
  for (const row of guidebookTips) {
    const p = row.guest_image_path?.trim();
    if (p) nextImagePaths.add(p);
  }
  for (const row of customDetailsRows) {
    const p = row.guest_image_path?.trim();
    if (p) nextImagePaths.add(p);
  }

  const removedPaths = [...previousImagePaths].filter((p) => !nextImagePaths.has(p));
  if (removedPaths.length > 0) {
    await supabase.storage.from(GUEST_PROPERTY_MEDIA_BUCKET).remove(removedPaths);
  }

  return { ok: true as const };
}

export async function updateGuestSectionOrder(input: {
  propertyId: string;
  sectionOrder: string[];
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false as const, error: 'Unauthorized' };
  }

  const propertyId = normalizeString(input.propertyId);
  if (!propertyId) {
    return { ok: false as const, error: 'Property is required.' };
  }

  const { data: details, error: detailsError } = await supabase
    .from('property_custom_details')
    .select('detail_order')
    .eq('property_id', propertyId)
    .order('detail_order', { ascending: true });

  if (detailsError) {
    return { ok: false as const, error: detailsError.message };
  }

  const customCount = (details ?? []).length;
  const sectionOrder = normalizeSectionOrder(input.sectionOrder, customCount);

  const { error } = await supabase
    .from('properties')
    .update({ guest_section_order: sectionOrder })
    .eq('id', propertyId)
    .eq('user_id', user.id);

  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}

export async function deleteProperty(propertyId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false as const, error: 'Unauthorized' };
  }

  await deleteGuestMediaFolderForProperty(propertyId, user.id);

  const { error } = await supabase
    .from('properties')
    .delete()
    .eq('id', propertyId)
    .eq('user_id', user.id);

  if (error) {
    return { ok: false as const, error: error.message };
  }

  return { ok: true as const };
}
