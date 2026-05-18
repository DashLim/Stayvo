import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';

import { isSharedDedupStoragePath } from '@/lib/host-media-library';
import {
  r2DeleteGuestMedia,
  isGuestMediaR2Enabled,
} from '@/lib/guest-media-r2';
import { GUEST_PROPERTY_MEDIA_BUCKET } from '@/lib/guest-property-media';

async function deleteGuestMediaObject(path: string): Promise<void> {
  if (isGuestMediaR2Enabled()) {
    await r2DeleteGuestMedia(path);
    return;
  }
  const { createSupabaseServerClient } = await import('@/lib/supabase/server');
  const supabase = await createSupabaseServerClient();
  await supabase.storage.from(GUEST_PROPERTY_MEDIA_BUCKET).remove([path]);
}

/** All guest media paths still referenced on any of the host's properties. */
export async function collectReferencedGuestMediaPaths(
  supabase: SupabaseClient,
  userId: string
): Promise<Set<string>> {
  const paths = new Set<string>();
  const add = (value: string | null | undefined) => {
    const trimmed = (value ?? '').trim();
    if (trimmed) paths.add(trimmed);
  };

  const { data: properties } = await supabase
    .from('properties')
    .select('id, hero_image_path')
    .eq('user_id', userId);

  const propertyIds: string[] = [];
  for (const row of properties ?? []) {
    propertyIds.push(row.id);
    add(row.hero_image_path);
  }

  if (propertyIds.length === 0) return paths;

  const [steps, tips, details] = await Promise.all([
    supabase
      .from('property_check_in_steps')
      .select('guest_image_path')
      .in('property_id', propertyIds),
    supabase
      .from('property_guidebook_tips')
      .select('guest_image_path')
      .in('property_id', propertyIds),
    supabase
      .from('property_custom_details')
      .select('guest_image_path')
      .in('property_id', propertyIds),
  ]);

  for (const row of steps.data ?? []) add(row.guest_image_path);
  for (const row of tips.data ?? []) add(row.guest_image_path);
  for (const row of details.data ?? []) add(row.guest_image_path);

  return paths;
}

/**
 * Delete storage objects that are no longer referenced anywhere on the host's properties.
 * Safe for dedup/library paths shared across listings.
 */
export async function deleteGuestMediaPathsIfUnreferenced(
  supabase: SupabaseClient,
  userId: string,
  candidatePaths: Iterable<string>
): Promise<void> {
  const referenced = await collectReferencedGuestMediaPaths(supabase, userId);
  const unique = [...new Set([...candidatePaths].map((p) => p.trim()).filter(Boolean))];

  for (const path of unique) {
    if (!path.startsWith(`${userId}/`)) continue;
    if (referenced.has(path)) continue;

    await deleteGuestMediaObject(path);

    if (isSharedDedupStoragePath(userId, path)) {
      await supabase
        .from('host_media_assets')
        .delete()
        .eq('user_id', userId)
        .eq('storage_path', path);
    }
  }
}
