'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { calculateExpiryIso } from '@/lib/guest-link-expiry';
import {
  generateShortGuestLinkToken,
  isUniqueViolation,
} from '@/lib/ical/guest-link-tokens';

function normalizeString(value: string | null | undefined) {
  return (value ?? '').trim();
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
    const token = custom ?? generateShortGuestLinkToken();
    const expiresAt = isPermanent ? null : calculateExpiryIso(checkoutDate);
    const checkoutDb = isPermanent ? null : checkoutDate;

    const { error: insertError } = await supabase.from('guest_links').insert({
      property_id: propertyId,
      guest_name: guestName || null,
      checkout_date: checkoutDb,
      expires_at: expiresAt,
      token,
      is_permanent: isPermanent,
      link_source: 'manual',
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

export async function updateGuestLinkGuestName(input: {
  linkId: string;
  guestName: string;
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
    return { ok: false as const, error: 'You cannot update this link.' };
  }

  const guestName = normalizeString(input.guestName);

  const { error: updateError } = await supabase
    .from('guest_links')
    .update({ guest_name: guestName || null })
    .eq('id', link.id);

  if (updateError) {
    return { ok: false as const, error: updateError.message };
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/track');
  return { ok: true as const };
}

export async function updateGuestLink(input: {
  linkId: string;
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

  const linkId = normalizeString(input.linkId);
  const guestName = normalizeString(input.guestName);
  const checkoutDate = normalizeString(input.checkoutDate);
  const isPermanent = Boolean(input.isPermanent);

  if (!linkId) return { ok: false as const, error: 'Link is required.' };
  if (!isPermanent && !checkoutDate) {
    return { ok: false as const, error: 'Checkout date is required.' };
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

  let nextToken = link.token as string;
  const rawCustom = normalizeString(input.customToken ?? '');
  if (rawCustom && rawCustom !== link.token) {
    try {
      const sanitized = sanitizeCustomToken(rawCustom);
      if (!sanitized) {
        return { ok: false as const, error: 'Custom link is invalid.' };
      }
      nextToken = sanitized;
    } catch (e: unknown) {
      return {
        ok: false as const,
        error: e instanceof Error ? e.message : 'Invalid custom link.',
      };
    }

    const { data: taken } = await supabase
      .from('guest_links')
      .select('id')
      .eq('token', nextToken)
      .neq('id', link.id)
      .maybeSingle();

    if (taken) {
      return {
        ok: false as const,
        error: 'That custom link is already taken. Choose another.',
      };
    }
  }

  const payload = {
    guest_name: guestName || null,
    is_permanent: isPermanent,
    checkout_date: isPermanent ? null : checkoutDate,
    expires_at: isPermanent ? null : calculateExpiryIso(checkoutDate),
    token: nextToken,
  };

  const { error: updateError } = await supabase
    .from('guest_links')
    .update(payload)
    .eq('id', link.id);

  if (updateError) {
    return { ok: false as const, error: updateError.message };
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/track');
  return { ok: true as const, token: nextToken };
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
