import { redirect } from 'next/navigation';
import ProfileClient from '@/app/dashboard/profile/ProfileClient';
import { getHostTier } from '@/lib/host-plan';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function DashboardProfilePage({
  searchParams,
}: {
  searchParams?: Promise<{ checkout?: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) redirect('/login?redirect=/dashboard/profile');

  const meta = user.user_metadata as { host_display_name?: string } | null;
  const hostTier = await getHostTier(supabase, user.id);

  const { data: planRow } = await supabase
    .from('host_plan')
    .select('stripe_customer_id, subscription_status')
    .eq('user_id', user.id)
    .maybeSingle();

  const plan = planRow as {
    stripe_customer_id?: string | null;
    subscription_status?: string | null;
  } | null;

  const hasStripeCustomer = Boolean(plan?.stripe_customer_id?.trim());
  const canManageSubscription = hostTier === 'pro' && hasStripeCustomer;
  const paymentPastDue = plan?.subscription_status === 'past_due';

  const sp = await (searchParams ?? Promise.resolve({} as { checkout?: string }));
  const checkoutParam = sp.checkout;

  let checkoutBanner: null | 'success' | 'canceled' = null;
  if (checkoutParam === 'success') checkoutBanner = 'success';
  else if (checkoutParam === 'canceled') checkoutBanner = 'canceled';

  return (
    <main className="py-10">
      <ProfileClient
        email={user.email ?? ''}
        initialHostName={(meta?.host_display_name as string | undefined) ?? ''}
        hostTier={hostTier}
        checkoutBanner={checkoutBanner}
        canManageSubscription={canManageSubscription}
        paymentPastDue={paymentPastDue}
      />
    </main>
  );
}
