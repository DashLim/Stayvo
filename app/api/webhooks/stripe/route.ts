import { NextResponse } from 'next/server';
import type Stripe from 'stripe';

import { getServiceRoleSupabase } from '@/lib/supabase/admin';
import { getStripe, webhookSecret } from '@/lib/stripe-server';
import {
  downgradeHostPlanFree,
  upsertHostPlanFromSubscription,
} from '@/lib/stripe-sync-host-plan';

/** Stripe webhooks must use Node for raw body + signature verification. */
export const runtime = 'nodejs';

export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = webhookSecret();
  const admin = getServiceRoleSupabase();

  if (!stripe || !secret) {
    console.error('[stripe/webhook] Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET');
    return NextResponse.json({ received: false, error: 'not_configured' }, { status: 503 });
  }

  if (!admin) {
    console.error('[stripe/webhook] Missing SUPABASE_SERVICE_ROLE_KEY');
    return NextResponse.json({ received: false, error: 'service_role_missing' }, { status: 503 });
  }

  const rawBody = await request.text();
  const sig = request.headers.get('stripe-signature');
  if (!sig) {
    return NextResponse.json({ received: false, error: 'no_signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, secret);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'invalid_signature';
    console.error('[stripe/webhook]', msg);
    return NextResponse.json({ received: false, error: msg }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== 'subscription') break;

        const userId =
          session.metadata?.supabase_user_id ?? session.client_reference_id ?? undefined;

        const subId = typeof session.subscription === 'string' ? session.subscription : null;
        if (!subId || !userId) {
          console.error('[stripe/webhook] checkout.session.completed missing subscription or user');
          break;
        }

        const subscription = await stripe.subscriptions.retrieve(subId);
        const ok = await upsertHostPlanFromSubscription(admin, subscription, { userId });
        if (!ok) {
          console.error('[stripe/webhook] host_plan upsert failed for user', userId);
        }
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        let ok = await upsertHostPlanFromSubscription(admin, sub);
        if (!ok) {
          const fresh = await stripe.subscriptions.retrieve(sub.id);
          ok = await upsertHostPlanFromSubscription(admin, fresh);
        }
        if (!ok) {
          console.warn('[stripe/webhook] could not upsert subscription', sub.id);
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await downgradeHostPlanFree(admin, sub);
        break;
      }
      default:
        break;
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'handler_error';
    console.error('[stripe/webhook] handler:', msg);
  }

  return NextResponse.json({ received: true });
}
