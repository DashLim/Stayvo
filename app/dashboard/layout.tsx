import DashboardChrome from '@/app/dashboard/_components/DashboardChrome';
import HostDesktopSidebar from '@/app/dashboard/_components/HostDesktopSidebar';
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

  const meta = user?.user_metadata as { host_display_name?: string } | undefined;
  const displayName =
    (meta?.host_display_name && String(meta.host_display_name).trim()) ||
    (user?.email ? user.email.split('@')[0] : '') ||
    'Host';
  const email = user?.email ?? '';

  return (
    <HostTierProvider
      value={{
        tier,
        propertyCount: propertyCount ?? 0,
        locationCount: locationCount ?? 0,
      }}
    >
      <div className="flex min-h-screen w-full max-w-none flex-col md:flex-row md:bg-gradient-to-b md:from-[#fdf9f3] md:via-[#faf2e6] md:to-[#f3e5d4] dark:md:from-[#0e0d11] dark:md:via-[#16141c] dark:md:to-[#121118]">
        <HostDesktopSidebar displayName={displayName} email={email} />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0">
          <div className="mx-auto w-full max-w-2xl flex-1 px-4 md:max-w-none md:px-8">
            <DashboardChrome />
            {children}
          </div>
        </div>
      </div>
    </HostTierProvider>
  );
}
