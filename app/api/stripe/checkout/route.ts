import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getServerAppOrigin } from '@/lib/app-origin-server';
import { getStripe, stripePriceId } from '@/lib/stripe-server';

export async function POST() {
  const stripe = getStripe();
  const priceId = stripePriceId();
  if (!stripe || !priceId) {
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
    return NextResponse.json({ error: 'You must be signed in to upgrade.' }, { status: 401 });
  }

  const { data: plan } = await supabase
    .from('host_plan')
    .select('tier, stripe_customer_id')
    .eq('user_id', user.id)
    .maybeSingle();

  const tier = (plan as { tier?: string } | null)?.tier ?? 'free';
  if (tier === 'pro') {
    return NextResponse.json({ error: 'You already have Stayvo Pro.' }, { status: 400 });
  }

  const origin = getServerAppOrigin();
  const stripeCustomerId = (plan as { stripe_customer_id?: string | null }).stripe_customer_id;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/dashboard/profile?checkout=success`,
      cancel_url: `${origin}/dashboard/profile?checkout=canceled`,
      client_reference_id: user.id,
      metadata: {
        supabase_user_id: user.id,
      },
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
        },
      },
      ...(stripeCustomerId
        ? { customer: stripeCustomerId }
        : { customer_email: user.email ?? undefined }),
      allow_promotion_codes: true,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: 'Stripe did not return a checkout URL. Try again in a moment.' },
        { status: 502 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Checkout failed.';
    console.error('[stripe/checkout]', msg);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
