import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyWebhookSignature } from '@/lib/razorpay';
import { sendEmail, isEmailConfigured } from '@/lib/email';
import { buildPaymentReceiptEmail, buildPaymentFailedEmail } from '@/lib/subscription-emails';
import { commissionForCharge } from '@/lib/affiliate';

/**
 * POST /api/razorpay/webhook
 *
 * Handles Razorpay webhook events for subscription lifecycle.
 * Uses service role client since webhooks are not user-authenticated.
 * Includes idempotency protection to prevent duplicate event processing.
 *
 * Affiliate program: creates recurring commissions on paid events, stops
 * commissions on cancel/halt/complete, and reverses on refund. Commission
 * inserts are idempotent via a unique index on razorpay_payment_id.
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
        const payment = event.payload.payment?.entity;
        const currentEnd = sub.current_end ? new Date(sub.current_end * 1000).toISOString() : null;
        const updatedSub = await updateSubscription(supabase, sub.id, {
          status: 'active',
          renews_at: currentEnd,
        });
        // Affiliate commission on the first paid charge (idempotent by payment id)
        if (updatedSub?.user_id && payment?.id) {
          await recordAffiliateCommission(supabase, updatedSub.user_id, payment);
        }
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
        // Affiliate recurring commission (idempotent by payment id)
        if (updatedSub?.user_id && payment?.id) {
          await recordAffiliateCommission(supabase, updatedSub.user_id, payment);
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
        const updatedSub = await updateSubscription(supabase, sub.id, {
          status: 'halted',
          plan: 'basic', // Downgrade to basic
        });
        // Stop future affiliate commissions for this referred user
        if (updatedSub?.user_id) await cancelAffiliateReferral(supabase, updatedSub.user_id);
        break;
      }

      case 'subscription.cancelled': {
        // Subscription cancelled (may still be active until cycle end)
        const sub = event.payload.subscription.entity;
        const endAt = sub.ended_at || sub.current_end;
        const endsAtDate = endAt ? new Date(endAt * 1000).toISOString() : null;
        const updatedSub = await updateSubscription(supabase, sub.id, {
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          // Keep plan as 'elite' until the end date if cancel_at_cycle_end was true
          renews_at: endsAtDate,
        });
        // Stop future affiliate commissions (earned commissions are kept)
        if (updatedSub?.user_id) await cancelAffiliateReferral(supabase, updatedSub.user_id);
        break;
      }

      case 'subscription.completed': {
        // Subscription reached total_count — treat as expired
        const sub = event.payload.subscription.entity;
        const updatedSub = await updateSubscription(supabase, sub.id, {
          status: 'completed',
          plan: 'basic',
        });
        if (updatedSub?.user_id) await cancelAffiliateReferral(supabase, updatedSub.user_id);
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

      case 'refund.created':
      case 'refund.processed': {
        // A payment was refunded — reverse the matching affiliate commission.
        const refund = event.payload.refund?.entity;
        const refundedPaymentId = refund?.payment_id || event.payload.payment?.entity?.id || null;
        if (refundedPaymentId) {
          await reverseAffiliateCommission(supabase, refundedPaymentId);
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

/* ─── Affiliate commission engine ──────────────────────────────
 * Creates a pending commission for the referring affiliate when a referred
 * user is charged. Idempotent: a unique index on razorpay_payment_id blocks
 * duplicates. Never throws — commission failures must not fail the webhook.
 */
async function recordAffiliateCommission(supabase, userId, payment) {
  try {
    if (!userId || !payment?.id) return;

    const { data: ref } = await supabase
      .from('affiliate_referrals')
      .select('id, affiliate_id, subscription_id, status')
      .eq('referred_user_id', userId)
      .maybeSingle();
    if (!ref || ref.status !== 'active') return;

    const { data: aff } = await supabase
      .from('affiliates')
      .select('id, commission_rate, status')
      .eq('id', ref.affiliate_id)
      .maybeSingle();
    if (!aff || aff.status !== 'approved') return;

    const { data: subRow } = await supabase
      .from('subscriptions')
      .select('billing_cycle')
      .eq('user_id', userId)
      .maybeSingle();
    const billingCycle = subRow?.billing_cycle === 'yearly' ? 'yearly' : 'monthly';
    const amount = commissionForCharge(aff.commission_rate, billingCycle);

    const { error } = await supabase.from('affiliate_commissions').insert({
      affiliate_id: aff.id,
      referred_user_id: userId,
      subscription_id: ref.subscription_id || null,
      razorpay_payment_id: payment.id,
      cycle: billingCycle,
      amount,
      currency: 'USD',
      status: 'pending',
    });
    if (error && error.code !== '23505') {
      console.error('Affiliate commission insert error:', error.message);
    }
  } catch (e) {
    console.error('recordAffiliateCommission error (non-fatal):', e?.message || e);
  }
}

/** Stop future commissions by marking the user's referral cancelled. */
async function cancelAffiliateReferral(supabase, userId) {
  try {
    if (!userId) return;
    await supabase
      .from('affiliate_referrals')
      .update({ status: 'cancelled' })
      .eq('referred_user_id', userId);
  } catch (e) {
    console.error('cancelAffiliateReferral error (non-fatal):', e?.message || e);
  }
}

/** Reverse a commission tied to a refunded payment. */
async function reverseAffiliateCommission(supabase, paymentId) {
  try {
    if (!paymentId) return;
    await supabase
      .from('affiliate_commissions')
      .update({ status: 'reversed' })
      .eq('razorpay_payment_id', paymentId);
  } catch (e) {
    console.error('reverseAffiliateCommission error (non-fatal):', e?.message || e);
  }
}
