import Link from 'next/link';
import StayvoProLink from '@/app/_components/StayvoProLink';
import { redirect } from 'next/navigation';
import PropertyFormClient from '@/app/properties/_components/PropertyFormClient';
import { ensureGeneralLocation } from '@/app/actions/locations';
import { getHostTier } from '@/lib/host-plan';
import { FREE_TIER_MAX_PROPERTIES } from '@/lib/host-tier';
import { BASE_SECTION_KEYS } from '@/lib/guest-layout';
import { guestPropertyMediaResolvedPublicBase } from '@/lib/guest-property-media';
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

  const hostTier = await getHostTier(supabase, user.id);
  const { count: propertyCount } = await supabase
    .from('properties')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);

  if (hostTier === 'free' && (propertyCount ?? 0) >= FREE_TIER_MAX_PROPERTIES) {
    return (
      <main className="mx-auto max-w-lg py-12 px-4">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Property limit</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          Free accounts can have up to {FREE_TIER_MAX_PROPERTIES} properties.{' '}
          <StayvoProLink /> includes unlimited properties and additional features.
        </p>
        <p className="mt-4">
          <Link
            href="/dashboard/manage"
            className="text-sm font-semibold text-brand underline-offset-2 hover:underline"
          >
            Back to Manage
          </Link>
        </p>
      </main>
    );
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
  const guestMediaPublicBase = guestPropertyMediaResolvedPublicBase();

  return (
    <PropertyFormClient
      mode="create"
      locations={list}
      hostTier={hostTier}
      guestMediaPublicBase={guestMediaPublicBase}
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
