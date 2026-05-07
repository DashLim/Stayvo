'use server';

import { deleteProperty } from '@/app/actions/properties';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function ensureGeneralLocation(): Promise<{ ok: true; locationId: string } | { ok: false; error: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return { ok: false, error: 'Unauthorized' };

  const { data: existing } = await supabase
    .from('locations')
    .select('id')
    .eq('user_id', user.id)
    .order('sort_order', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existing?.id) {
    return { ok: true, locationId: existing.id as string };
  }

  const { data: row, error } = await supabase
    .from('locations')
    .insert({
      user_id: user.id,
      name: 'General',
      sort_order: 0,
    })
    .select('id')
    .single();

  if (error || !row) {
    return { ok: false, error: error?.message ?? 'Could not create location.' };
  }
  return { ok: true, locationId: row.id as string };
}

export async function createLocation(name: string) {
  const trimmed = (name ?? '').trim();
  if (!trimmed) {
    return { ok: false as const, error: 'Location name is required.' };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return { ok: false as const, error: 'Unauthorized' };

  const { data: maxRow } = await supabase
    .from('locations')
    .select('sort_order')
    .eq('user_id', user.id)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder = (maxRow?.sort_order ?? -1) + 1;

  const { data, error } = await supabase
    .from('locations')
    .insert({
      user_id: user.id,
      name: trimmed,
      sort_order: nextOrder,
    })
    .select('id')
    .single();

  if (error || !data) {
    return { ok: false as const, error: error?.message ?? 'Unable to create location.' };
  }
  return { ok: true as const, id: data.id as string };
}

async function getNextPropertySortOrder(
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

export async function setPropertyLocation(propertyId: string, newLocationId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return { ok: false as const, error: 'Unauthorized' };

  const { data: loc } = await supabase
    .from('locations')
    .select('id')
    .eq('id', newLocationId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!loc) return { ok: false as const, error: 'Invalid location.' };

  const { data: prop } = await supabase
    .from('properties')
    .select('id, location_id')
    .eq('id', propertyId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!prop) return { ok: false as const, error: 'Property not found.' };

  if (prop.location_id === newLocationId) {
    return { ok: true as const };
  }

  const sortOrder = await getNextPropertySortOrder(supabase, newLocationId);

  const { error } = await supabase
    .from('properties')
    .update({ location_id: newLocationId, sort_order: sortOrder })
    .eq('id', propertyId)
    .eq('user_id', user.id);

  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}

export async function reorderPropertyInLocation(propertyId: string, direction: 'up' | 'down') {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return { ok: false as const, error: 'Unauthorized' };

  const { data: prop } = await supabase
    .from('properties')
    .select('id, location_id, sort_order')
    .eq('id', propertyId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!prop) return { ok: false as const, error: 'Property not found.' };

  const { data: siblings } = await supabase
    .from('properties')
    .select('id, sort_order')
    .eq('location_id', prop.location_id)
    .eq('user_id', user.id)
    .order('sort_order', { ascending: true });

  const list = siblings ?? [];
  const idx = list.findIndex((r) => r.id === propertyId);
  if (idx < 0) return { ok: false as const, error: 'Invalid state.' };

  const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= list.length) {
    return { ok: true as const };
  }

  const a = list[idx];
  const b = list[swapIdx];
  const { error: e1 } = await supabase
    .from('properties')
    .update({ sort_order: b.sort_order })
    .eq('id', a.id)
    .eq('user_id', user.id);
  if (e1) return { ok: false as const, error: e1.message };

  const { error: e2 } = await supabase
    .from('properties')
    .update({ sort_order: a.sort_order })
    .eq('id', b.id)
    .eq('user_id', user.id);
  if (e2) return { ok: false as const, error: e2.message };

  return { ok: true as const };
}

export async function reorderLocation(locationId: string, direction: 'up' | 'down') {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return { ok: false as const, error: 'Unauthorized' };

  const { data: rows } = await supabase
    .from('locations')
    .select('id, sort_order')
    .eq('user_id', user.id)
    .order('sort_order', { ascending: true });

  const list = rows ?? [];
  const idx = list.findIndex((r) => r.id === locationId);
  if (idx < 0) return { ok: false as const, error: 'Location not found.' };

  const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= list.length) {
    return { ok: true as const };
  }

  const a = list[idx];
  const b = list[swapIdx];
  const { error: e1 } = await supabase
    .from('locations')
    .update({ sort_order: b.sort_order })
    .eq('id', a.id)
    .eq('user_id', user.id);
  if (e1) return { ok: false as const, error: e1.message };

  const { error: e2 } = await supabase
    .from('locations')
    .update({ sort_order: a.sort_order })
    .eq('id', b.id)
    .eq('user_id', user.id);
  if (e2) return { ok: false as const, error: e2.message };

  return { ok: true as const };
}

export async function reorderLocationsByIds(orderedLocationIds: string[]) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return { ok: false as const, error: 'Unauthorized' };

  const ids = orderedLocationIds.filter((id) => typeof id === 'string' && id.trim().length > 0);
  if (ids.length === 0) return { ok: true as const };

  const { data: rows, error } = await supabase
    .from('locations')
    .select('id')
    .eq('user_id', user.id)
    .order('sort_order', { ascending: true });
  if (error) return { ok: false as const, error: error.message };

  const allowed = new Set((rows ?? []).map((r) => r.id as string));
  const validOrderedIds = ids.filter((id) => allowed.has(id));
  if (validOrderedIds.length !== allowed.size) {
    return { ok: false as const, error: 'Invalid location order payload.' };
  }

  for (let i = 0; i < validOrderedIds.length; i++) {
    const id = validOrderedIds[i]!;
    const { error: updateError } = await supabase
      .from('locations')
      .update({ sort_order: i })
      .eq('id', id)
      .eq('user_id', user.id);
    if (updateError) return { ok: false as const, error: updateError.message };
  }

  return { ok: true as const };
}

export async function reorderPropertiesInLocationByIds(locationId: string, orderedPropertyIds: string[]) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return { ok: false as const, error: 'Unauthorized' };

  const location = (locationId ?? '').trim();
  if (!location) return { ok: false as const, error: 'Invalid location.' };

  const { data: locRow } = await supabase
    .from('locations')
    .select('id')
    .eq('id', location)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!locRow) return { ok: false as const, error: 'Invalid location.' };

  const ids = orderedPropertyIds.filter((id) => typeof id === 'string' && id.trim().length > 0);
  const { data: props, error } = await supabase
    .from('properties')
    .select('id')
    .eq('user_id', user.id)
    .eq('location_id', location)
    .order('sort_order', { ascending: true });
  if (error) return { ok: false as const, error: error.message };

  const allowed = new Set((props ?? []).map((p) => p.id as string));
  if (ids.length !== allowed.size || ids.some((id) => !allowed.has(id))) {
    return { ok: false as const, error: 'Invalid property order payload.' };
  }

  for (let i = 0; i < ids.length; i++) {
    const id = ids[i]!;
    const { error: updateError } = await supabase
      .from('properties')
      .update({ sort_order: i })
      .eq('id', id)
      .eq('user_id', user.id)
      .eq('location_id', location);
    if (updateError) return { ok: false as const, error: updateError.message };
  }

  return { ok: true as const };
}

export async function setPropertyLiveStatus(propertyId: string, isLive: boolean) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return { ok: false as const, error: 'Unauthorized' };

  const { error } = await supabase
    .from('properties')
    .update({ is_live: isLive })
    .eq('id', propertyId)
    .eq('user_id', user.id);

  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}

/**
 * Deletes a location. If it still has properties, each property is fully removed
 * (same as property delete: guest media, guest links, cascades) first.
 */
export async function deleteLocation(locationId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return { ok: false as const, error: 'Unauthorized' };

  const { data: loc, error: locErr } = await supabase
    .from('locations')
    .select('id')
    .eq('id', locationId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (locErr || !loc) {
    return { ok: false as const, error: 'Location not found.' };
  }

  const { data: props, error: propsErr } = await supabase
    .from('properties')
    .select('id')
    .eq('location_id', locationId)
    .eq('user_id', user.id);

  if (propsErr) {
    return { ok: false as const, error: propsErr.message };
  }

  for (const row of props ?? []) {
    const id = row.id as string;
    const del = await deleteProperty(id);
    if (!del.ok) {
      return { ok: false as const, error: del.error };
    }
  }

  const { error } = await supabase
    .from('locations')
    .delete()
    .eq('id', locationId)
    .eq('user_id', user.id);

  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}
