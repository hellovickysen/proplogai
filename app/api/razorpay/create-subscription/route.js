import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createSubscription, cancelSubscription } from '@/lib/razorpay';
import { resolveDiscount, getDiscountSettings } from '@/lib/affiliate';

/**
 * POST /api/razorpay/create-subscription
 *
 * Creates a Razorpay subscription and returns the hosted checkout details.
 * Body: { billingCycle: 'monthly' | 'yearly', couponCode?: string, method?: 'card'|'upi' }
 *
 * Model:
 * - Always charge NOW; the 30-day cycle counts from the subscribe day (no
 *   start_at deferral, no "days added"). This also keeps Razorpay offers valid
 *   (offers only apply to an immediate first charge).
 * - Discounts (additive stacking during trial):
 *     partner code → 30% (+10% trial bonus during trial),
 *     promo code   → its own % (+10% trial bonus during trial),
 *     no code, in trial → the 10% trial auto-bonus alone (if configured),
 *     no code, not in trial → full price.
 * - Each combined rate is one pre-made Razorpay UPI offer (see lib/affiliate).
 * - A trialing user may carry a stale Razorpay sub id from an earlier attempt;
 *   we cancel it before creating the charge-now sub so it can't charge later.
 */

function getServiceClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

/** Bind partner referral (first-touch) + count admin promo redemption. Never throws. */
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

    const { billingCycle = 'monthly', couponCode } = await request.json();
    if (!['monthly', 'yearly'].includes(billingCycle)) {
      return NextResponse.json({ error: 'Invalid billing cycle.' }, { status: 400 });
    }

    const admin = getServiceClient();

    // Existing subscription row (trigger creates a default one per user).
    const { data: existingSub } = await admin
      .from('subscriptions')
      .select('id, status, plan, razorpay_subscription_id, trial_ends_at')
      .eq('user_id', user.id)
      .maybeSingle();

    const isTrialing = !!(existingSub?.trial_ends_at && new Date(existingSub.trial_ends_at) > new Date());

    // Resolve an explicit code → the (possibly stacked) discount for this context.
    const code = typeof couponCode === 'string' ? couponCode.trim() : '';
    const disc = await resolveDiscount(admin, code, { isTrialing });
    if (!disc.valid) {
      return NextResponse.json({ error: disc.error || 'That code is invalid.' }, { status: 400 });
    }
    if (disc.kind === 'partner' && disc.affiliate?.user_id === user.id) {
      return NextResponse.json({ error: "You can't use your own coupon code." }, { status: 400 });
    }

    // Offer to pin (UPI). Explicit code → its resolved offer. No code + still in
    // trial → the trial auto-bonus offer (compensation for the unused trial).
    let offerId = disc.offerIdUpi || null;
    if (disc.kind === 'none' && isTrialing) {
      const s = await getDiscountSettings(admin);
      if (s.trialAutoOfferUpi) offerId = s.trialAutoOfferUpi;
    }

    if (isTrialing) {
      // The user is still in their free trial. Any Razorpay sub id on the row is
      // a leftover from an earlier attempt (paying converts off the trial and
      // clears it) — cancel it so it can't charge later, then charge now.
      if (existingSub?.razorpay_subscription_id) {
        try {
          await cancelSubscription(existingSub.razorpay_subscription_id, false);
        } catch (e) {
          const m = (e?.message || '').toLowerCase();
          if (!m.includes('cancel') && !m.includes('already')) {
            console.error('Abort — leftover trial sub cancel failed:', e?.message || e);
            return NextResponse.json({ error: 'Could not update your subscription right now. Please try again.' }, { status: 500 });
          }
          console.warn('Leftover trial sub cancel returned (continuing):', e?.message || e);
        }
      }
    } else {
      // Block only a real, already-paying subscription.
      const hasActivePaidSub =
        existingSub &&
        !!existingSub.razorpay_subscription_id &&
        (existingSub.status === 'active' || existingSub.status === 'authenticated');
      if (hasActivePaidSub) {
        return NextResponse.json({ error: 'You already have an active subscription.' }, { status: 400 });
      }
    }

    // Always charge now — subscription starts today, cycle counts from today.
    const sub = await createSubscription({
      billingCycle,
      email: user.email,
      userId: user.id,
      offerId,
      trial: false,
    });

    const subRow = {
      user_id: user.id,
      plan: 'elite',
      status: 'created',
      razorpay_subscription_id: sub.id,
      billing_cycle: billingCycle,
      trial_ends_at: null, // paying converts them off the trial
    };

    let subscriptionDbId = existingSub?.id || null;
    if (existingSub) {
      const { error: updateErr } = await admin.from('subscriptions').update(subRow).eq('id', existingSub.id);
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

    await bindCodeEffects(admin, { affiliate: disc.affiliate, promo: disc.promo, userId: user.id, subscriptionDbId });

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
