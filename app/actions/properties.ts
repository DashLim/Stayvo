'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { deleteGuestMediaFolderForProperty } from '@/app/actions/guest-property-media';
import { GUEST_PROPERTY_MEDIA_BUCKET } from '@/lib/guest-property-media';
import { getHostTier } from '@/lib/host-plan';
import {
  FREE_TIER_MAX_CUSTOM_BLOCKS,
  FREE_TIER_MAX_PROPERTIES,
  maxCustomBlocksForTier,
  type HostTier,
} from '@/lib/host-tier';
import {
  normalizeSectionOrder as normalizeGuestSectionOrder,
  type CustomDetail as GuestCustomDetailStub,
} from '@/lib/guest-layout';

function customDetailStubsForSectionOrder(count: number): GuestCustomDetailStub[] {
  return Array.from({ length: count }, (_, i) => ({
    detail_order: i,
    title: '',
    message: '',
  }));
}

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
  /** WhatsApp chat (wa.me); optional, separate from Call. */
  hostWhatsappChatNumber: string;
  isLive: boolean;
  locationId: string;
  heroImagePath?: string;
  socialFacebookUrl?: string;
  socialInstagramUrl?: string;
  socialXUrl?: string;
  socialTiktokUrl?: string;
  socialYoutubeUrl?: string;
  /** Own booking site (direct reservations). */
  socialDirectBookingUrl?: string;
};

function normalizeString(value: string | null | undefined) {
  return (value ?? '').trim();
}

/** DB without migration 0017 has no host_whatsapp_chat_number — retry without it. */
function missingHostWhatsappChatColumn(err: { message?: string } | null | undefined) {
  return Boolean(err?.message?.includes('host_whatsapp_chat_number'));
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
  const booking = parseHttpUrlForStorage(
    input.socialDirectBookingUrl,
    'Direct booking website'
  );
  if (!booking.ok) return booking;
  return {
    ok: true as const,
    urls: {
      social_facebook_url: fb.value,
      social_instagram_url: ig.value,
      social_x_url: x.value,
      social_tiktok_url: tt.value,
      social_youtube_url: yt.value,
      social_airbnb_url: null,
      social_direct_booking_url: booking.value,
    },
  };
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

type TierPropertyFormMode = 'create' | 'update';

async function enforceTierForPropertyInput(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
  tier: HostTier,
  input: PropertyFormInput,
  mode: TierPropertyFormMode
): Promise<{ ok: true } | { ok: false; error: string }> {
  const customDetails = normalizeCustomDetails(input.customDetails);
  const cap = maxCustomBlocksForTier(tier);
  if (customDetails.length > cap) {
    return {
      ok: false,
      error:
        tier === 'free'
          ? `Free accounts can use up to ${FREE_TIER_MAX_CUSTOM_BLOCKS} custom blocks per property. Stayvo Pro allows more.`
          : `You can have at most ${cap} custom blocks per property.`,
    };
  }

  const faqRows = input.faqs
    .map((f) => ({
      question: normalizeString(f.question),
      answer: normalizeString(f.answer),
    }))
    .filter((f) => f.question.length > 0 || f.answer.length > 0);

  if (tier !== 'pro' && faqRows.length > 0) {
    return {
      ok: false,
      error: 'FAQ is available on Stayvo Pro.',
    };
  }

  if (mode === 'create' && tier === 'free') {
    const { count, error } = await supabase
      .from('properties')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) {
      return { ok: false, error: error.message };
    }
    if ((count ?? 0) >= FREE_TIER_MAX_PROPERTIES) {
      return {
        ok: false,
        error:
          'Free accounts can have up to 3 properties. Stayvo Pro includes unlimited properties.',
      };
    }
  }

  return { ok: true };
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

  const tier = await getHostTier(supabase, user.id);
  const tierGate = await enforceTierForPropertyInput(supabase, user.id, tier, input, 'create');
  if (!tierGate.ok) {
    return { ok: false as const, error: tierGate.error };
  }

  const customDetails = normalizeCustomDetails(input.customDetails);
  const sectionOrder = normalizeGuestSectionOrder(
    input.guestSectionOrder,
    customDetailStubsForSectionOrder(customDetails.length)
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
    host_whatsapp_chat_number: normalizeString(input.hostWhatsappChatNumber) || null,
    host_whatsapp_message: null,
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

  let { data: property, error: propertyError } = await supabase
    .from('properties')
    .insert(payload)
    .select('id')
    .single();

  if (propertyError && missingHostWhatsappChatColumn(propertyError)) {
    const { host_whatsapp_chat_number: _omit, ...payloadCompat } = payload as Record<
      string,
      unknown
    >;
    const retry = await supabase
      .from('properties')
      .insert(payloadCompat)
      .select('id')
      .single();
    property = retry.data;
    propertyError = retry.error;
  }

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

  const tier = await getHostTier(supabase, user.id);
  const tierGate = await enforceTierForPropertyInput(supabase, user.id, tier, input, 'update');
  if (!tierGate.ok) {
    return { ok: false as const, error: tierGate.error };
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
  const sectionOrder = normalizeGuestSectionOrder(
    input.guestSectionOrder,
    customDetailStubsForSectionOrder(customDetails.length)
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
    host_whatsapp_chat_number: normalizeString(input.hostWhatsappChatNumber) || null,
    host_whatsapp_message: null,
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

  let { error: updateError } = await supabase
    .from('properties')
    .update(payload)
    .eq('id', propertyId)
    .eq('user_id', user.id);

  if (updateError && missingHostWhatsappChatColumn(updateError)) {
    const { host_whatsapp_chat_number: _omit, ...payloadCompat } = payload as Record<
      string,
      unknown
    >;
    const retry = await supabase
      .from('properties')
      .update(payloadCompat)
      .eq('id', propertyId)
      .eq('user_id', user.id);
    updateError = retry.error;
  }

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
  const sectionOrder = normalizeGuestSectionOrder(
    input.sectionOrder,
    customDetailStubsForSectionOrder(customCount)
  );

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

export async function cloneProperty(propertyId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false as const, error: 'Unauthorized' };
  }

  const tier = await getHostTier(supabase, user.id);
  if (tier === 'free') {
    const { count, error: countError } = await supabase
      .from('properties')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);
    if (countError) {
      return { ok: false as const, error: countError.message };
    }
    if ((count ?? 0) >= FREE_TIER_MAX_PROPERTIES) {
      return {
        ok: false as const,
        error:
          'Free accounts can have up to 3 properties. Stayvo Pro includes unlimited properties.',
      };
    }
  }

  const { data: source, error: sourceError } = await supabase
    .from('properties')
    .select('*')
    .eq('id', propertyId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (sourceError || !source) {
    return { ok: false as const, error: sourceError?.message ?? 'Property not found.' };
  }

  const [
    { data: steps, error: stepsError },
    { data: rules, error: rulesError },
    { data: tips, error: tipsError },
    { data: faqs, error: faqsError },
    { data: customDetails, error: customError },
  ] = await Promise.all([
    supabase
      .from('property_check_in_steps')
      .select('step_order, instruction, is_displayed, guest_image_path, drive_media_url')
      .eq('property_id', propertyId)
      .order('step_order', { ascending: true }),
    supabase
      .from('property_house_rules')
      .select('rule_order, rule_text, is_displayed')
      .eq('property_id', propertyId)
      .order('rule_order', { ascending: true }),
    supabase
      .from('property_guidebook_tips')
      .select('tip_order, label, description, guest_image_path, drive_media_url')
      .eq('property_id', propertyId)
      .order('tip_order', { ascending: true }),
    supabase
      .from('property_faqs')
      .select('faq_order, question, answer')
      .eq('property_id', propertyId)
      .order('faq_order', { ascending: true }),
    supabase
      .from('property_custom_details')
      .select('detail_order, title, message, is_displayed, guest_image_path, drive_media_url')
      .eq('property_id', propertyId)
      .order('detail_order', { ascending: true }),
  ]);

  if (stepsError || rulesError || tipsError || faqsError || customError) {
    return { ok: false as const, error: 'Unable to load property sections to clone.' };
  }

  if (tier === 'free' && (customDetails ?? []).length > FREE_TIER_MAX_CUSTOM_BLOCKS) {
    return {
      ok: false as const,
      error:
        'This property has more custom blocks than the Free plan allows, so it cannot be cloned.',
    };
  }

  const locationId = source.location_id as string;
  const sortOrder = await nextPropertySortOrderForLocation(supabase, locationId);

  const sourcePropertyName = normalizeString(source.property_name) || 'Untitled';
  const sourceInternalName = normalizeString(source.internal_name);
  const clonedPropertyName = `${sourcePropertyName} (Copy)`;
  const clonedInternalName = sourceInternalName ? `${sourceInternalName} (Copy)` : null;

  const {
    id: _oldId,
    created_at: _oldCreatedAt,
    updated_at: _oldUpdatedAt,
    ...rest
  } = source as Record<string, unknown>;

  const payload = {
    ...rest,
    user_id: user.id,
    property_name: clonedPropertyName,
    internal_name: clonedInternalName,
    sort_order: sortOrder,
    is_live: true,
  };

  let { data: inserted, error: insertError } = await supabase
    .from('properties')
    .insert(payload)
    .select('id')
    .single();

  if (insertError && missingHostWhatsappChatColumn(insertError)) {
    const { host_whatsapp_chat_number: _omit, ...payloadCompat } = payload as Record<
      string,
      unknown
    >;
    const retry = await supabase
      .from('properties')
      .insert(payloadCompat)
      .select('id')
      .single();
    inserted = retry.data;
    insertError = retry.error;
  }

  if (insertError || !inserted) {
    return { ok: false as const, error: insertError?.message ?? 'Unable to clone property.' };
  }

  const newPropertyId = inserted.id as string;

  if ((steps ?? []).length > 0) {
    const rows = (steps ?? []).map((row) => ({
      property_id: newPropertyId,
      step_order: row.step_order,
      instruction: row.instruction,
      is_displayed: row.is_displayed,
      guest_image_path: row.guest_image_path,
      drive_media_url: row.drive_media_url,
    }));
    const { error } = await supabase.from('property_check_in_steps').insert(rows);
    if (error) {
      await supabase.from('properties').delete().eq('id', newPropertyId).eq('user_id', user.id);
      return { ok: false as const, error: error.message };
    }
  }

  if ((rules ?? []).length > 0) {
    const rows = (rules ?? []).map((row) => ({
      property_id: newPropertyId,
      rule_order: row.rule_order,
      rule_text: row.rule_text,
      is_displayed: row.is_displayed,
    }));
    const { error } = await supabase.from('property_house_rules').insert(rows);
    if (error) {
      await supabase.from('properties').delete().eq('id', newPropertyId).eq('user_id', user.id);
      return { ok: false as const, error: error.message };
    }
  }

  if ((tips ?? []).length > 0) {
    const rows = (tips ?? []).map((row) => ({
      property_id: newPropertyId,
      tip_order: row.tip_order,
      label: row.label,
      description: row.description,
      guest_image_path: row.guest_image_path,
      drive_media_url: row.drive_media_url,
    }));
    const { error } = await supabase.from('property_guidebook_tips').insert(rows);
    if (error) {
      await supabase.from('properties').delete().eq('id', newPropertyId).eq('user_id', user.id);
      return { ok: false as const, error: error.message };
    }
  }

  if (tier === 'pro' && (faqs ?? []).length > 0) {
    const rows = (faqs ?? []).map((row) => ({
      property_id: newPropertyId,
      faq_order: row.faq_order,
      question: row.question,
      answer: row.answer,
    }));
    const { error } = await supabase.from('property_faqs').insert(rows);
    if (error) {
      await supabase.from('properties').delete().eq('id', newPropertyId).eq('user_id', user.id);
      return { ok: false as const, error: error.message };
    }
  }

  if ((customDetails ?? []).length > 0) {
    const rows = (customDetails ?? []).map((row) => ({
      property_id: newPropertyId,
      detail_order: row.detail_order,
      title: row.title,
      message: row.message,
      is_displayed: row.is_displayed,
      guest_image_path: row.guest_image_path,
      drive_media_url: row.drive_media_url,
    }));
    const { error } = await supabase.from('property_custom_details').insert(rows);
    if (error) {
      await supabase.from('properties').delete().eq('id', newPropertyId).eq('user_id', user.id);
      return { ok: false as const, error: error.message };
    }
  }

  return { ok: true as const, propertyId: newPropertyId };
}
