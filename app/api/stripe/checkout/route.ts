import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getServerAppOrigin } from '@/lib/app-origin-server';
import { resolveStripeCustomerId } from '@/lib/stripe-customer';
import {
  getStripe,
  stripePriceIdForInterval,
  type BillingInterval,
} from '@/lib/stripe-server';

function parseBillingInterval(body: unknown): BillingInterval {
  if (body == null || typeof body !== 'object') return 'monthly';
  const interval = (body as { interval?: unknown }).interval;
  if (interval === 'annual' || interval === 'yearly') return 'annual';
  return 'monthly';
}

export async function POST(request: Request) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe billing is not configured on this deployment.' },
      { status: 503 }
    );
  }

  let interval: BillingInterval = 'monthly';
  try {
    const body = await request.json();
    interval = parseBillingInterval(body);
  } catch {
    // Empty body or non-JSON → default to monthly (backward compatible).
  }

  const priceId = stripePriceIdForInterval(interval);
  if (!priceId) {
    const missing =
      interval === 'annual'
        ? 'STRIPE_PRICE_ID_ANNUAL'
        : 'STRIPE_PRICE_ID_MONTHLY (or STRIPE_PRICE_ID)';
    return NextResponse.json(
      { error: `Stripe billing is missing ${missing} on this deployment.` },
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
  const storedCustomerId = (plan as { stripe_customer_id?: string | null }).stripe_customer_id;
  const stripeCustomerId = await resolveStripeCustomerId(
    stripe,
    supabase,
    user.id,
    storedCustomerId
  );

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/dashboard/profile?checkout=success`,
      cancel_url: `${origin}/dashboard/profile?checkout=canceled`,
      client_reference_id: user.id,
      metadata: {
        supabase_user_id: user.id,
        billing_interval: interval,
      },
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
          billing_interval: interval,
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
