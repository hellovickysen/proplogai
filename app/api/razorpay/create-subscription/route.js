import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createSubscription } from '@/lib/razorpay';
import { resolveAffiliateByCoupon, resolvePromoCode, getPartnerOfferId } from '@/lib/affiliate';

/**
 * POST /api/razorpay/create-subscription
 *
 * Creates a Razorpay subscription and returns the hosted checkout URL.
 * Body: { billingCycle: 'monthly' | 'yearly', couponCode?: string }
 *
 * A code can be either a PARTNER coupon (attaches the 5% partner offer + binds
 * commission) or an ADMIN promo code (attaches that promo's Razorpay offer, no
 * commission). Either way, when a discount offer applies the 14-day trial is
 * skipped so the discounted amount is charged now. All resolution is wrapped so
 * a bad/empty code never breaks a normal checkout.
 */

function getServiceClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
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
        offerId = getPartnerOfferId(); // may be null if the partner offer isn't configured yet
      } else {
        promo = await resolvePromoCode(admin, code);
        if (!promo) {
          return NextResponse.json({ error: 'That code is invalid, expired, or inactive.' }, { status: 400 });
        }
        offerId = promo.razorpay_offer_id || null;
      }
    }

    // Skip the trial only when a discount offer will actually apply.
    const discountApplies = !!offerId;
    const useTrial = !discountApplies;

    // Check if user already has an active subscription
    const { data: existingSub } = await admin
      .from('subscriptions')
      .select('id, status, razorpay_subscription_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingSub && (existingSub.status === 'active' || existingSub.status === 'authenticated')) {
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

    // Partner coupon → bind the buyer to the partner (first-touch). Never breaks checkout.
    if (affiliate) {
      try {
        const { data: existing } = await admin
          .from('affiliate_referrals')
          .select('id')
          .eq('referred_user_id', user.id)
          .maybeSingle();
        if (!existing) {
          await admin.from('affiliate_referrals').insert({
            affiliate_id: affiliate.id,
            referred_user_id: user.id,
            source: 'coupon',
            subscription_id: subscriptionDbId,
            status: 'active',
          });
        }
      } catch (e) {
        console.error('Affiliate bind error (non-fatal):', e?.message || e);
      }
    }

    // Admin promo → count the redemption (best-effort). No commission.
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
