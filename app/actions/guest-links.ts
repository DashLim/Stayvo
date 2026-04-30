'use server';

import { randomBytes } from 'crypto';
import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';

function normalizeString(value: string | null | undefined) {
  return (value ?? '').trim();
}

function calculateExpiryIso(checkoutDate: string) {
  const date = new Date(`${checkoutDate}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid checkout date.');
  }
  date.setUTCDate(date.getUTCDate() + 2);
  date.setUTCHours(23, 59, 59, 999);
  return date.toISOString();
}

function generateToken() {
  return randomBytes(24).toString('base64url');
}

export async function generateGuestLink(input: {
  propertyId: string;
  guestName: string;
  checkoutDate: string;
}) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return { ok: false as const, error: 'Unauthorized.' };
  }

  const propertyId = normalizeString(input.propertyId);
  const guestName = normalizeString(input.guestName);
  const checkoutDate = normalizeString(input.checkoutDate);

  if (!propertyId) return { ok: false as const, error: 'Property is required.' };
  if (!guestName) return { ok: false as const, error: 'Guest name is required.' };
  if (!checkoutDate) {
    return { ok: false as const, error: 'Checkout date is required.' };
  }

  const { data: property, error: propertyError } = await supabase
    .from('properties')
    .select('id')
    .eq('id', propertyId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (propertyError || !property) {
    return { ok: false as const, error: 'Property not found.' };
  }

  const token = generateToken();
  const expiresAt = calculateExpiryIso(checkoutDate);

  const { error: insertError } = await supabase.from('guest_links').insert({
    property_id: propertyId,
    guest_name: guestName,
    checkout_date: checkoutDate,
    expires_at: expiresAt,
    token,
  });

  if (insertError) {
    return { ok: false as const, error: insertError.message };
  }

  revalidatePath('/dashboard');
  return { ok: true as const, token, expiresAt };
}

export async function extendGuestLink(input: {
  linkId: string;
  newCheckoutDate: string;
}) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return { ok: false as const, error: 'Unauthorized.' };
  }

  const linkId = normalizeString(input.linkId);
  const newCheckoutDate = normalizeString(input.newCheckoutDate);

  if (!linkId) return { ok: false as const, error: 'Link is required.' };
  if (!newCheckoutDate) {
    return { ok: false as const, error: 'New checkout date is required.' };
  }

  const { data: link, error: linkError } = await supabase
    .from('guest_links')
    .select('id, property_id, token')
    .eq('id', linkId)
    .maybeSingle();

  if (linkError || !link) {
    return { ok: false as const, error: 'Guest link not found.' };
  }

  const { data: property, error: propertyError } = await supabase
    .from('properties')
    .select('id')
    .eq('id', link.property_id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (propertyError || !property) {
    return { ok: false as const, error: 'You cannot update this link.' };
  }

  const expiresAt = calculateExpiryIso(newCheckoutDate);

  const { error: updateError } = await supabase
    .from('guest_links')
    .update({
      checkout_date: newCheckoutDate,
      expires_at: expiresAt,
    })
    .eq('id', link.id);

  if (updateError) {
    return { ok: false as const, error: updateError.message };
  }

  revalidatePath('/dashboard');
  return { ok: true as const, token: link.token, expiresAt };
}

