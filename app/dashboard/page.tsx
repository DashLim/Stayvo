import { redirect } from 'next/navigation';
import DashboardClient from '@/app/dashboard/DashboardClient';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { guestLinkPublicBaseUrl } from '@/lib/guest-portal-url';

export default async function DashboardPage() {
  const nowIso = new Date().toISOString();
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) redirect('/login?redirect=/dashboard');

  const [
    { data: locations, error: locationsError },
    { data: properties, error: propertiesError },
    { count: totalPropertyCount },
  ] = await Promise.all([
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
    supabase
      .from('properties')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
  ]);

  if (locationsError || propertiesError) {
    return (
      <main className="py-10">
        <h1 className="text-lg font-semibold">Dashboard</h1>
        <p className="mt-2 text-sm text-rose-700">
          Unable to load your properties.
        </p>
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
      is_live: Boolean(p.is_live),
    })),
  }));

  const locationOptions = locList.map((l) => ({
    id: l.id as string,
    name: (l.name as string) ?? 'Location',
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

  const meta = user.user_metadata as { host_display_name?: string } | null;
  const hostDisplayName = meta?.host_display_name ?? null;
  /** Resolved on the server so guest links use stayvo.io even if the client bundle inlined the wrong NEXT_PUBLIC_* at build. */
  const guestLinkBaseUrl = guestLinkPublicBaseUrl();

  return (
    <main className="py-10">
      <DashboardClient
        userId={user.id}
        nowIso={nowIso}
        sections={sections}
        locationOptions={locationOptions}
        guestLinks={guestLinks ?? []}
        guestLinksError={Boolean(guestLinksError)}
        hasAnyProperty={(totalPropertyCount ?? 0) > 0}
        hostDisplayName={hostDisplayName}
        guestLinkBaseUrl={guestLinkBaseUrl}
      />
    </main>
  );
}
