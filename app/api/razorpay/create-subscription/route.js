import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createSubscription } from '@/lib/razorpay';
import { resolveAffiliateByCoupon, getPartnerOfferId } from '@/lib/affiliate';

/**
 * POST /api/razorpay/create-subscription
 *
 * Creates a Razorpay subscription and returns the hosted checkout URL.
 * Body: { billingCycle: 'monthly' | 'yearly', couponCode?: string }
 *
 * If a valid partner coupon is supplied, a Razorpay discount offer is attached
 * (5% off the first charge) and the buyer is bound to that partner for
 * commission. Attribution is coupon-only — no links or cookies.
 */

function getServiceClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function POST(request) {
  try {
    // Authenticate user via cookie-based client
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
    }

    const { billingCycle = 'monthly', couponCode } = await request.json();
    if (!['monthly', 'yearly'].includes(billingCycle)) {
      return NextResponse.json({ error: 'Invalid billing cycle.' }, { status: 400 });
    }

    // Use service-role client for DB operations (bypasses RLS)
    const admin = getServiceClient();

    // Validate a partner coupon (if provided) BEFORE creating the subscription,
    // so an invalid code doesn't leave a dangling Razorpay subscription.
    let affiliate = null;
    let offerId = null;
    const code = typeof couponCode === 'string' ? couponCode.trim() : '';
    if (code) {
      affiliate = await resolveAffiliateByCoupon(admin, code);
      if (!affiliate) {
        return NextResponse.json({ error: 'That coupon code is invalid or inactive.' }, { status: 400 });
      }
      if (affiliate.user_id === user.id) {
        return NextResponse.json({ error: "You can't use your own coupon code." }, { status: 400 });
      }
      offerId = getPartnerOfferId(); // may be null if the offer isn't configured yet
    }

    // Check if user already has an active subscription
    const { data: existingSub } = await admin
      .from('subscriptions')
      .select('id, status, razorpay_subscription_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingSub && (existingSub.status === 'active' || existingSub.status === 'authenticated')) {
      return NextResponse.json({ error: 'You already have an active subscription.' }, { status: 400 });
    }

    // Create Razorpay subscription (with the discount offer when a coupon applied)
    const sub = await createSubscription({
      billingCycle,
      email: user.email,
      userId: user.id,
      offerId,
    });

    // Store/update subscription record in DB
    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

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

    // Bind the buyer to the partner (first-touch). Wrapped so it can never break checkout.
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
