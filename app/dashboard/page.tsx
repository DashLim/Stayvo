import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import PropertyCard from '@/app/dashboard/PropertyCard';

export default async function DashboardPage() {
  const nowIso = new Date().toISOString();
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) redirect('/login?redirect=/dashboard');

  const { data: properties, error: propertiesError } = await supabase
    .from('properties')
    .select('id, property_name, city, is_live')
    .order('created_at', { ascending: false });

  const propertyIds = (properties ?? []).map((p) => p.id);
  const { data: guestLinks, error: guestLinksError } =
    propertyIds.length === 0
      ? { data: [], error: null }
      : await supabase
          .from('guest_links')
          .select(
            'id, property_id, guest_name, checkout_date, expires_at, token, created_at'
          )
          .in('property_id', propertyIds)
          .order('created_at', { ascending: false });

  if (propertiesError) {
    return (
      <main className="py-10">
        <h1 className="text-lg font-semibold">Dashboard</h1>
        <p className="mt-2 text-sm text-rose-700">
          Unable to load your properties.
        </p>
      </main>
    );
  }

  return (
    <main className="py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Host dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Create and manage your guest portals.
          </p>
        </div>

        <Link
          href="/properties/new"
          className="inline-flex items-center justify-center rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
        >
          + Add property
        </Link>
      </div>

      <section className="mt-6">
        {properties && properties.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {properties.map((p) => {
              const linksForProperty = (guestLinksError ? [] : guestLinks ?? []).filter(
                (l) => l.property_id === p.id
              );
              return (
                <PropertyCard
                key={p.id}
                  property={p}
                  links={linksForProperty}
                  nowIso={nowIso}
                />
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
            <h2 className="text-base font-semibold">No properties yet</h2>
            <p className="mt-2 text-sm text-slate-600">
              Create your first property profile to generate a guest portal link
              in Phase 2.
            </p>
            <Link
              href="/properties/new"
              className="mt-5 inline-flex items-center justify-center rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
            >
              + Add your first property
            </Link>
          </div>
        )}
        {guestLinksError ? (
          <p className="mt-3 text-xs text-amber-700">
            Guest links are temporarily unavailable. Run Phase 2 migration
            (`supabase db push`) to enable link generation.
          </p>
        ) : null}
      </section>
    </main>
  );
}

