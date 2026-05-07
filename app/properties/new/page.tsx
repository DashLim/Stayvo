import { redirect } from 'next/navigation';
import PropertyForm from '@/app/properties/_components/PropertyForm';
import { ensureGeneralLocation } from '@/app/actions/locations';
import { BASE_SECTION_KEYS } from '@/lib/guest-layout';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function NewPropertyPage({
  searchParams,
}: {
  searchParams?: Promise<{ locationId?: string; returnTo?: string }>;
}) {
  const qs = (await searchParams) ?? {};
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/login?redirect=/properties/new');
  }

  const locRes = await ensureGeneralLocation();
  if (!locRes.ok) {
    return (
      <main className="py-10">
        <h1 className="text-lg font-semibold">New property</h1>
        <p className="mt-2 text-sm text-rose-700">{locRes.error}</p>
        <p className="mt-2 text-sm text-slate-600">
          If you just added locations, run{' '}
          <code className="rounded bg-slate-100 px-1">supabase db push</code> and refresh.
        </p>
      </main>
    );
  }

  const { data: locations } = await supabase
    .from('locations')
    .select('id, name')
    .eq('user_id', user.id)
    .order('sort_order', { ascending: true });

  const list = locations ?? [];
  const selectedFromQuery = (qs.locationId ?? '').trim();
  const queryLocationValid = list.some((l) => l.id === selectedFromQuery);
  const defaultLocationId = queryLocationValid ? selectedFromQuery : locRes.locationId;

  return (
    <PropertyForm
      mode="create"
      locations={list}
      initialValues={{
        isLive: true,
        locationId: defaultLocationId,
        checkInInstructions: [],
        houseRules: [],
        guidebookTips: [],
        customDetails: [],
        guestSectionOrder: [...BASE_SECTION_KEYS],
      }}
    />
  );
}
