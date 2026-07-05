import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyWebhookSignature } from '@/lib/razorpay';

/**
 * POST /api/razorpay/webhook
 *
 * Handles Razorpay webhook events for subscription lifecycle.
 * Uses service role client since webhooks are not user-authenticated.
 */

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function POST(request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature') || '';

    // Verify webhook signature
    if (!verifyWebhookSignature(rawBody, signature)) {
      console.error('Razorpay webhook: invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event;
    const supabase = getAdminClient();

    console.log(`Razorpay webhook: ${eventType}`);

    switch (eventType) {
      case 'subscription.authenticated': {
        // User completed mandate registration, subscription is authenticated
        const sub = event.payload.subscription.entity;
        await updateSubscription(supabase, sub.id, {
          status: 'authenticated',
        });
        break;
      }

      case 'subscription.activated': {
        // First payment successful, subscription is now active
        const sub = event.payload.subscription.entity;
        const currentEnd = sub.current_end ? new Date(sub.current_end * 1000).toISOString() : null;
        await updateSubscription(supabase, sub.id, {
          status: 'active',
          renews_at: currentEnd,
        });
        break;
      }

      case 'subscription.charged': {
        // Recurring payment successful
        const sub = event.payload.subscription.entity;
        const payment = event.payload.payment?.entity;
        const currentEnd = sub.current_end ? new Date(sub.current_end * 1000).toISOString() : null;
        await updateSubscription(supabase, sub.id, {
          status: 'active',
          renews_at: currentEnd,
          last_payment_id: payment?.id || null,
          last_payment_at: new Date().toISOString(),
        });
        break;
      }

      case 'subscription.pending': {
        // Payment failed, Razorpay is retrying
        const sub = event.payload.subscription.entity;
        await updateSubscription(supabase, sub.id, {
          status: 'pending',
        });
        break;
      }

      case 'subscription.halted': {
        // All retry attempts exhausted, subscription halted
        const sub = event.payload.subscription.entity;
        await updateSubscription(supabase, sub.id, {
          status: 'halted',
          plan: 'basic', // Downgrade to basic
        });
        break;
      }

      case 'subscription.cancelled': {
        // Subscription cancelled (may still be active until cycle end)
        const sub = event.payload.subscription.entity;
        const endAt = sub.ended_at || sub.current_end;
        const endsAtDate = endAt ? new Date(endAt * 1000).toISOString() : null;
        await updateSubscription(supabase, sub.id, {
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          // Keep plan as 'elite' until the end date if cancel_at_cycle_end was true
          renews_at: endsAtDate,
        });
        break;
      }

      case 'subscription.completed': {
        // Subscription reached total_count — treat as expired
        const sub = event.payload.subscription.entity;
        await updateSubscription(supabase, sub.id, {
          status: 'completed',
          plan: 'basic',
        });
        break;
      }

      case 'payment.failed': {
        // Individual payment failed (subscription.pending handles the sub side)
        const payment = event.payload.payment?.entity;
        if (payment) {
          console.log(`Payment failed: ${payment.id}, error: ${payment.error_code} - ${payment.error_description}`);
        }
        break;
      }

      default:
        console.log(`Unhandled webhook event: ${eventType}`);
    }

    return NextResponse.json({ status: 'ok' });
  } catch (err) {
    console.error('Razorpay webhook error:', err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

/**
 * Update subscription record in DB by Razorpay subscription ID.
 */
async function updateSubscription(supabase, razorpaySubId, updates) {
  const { data, error } = await supabase
    .from('subscriptions')
    .update(updates)
    .eq('razorpay_subscription_id', razorpaySubId)
    .select('id, user_id')
    .maybeSingle();

  if (error) {
    console.error('Failed to update subscription:', error.message);
  } else if (!data) {
    console.error(`No subscription found for Razorpay ID: ${razorpaySubId}`);
  }

  return data;
}
