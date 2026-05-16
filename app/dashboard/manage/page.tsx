import Link from 'next/link';
import { redirect } from 'next/navigation';
import ManageDashboardClientNoSSR from '@/app/dashboard/manage/ManageDashboardClientNoSSR';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function DashboardManagePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) redirect('/login?redirect=/dashboard/manage');

  const [{ data: locations, error: locErr }, { data: properties, error: propErr }] =
    await Promise.all([
      supabase
        .from('locations')
        .select('id, name')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true }),
      supabase
        .from('properties')
        .select('id, property_name, internal_name, location_id, sort_order, is_live')
        .eq('user_id', user.id),
    ]);

  if (locErr || propErr) {
    return (
      <main className="py-10">
        <p className="mt-2 text-sm text-rose-700">Unable to load data.</p>
      </main>
    );
  }

  const locList = locations ?? [];
  const propList = properties ?? [];

  const byLoc = new Map<string, typeof propList>();
  for (const p of propList) {
    const lid = p.location_id as string;
    const arr = byLoc.get(lid) ?? [];
    arr.push(p);
    byLoc.set(lid, arr);
  }
  for (const arr of byLoc.values()) {
    arr.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  }

  const locationGroups = locList.map((loc) => ({
    location: { id: loc.id as string, name: loc.name as string },
    properties: byLoc.get(loc.id as string) ?? [],
  }));

  return (
    <main className="py-10">
      <div className="w-full md:mx-auto md:max-w-[1100px]">
        <ManageDashboardClientNoSSR locationGroups={locationGroups} />
      </div>
    </main>
  );
}
