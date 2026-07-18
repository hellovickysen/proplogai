import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createSubscription, cancelSubscription } from '@/lib/razorpay';
import { resolveAffiliateByCoupon, resolvePromoCode, getPartnerOfferId, promoOfferId } from '@/lib/affiliate';

/**
 * POST /api/razorpay/create-subscription
 *
 * Creates a Razorpay subscription and returns the hosted checkout URL.
 * Body: { billingCycle: 'monthly' | 'yearly', couponCode?: string, method?: 'card'|'upi' }
 *
 * A code can be either a PARTNER coupon (attaches the partner offer + binds
 * commission) or an ADMIN promo code (attaches that promo's Razorpay offer, no
 * commission). All resolution is wrapped so a bad/empty code never breaks a
 * normal checkout.
 *
 * Trial handling:
 * - New/basic user, no code → 14-day free trial (first charge deferred 14 days).
 * - New/basic user, discount code → charged the discounted amount now (no trial).
 * - User already ON a free trial + discount code → we KEEP their remaining trial
 *   days: the old trial subscription is cancelled and a new one is created with
 *   the discount offer and start_at pinned to their existing trial end. No charge
 *   today; the first (discounted) charge fires when the trial would have ended,
 *   then the normal cycle begins (e.g. buy on day 7 → 7 trial days + 30 paid).
 */

function getServiceClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

/**
 * Bind the effects of a valid code to the buyer: partner referral (first-touch)
 * and admin promo redemption count. Never throws — must not break checkout.
 */
async function bindCodeEffects(admin, { affiliate, promo, userId, subscriptionDbId }) {
  if (affiliate) {
    try {
      const { data: existing } = await admin
        .from('affiliate_referrals')
        .select('id')
        .eq('referred_user_id', userId)
        .maybeSingle();
      if (!existing) {
        await admin.from('affiliate_referrals').insert({
          affiliate_id: affiliate.id,
          referred_user_id: userId,
          source: 'coupon',
          subscription_id: subscriptionDbId,
          status: 'active',
        });
      }
    } catch (e) {
      console.error('Affiliate bind error (non-fatal):', e?.message || e);
    }
  }

  if (promo) {
    try {
      await admin
        .from('promo_codes')
        .update({ redeemed_count: (promo.redeemed_count || 0) + 1 })
        .eq('id', promo.id);
    } catch (e) {
      console.error('Promo redemption increment error (non-fatal):', e?.message || e);
    }
  }
}

export async function POST(request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
    }

    const { billingCycle = 'monthly', couponCode, method: rawMethod } = await request.json();
    if (!['monthly', 'yearly'].includes(billingCycle)) {
      return NextResponse.json({ error: 'Invalid billing cycle.' }, { status: 400 });
    }
    // Payment method the buyer chose on our checkout page (determines which
    // per-method Razorpay offer to pin). Defaults to card.
    const method = rawMethod === 'upi' ? 'upi' : 'card';

    const admin = getServiceClient();

    // Resolve a code (partner coupon first, then admin promo) BEFORE creating
    // the subscription, so an invalid code doesn't leave a dangling one.
    let affiliate = null;
    let promo = null;
    let offerId = null;
    const code = typeof couponCode === 'string' ? couponCode.trim() : '';
    if (code) {
      affiliate = await resolveAffiliateByCoupon(admin, code);
      if (affiliate) {
        if (affiliate.user_id === user.id) {
          return NextResponse.json({ error: "You can't use your own coupon code." }, { status: 400 });
        }
        offerId = getPartnerOfferId(method); // per-method; may be null if not configured
      } else {
        promo = await resolvePromoCode(admin, code);
        if (!promo) {
          return NextResponse.json({ error: 'That code is invalid, expired, or inactive.' }, { status: 400 });
        }
        offerId = promoOfferId(promo, method);
        if (!offerId) {
          return NextResponse.json(
            { error: `This code isn't available for ${method === 'upi' ? 'UPI' : 'card'} payments. Try the other payment method.` },
            { status: 400 }
          );
        }
      }
    }

    // A discount applies only when a Razorpay offer will actually be pinned.
    const discountApplies = !!offerId;

    // Look up any existing subscription row for this user.
    const { data: existingSub } = await admin
      .from('subscriptions')
      .select('id, status, plan, razorpay_subscription_id, trial_ends_at')
      .eq('user_id', user.id)
      .maybeSingle();

    // Is the user currently in an active free trial? (real Razorpay sub,
    // authenticated/active, trial end still in the future)
    const isActiveTrial =
      existingSub &&
      !!existingSub.razorpay_subscription_id &&
      (existingSub.status === 'active' || existingSub.status === 'authenticated') &&
      existingSub.trial_ends_at &&
      new Date(existingSub.trial_ends_at) > new Date();

    /* ── Mid-trial conversion: keep remaining trial days ──────────────────── */
    // A code is NOT required. Converting mid-trial (with or without a discount)
    // preserves the remaining trial days; a code simply discounts the first charge.
    if (isActiveTrial) {
      // Pin the new subscription's first charge to the existing trial end so the
      // remaining trial days stay free (e.g. buy on day 7 → 7 trial + 30 paid).
      const startAt = Math.floor(new Date(existingSub.trial_ends_at).getTime() / 1000);

      // Cancel the OLD trial sub FIRST so it can't also charge at the same date.
      // (Both would otherwise fire at trial end → double charge.) If it's already
      // cancelled, continue; on any other failure, abort before creating a new one.
      try {
        await cancelSubscription(existingSub.razorpay_subscription_id, false);
      } catch (e) {
        const msg = (e?.message || '').toLowerCase();
        if (!msg.includes('cancel') && !msg.includes('already')) {
          console.error('Abort mid-trial convert — old sub cancel failed:', e?.message || e);
          return NextResponse.json({ error: 'Could not update your trial right now. Please try again.' }, { status: 500 });
        }
        console.warn('Old trial sub cancel returned (continuing):', e?.message || e);
      }

      const sub = await createSubscription({
        billingCycle,
        email: user.email,
        userId: user.id,
        offerId,
        trial: false,
        startAt,
      });

      // Point the DB row at the new sub, PRESERVING trial_ends_at so access never
      // drops and the "Trial · Nd" badge keeps counting down until the paid charge.
      const { error: convErr } = await admin
        .from('subscriptions')
        .update({
          plan: 'elite',
          status: 'created',
          razorpay_subscription_id: sub.id,
          billing_cycle: billingCycle,
          trial_ends_at: existingSub.trial_ends_at,
        })
        .eq('id', existingSub.id);
      if (convErr) console.error('Mid-trial convert DB update error:', convErr.message);

      await bindCodeEffects(admin, { affiliate, promo, userId: user.id, subscriptionDbId: existingSub.id });

      return NextResponse.json({
        shortUrl: sub.short_url,
        subscriptionId: sub.id,
        keyId: process.env.RAZORPAY_KEY_ID || '',
      });
    }

    /* ── Normal checkout (no active trial) ────────────────────────────────── */

    // Skip the trial only when a discount offer will actually apply.
    const useTrial = !discountApplies;

    // Only block when there is a REAL paid subscription — an active/authenticated
    // row that has a Razorpay subscription id. A default "free/active" row (with
    // no razorpay_subscription_id) must NOT block upgrading; it gets upgraded in
    // place below.
    const hasActivePaidSub =
      existingSub &&
      !!existingSub.razorpay_subscription_id &&
      (existingSub.status === 'active' || existingSub.status === 'authenticated');

    if (hasActivePaidSub) {
      return NextResponse.json({ error: 'You already have an active subscription.' }, { status: 400 });
    }

    const sub = await createSubscription({
      billingCycle,
      email: user.email,
      userId: user.id,
      offerId,
      trial: useTrial,
    });

    const trialEndsAt = useTrial
      ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const subRow = {
      user_id: user.id,
      plan: 'elite',
      status: 'created',
      razorpay_subscription_id: sub.id,
      billing_cycle: billingCycle,
      trial_ends_at: trialEndsAt,
    };

    let subscriptionDbId = existingSub?.id || null;

    if (existingSub) {
      const { error: updateErr } = await admin
        .from('subscriptions')
        .update(subRow)
        .eq('id', existingSub.id);
      if (updateErr) console.error('Subscription update error:', updateErr.message);
    } else {
      const { data: inserted, error: insertErr } = await admin
        .from('subscriptions')
        .insert(subRow)
        .select('id')
        .maybeSingle();
      if (insertErr) console.error('Subscription insert error:', insertErr.message);
      subscriptionDbId = inserted?.id || null;
    }

    await bindCodeEffects(admin, { affiliate, promo, userId: user.id, subscriptionDbId });

    return NextResponse.json({
      shortUrl: sub.short_url,
      subscriptionId: sub.id,
      keyId: process.env.RAZORPAY_KEY_ID || '',
    });
  } catch (err) {
    console.error('Create subscription error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to create subscription.' },
      { status: 500 }
    );
  }
}
