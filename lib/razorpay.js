/**
 * Razorpay integration utility for PropLogAI.
 *
 * Handles subscription creation, cancellation, and webhook verification.
 * Uses Razorpay Subscriptions API for recurring billing.
 *
 * Env vars required:
 * RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET,
 * RAZORPAY_PLAN_ID_MONTHLY, RAZORPAY_PLAN_ID_YEARLY
 * Optional: RAZORPAY_OFFER_ID_5 (5% partner discount offer, created in Dashboard)
 */

import crypto from 'crypto';

const RAZORPAY_API = 'https://api.razorpay.com/v1';

function getAuth() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new Error('Razorpay keys not configured');
  return 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
}

/**
 * Create a Razorpay subscription for a user.
 * Returns the subscription object including short_url for redirect.
 *
 * @param {object} options
 * @param {string} options.billingCycle - 'monthly' or 'yearly'
 * @param {string} options.email - user email for Razorpay customer
 * @param {string} options.userId - internal user ID (stored in notes)
 * @param {string} [options.offerId] - optional Razorpay offer id (e.g. partner 5% discount)
 * @param {boolean} [options.trial=true] - include the 14-day free trial. When false,
 *        the subscription starts immediately and the first (discounted) charge happens now.
 * @returns {Promise<object>} Razorpay subscription object
 */
export async function createSubscription({ billingCycle, email, userId, offerId = null, trial = true }) {
  const planId = billingCycle === 'yearly'
    ? process.env.RAZORPAY_PLAN_ID_YEARLY
    : process.env.RAZORPAY_PLAN_ID_MONTHLY;

  if (!planId) throw new Error(`Razorpay plan ID not configured for ${billingCycle}`);

  const body = {
    plan_id: planId,
    total_count: billingCycle === 'yearly' ? 10 : 120, // max billing cycles
    quantity: 1,
    customer_notify: 1,
    notes: {
      user_id: userId,
      billing_cycle: billingCycle,
    },
  };

  // 14-day trial: set start_at 14 days out so the first charge is deferred.
  // When trial is disabled (e.g. discounted coupon checkout), omit start_at so
  // Razorpay charges the first cycle immediately.
  if (trial) {
    body.start_at = Math.floor(Date.now() / 1000) + 14 * 24 * 60 * 60;
  }

  // Attach a discount offer (e.g. partner 5%) when provided.
  if (offerId) body.offer_id = offerId;

  const res = await fetch(`${RAZORPAY_API}/subscriptions`, {
    method: 'POST',
    headers: {
      'Authorization': getAuth(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.description || `Razorpay API error: ${res.status}`);
  }

  return res.json();
}

/**
 * Cancel a Razorpay subscription.
 *
 * @param {string} subscriptionId - Razorpay subscription ID
 * @param {boolean} atCycleEnd - if true, cancels at end of current billing cycle
 * @returns {Promise<object>} Updated subscription object
 */
export async function cancelSubscription(subscriptionId, atCycleEnd = true) {
  const res = await fetch(`${RAZORPAY_API}/subscriptions/${subscriptionId}/cancel`, {
    method: 'POST',
    headers: {
      'Authorization': getAuth(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ cancel_at_cycle_end: atCycleEnd }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.description || `Cancel failed: ${res.status}`);
  }

  return res.json();
}

/**
 * Fetch a Razorpay subscription by ID.
 *
 * @param {string} subscriptionId
 * @returns {Promise<object>} Subscription details
 */
export async function fetchSubscription(subscriptionId) {
  const res = await fetch(`${RAZORPAY_API}/subscriptions/${subscriptionId}`, {
    headers: { 'Authorization': getAuth() },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.description || `Fetch failed: ${res.status}`);
  }

  return res.json();
}

/**
 * Verify Razorpay webhook signature.
 *
 * @param {string} rawBody - raw request body string
 * @param {string} signature - X-Razorpay-Signature header value
 * @returns {boolean} Whether the signature is valid
 */
export function verifyWebhookSignature(rawBody, signature) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) throw new Error('RAZORPAY_WEBHOOK_SECRET not configured');

  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

/**
 * Verify Razorpay payment callback signature.
 * Used after redirect from hosted checkout page.
 *
 * @param {string} paymentId - razorpay_payment_id
 * @param {string} subscriptionId - razorpay_subscription_id
 * @param {string} signature - razorpay_signature
 * @returns {boolean} Whether the signature is valid
 */
export function verifyPaymentSignature(paymentId, subscriptionId, signature) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) throw new Error('RAZORPAY_KEY_SECRET not configured');

  const payload = `${paymentId}|${subscriptionId}`;
  const expected = crypto
    .createHmac('sha256', keySecret)
    .update(payload)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}
