'use server';

import { randomBytes } from 'crypto';
import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const SHORT_TOKEN_LEN = 10;
const TOKEN_ALPHABET =
  'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

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

function generateShortToken() {
  const bytes = randomBytes(SHORT_TOKEN_LEN);
  let out = '';
  for (let i = 0; i < SHORT_TOKEN_LEN; i++) {
    out += TOKEN_ALPHABET[bytes[i]! % TOKEN_ALPHABET.length];
  }
  return out;
}

function sanitizeCustomToken(raw: string) {
  const t = raw.trim().toLowerCase();
  if (!t) return null;
  if (!/^[a-z0-9-]{4,24}$/.test(t)) {
    throw new Error(
      'Custom link may only use lowercase letters, numbers, and hyphens (4–24 characters).'
    );
  }
  return t;
}

function isUniqueViolation(message: string) {
  return (
    message.includes('duplicate') ||
    message.includes('unique') ||
    message.includes('23505')
  );
}

export async function generateGuestLink(input: {
  propertyId: string;
  guestName: string;
  checkoutDate: string;
  isPermanent: boolean;
  customToken?: string;
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
  const isPermanent = Boolean(input.isPermanent);
  let custom: string | null = null;
  try {
    custom = sanitizeCustomToken(normalizeString(input.customToken ?? ''));
  } catch (e: any) {
    return { ok: false as const, error: e?.message ?? 'Invalid custom link.' };
  }

  if (!propertyId) return { ok: false as const, error: 'Property is required.' };
  if (!guestName) return { ok: false as const, error: 'Guest name is required.' };
  if (!isPermanent && !checkoutDate) {
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

  const maxAttempts = custom ? 1 : 15;
  let lastError: string | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const token = custom ?? generateShortToken();
    const expiresAt = isPermanent ? null : calculateExpiryIso(checkoutDate);
    const checkoutDb = isPermanent ? null : checkoutDate;

    const { error: insertError } = await supabase.from('guest_links').insert({
      property_id: propertyId,
      guest_name: guestName,
      checkout_date: checkoutDb,
      expires_at: expiresAt,
      token,
      is_permanent: isPermanent,
    });

    if (!insertError) {
      revalidatePath('/dashboard');
      return {
        ok: true as const,
        token,
        expiresAt: expiresAt ?? null,
        isPermanent,
      };
    }

    lastError = insertError.message;
    if (custom && isUniqueViolation(insertError.message)) {
      return {
        ok: false as const,
        error: 'That custom link is already taken. Choose another.',
      };
    }
    if (!custom && isUniqueViolation(insertError.message)) {
      continue;
    }
    return { ok: false as const, error: insertError.message };
  }

  return {
    ok: false as const,
    error: lastError ?? 'Could not generate a unique link. Try again.',
  };
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
    .select('id, property_id, token, is_permanent')
    .eq('id', linkId)
    .maybeSingle();

  if (linkError || !link) {
    return { ok: false as const, error: 'Guest link not found.' };
  }

  if (link.is_permanent) {
    return {
      ok: false as const,
      error: 'Permanent guest links cannot be extended.',
    };
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

export async function deleteGuestLink(input: { linkId: string }) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return { ok: false as const, error: 'Unauthorized.' };
  }

  const linkId = normalizeString(input.linkId);
  if (!linkId) return { ok: false as const, error: 'Link is required.' };

  const { data: link, error: linkError } = await supabase
    .from('guest_links')
    .select('id, property_id')
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
    return { ok: false as const, error: 'You cannot delete this link.' };
  }

  const { error: deleteError } = await supabase
    .from('guest_links')
    .delete()
    .eq('id', link.id);

  if (deleteError) {
    return { ok: false as const, error: deleteError.message };
  }

  revalidatePath('/dashboard');
  return { ok: true as const };
}
