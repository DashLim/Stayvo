import { redirect } from 'next/navigation';
import ProfileClient from '@/app/dashboard/profile/ProfileClient';
import { hasCheckInAccessForAuthUser } from '@/lib/check-in-access';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function DashboardProfilePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) redirect('/login?redirect=/dashboard/profile');

  const meta = user.user_metadata as { host_display_name?: string } | null;
  const checkInAccess = hasCheckInAccessForAuthUser(user.id);

  return (
    <main className="py-10">
      <ProfileClient
        email={user.email ?? ''}
        initialHostName={(meta?.host_display_name as string | undefined) ?? ''}
        checkInAccess={checkInAccess}
      />
    </main>
  );
}
