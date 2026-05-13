import DashboardChrome from '@/app/dashboard/_components/DashboardChrome';
import { HostTierProvider } from '@/app/dashboard/_components/HostTierProvider';
import { getHostTier } from '@/lib/host-plan';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const tier = user ? await getHostTier(supabase, user.id) : 'free';

  const [{ count: propertyCount }, { count: locationCount }] = user
    ? await Promise.all([
        supabase
          .from('properties')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('locations')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
      ])
    : [{ count: 0 }, { count: 0 }];

  return (
    <HostTierProvider
      value={{
        tier,
        propertyCount: propertyCount ?? 0,
        locationCount: locationCount ?? 0,
      }}
    >
      <div className="mx-auto w-full max-w-2xl px-4">
        <div className="pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
          <DashboardChrome />
          {children}
        </div>
      </div>
    </HostTierProvider>
  );
}
