import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getServerAppOrigin } from '@/lib/app-origin-server';
import { getStripe } from '@/lib/stripe-server';

export async function POST() {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe billing is not configured on this deployment.' },
      { status: 503 }
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  }

  const { data: plan } = await supabase
    .from('host_plan')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .maybeSingle();

  const stripeCustomerId = (plan as { stripe_customer_id?: string | null } | null)
    ?.stripe_customer_id?.trim();

  if (!stripeCustomerId) {
    return NextResponse.json(
      {
        error:
          'No Stripe billing profile found for this account. If you were upgraded manually, contact support.',
      },
      { status: 400 }
    );
  }

  const origin = getServerAppOrigin();

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${origin}/dashboard/profile`,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: 'Stripe did not return a portal URL. Try again in a moment.' },
        { status: 502 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Could not open billing portal.';
    console.error('[stripe/portal]', msg);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
