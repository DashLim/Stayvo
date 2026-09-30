import DashboardChrome from '@/app/dashboard/_components/DashboardChrome';
import HostDesktopSidebar from '@/app/dashboard/_components/HostDesktopSidebar';
import { CheckInHostProvider } from '@/app/dashboard/_components/CheckInHostProvider';
import HostShell from '@/app/_components/HostShell';
import { hasCheckInAccessForAuthUser } from '@/lib/check-in-access';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const checkInAccess = hasCheckInAccessForAuthUser(user?.id);

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
    <CheckInHostProvider
      value={{
        checkInAccess,
        propertyCount: propertyCount ?? 0,
        locationCount: locationCount ?? 0,
      }}
    >
      <HostShell className="flex min-h-screen w-full max-w-none flex-col bg-muted/20 md:flex-row">
        <HostDesktopSidebar displayName={displayName} email={email} />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0">
          <div className="mx-auto flex w-full min-w-0 flex-1 flex-col md:max-w-none">
            <DashboardChrome />
            <div className="mx-auto w-full max-w-2xl flex-1 px-4 md:max-w-6xl md:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </div>
      </HostShell>
    </CheckInHostProvider>
  );
}
