import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyWebhookSignature } from '@/lib/razorpay';
import { sendEmail, isEmailConfigured } from '@/lib/email';
import { buildPaymentReceiptEmail, buildPaymentFailedEmail } from '@/lib/subscription-emails';

/**
 * POST /api/razorpay/webhook
 *
 * Handles Razorpay webhook events for subscription lifecycle.
 * Uses service role client since webhooks are not user-authenticated.
 * Includes idempotency protection to prevent duplicate event processing.
 */

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

/**
 * Check if a webhook event has already been processed.
 * Returns true if this is a duplicate (already processed), false if new.
 */
async function isDuplicateEvent(supabase, eventId, eventType) {
  if (!eventId) return false; // No event ID — can't deduplicate, process anyway

  // Try to insert — unique constraint on event_id will reject duplicates
  const { error } = await supabase
    .from('razorpay_webhook_events')
    .insert({ event_id: eventId, event_type: eventType });

  if (error) {
    // Unique violation = duplicate event
    if (error.code === '23505') {
      console.log(`Razorpay webhook: duplicate event ${eventId} (${eventType}), skipping`);
      return true;
    }
    // Table might not exist yet (migration not run) — log and proceed
    console.warn('Webhook idempotency check failed:', error.message);
    return false;
  }

  return false; // Successfully inserted — this is a new event
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
    const eventId = event.payload?.payment?.entity?.id
      || event.payload?.subscription?.entity?.id
      || null;
    // Build a composite key: eventType + entity ID to uniquely identify this delivery
    const idempotencyKey = eventId ? `${eventType}:${eventId}:${event.created_at || ''}` : null;

    const supabase = getAdminClient();

    // Idempotency check — skip if already processed
    if (idempotencyKey && await isDuplicateEvent(supabase, idempotencyKey, eventType)) {
      return NextResponse.json({ status: 'ok', duplicate: true });
    }

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
        const updatedSub = await updateSubscription(supabase, sub.id, {
          status: 'active',
          renews_at: currentEnd,
          last_payment_id: payment?.id || null,
          last_payment_at: new Date().toISOString(),
        });
        // Send payment receipt email
        if (isEmailConfigured() && updatedSub?.user_id && payment) {
          try {
            const { data: u } = await supabase.auth.admin.getUserById(updatedSub.user_id);
            if (u?.user?.email) {
              const { data: subRow } = await supabase.from('subscriptions').select('billing_cycle').eq('user_id', updatedSub.user_id).maybeSingle();
              const receipt = buildPaymentReceiptEmail({
                amount: payment.amount,
                billingCycle: subRow?.billing_cycle || 'monthly',
                nextBillingDate: currentEnd,
              });
              await sendEmail({ to: u.user.email, subject: receipt.subject, html: receipt.html });
            }
          } catch (e) { console.error('Receipt email error:', e); }
        }
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
        // Individual payment failed
        const payment = event.payload.payment?.entity;
        if (payment) {
          console.log(`Payment failed: ${payment.id}, error: ${payment.error_code} - ${payment.error_description}`);
          // Send payment failed email
          if (isEmailConfigured()) {
            try {
              const subEntity = event.payload.subscription?.entity;
              if (subEntity) {
                const failedSub = await supabase.from('subscriptions').select('user_id').eq('razorpay_subscription_id', subEntity.id).maybeSingle();
                if (failedSub?.data?.user_id) {
                  const { data: u } = await supabase.auth.admin.getUserById(failedSub.data.user_id);
                  if (u?.user?.email) {
                    const failedEmail = buildPaymentFailedEmail({ errorMessage: payment.error_description });
                    await sendEmail({ to: u.user.email, subject: failedEmail.subject, html: failedEmail.html });
                  }
                }
              }
            } catch (e) { console.error('Failed payment email error:', e); }
          }
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
