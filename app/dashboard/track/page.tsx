import { redirect } from 'next/navigation';
import { getGuestLinkOpenStatsForLinkIds } from '@/app/actions/guest-link-open-stats';
import TrackGuestLinksClient from '@/app/dashboard/track/TrackGuestLinksClient';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function DashboardTrackPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) redirect('/login?redirect=/dashboard/track');

  const [{ data: locations, error: locationsError }, { data: properties, error: propertiesError }] =
    await Promise.all([
      supabase
        .from('locations')
        .select('id, name, sort_order')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true }),
      supabase
        .from('properties')
        .select('id, property_name, internal_name, is_live, location_id, sort_order')
        .eq('user_id', user.id)
        .eq('is_live', true)
        .order('sort_order', { ascending: true }),
    ]);

  if (locationsError || propertiesError) {
    return (
      <main className="py-10">
        <p className="mt-2 text-sm text-rose-700">Unable to load data.</p>
      </main>
    );
  }

  const locList = locations ?? [];
  const propList = properties ?? [];

  const byLocation = new Map<string, typeof propList>();
  for (const p of propList) {
    const lid = p.location_id as string;
    const arr = byLocation.get(lid) ?? [];
    arr.push(p);
    byLocation.set(lid, arr);
  }
  for (const arr of byLocation.values()) {
    arr.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  }

  const sections = locList.map((loc) => ({
    locationId: loc.id as string,
    locationName: (loc.name as string) ?? 'Location',
    properties: (byLocation.get(loc.id as string) ?? []).map((p) => ({
      id: p.id as string,
      property_name: (p.property_name as string) ?? '',
      internal_name: p.internal_name as string | null,
    })),
  }));

  const propertyIds = propList.map((p) => p.id as string);
  const { data: guestLinks, error: guestLinksError } =
    propertyIds.length === 0
      ? { data: [], error: null }
      : await supabase
          .from('guest_links')
          .select(
            'id, property_id, guest_name, checkout_date, expires_at, token, created_at, is_permanent'
          )
          .in('property_id', propertyIds)
          .order('created_at', { ascending: false });

  const linkIds = (guestLinks ?? []).map((l) => l.id as string);
  const openStatsByLinkId =
    linkIds.length > 0 ? await getGuestLinkOpenStatsForLinkIds(linkIds) : {};

  return (
    <main className="py-10">
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        See whether guest links were opened and approx. how many devices loaded the portal.
      </p>

      <TrackGuestLinksClient
        sections={sections}
        guestLinks={guestLinks ?? []}
        guestLinksError={Boolean(guestLinksError)}
        openStatsByLinkId={openStatsByLinkId}
      />
    </main>
  );
}
