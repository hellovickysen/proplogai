import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createSubscription, cancelSubscription } from '@/lib/razorpay';
import { resolveDiscount, promoOfferId } from '@/lib/affiliate';

/**
 * POST /api/razorpay/create-subscription
 *
 * Creates a Razorpay subscription and returns the hosted checkout details.
 * Body: { billingCycle: 'monthly' | 'yearly', couponCode?: string, method?: 'card'|'upi' }
 *
 * Model (see lib/affiliate.resolveDiscount):
 * - Discounts REQUIRE a code. No code = full price.
 * - Partner code: 30% during trial, 15% (default) after trial.
 * - Promo/occasion code: its own % whenever active.
 * - Trials are DB-only (no card). Converting mid-trial pins the first charge to
 *   the current trial_ends_at so remaining trial days are preserved (no charge
 *   today). Post-trial conversions charge now.
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

    const { billingCycle = 'monthly', couponCode, method: rawMethod } = await request.json();
    if (!['monthly', 'yearly'].includes(billingCycle)) {
      return NextResponse.json({ error: 'Invalid billing cycle.' }, { status: 400 });
    }
    const method = rawMethod === 'upi' ? 'upi' : 'card';

    const admin = getServiceClient();

    // Existing subscription row (trigger creates a default one per user).
    const { data: existingSub } = await admin
      .from('subscriptions')
      .select('id, status, plan, razorpay_subscription_id, trial_ends_at')
      .eq('user_id', user.id)
      .maybeSingle();

    const isTrialing = !!(existingSub?.trial_ends_at && new Date(existingSub.trial_ends_at) > new Date());

    // Resolve the code → the discount that actually applies for this context.
    const code = typeof couponCode === 'string' ? couponCode.trim() : '';
    const disc = await resolveDiscount(admin, code, { isTrialing });
    if (!disc.valid) {
      return NextResponse.json({ error: disc.error || 'That code is invalid.' }, { status: 400 });
    }
    if (disc.kind === 'partner' && disc.affiliate?.user_id === user.id) {
      return NextResponse.json({ error: "You can't use your own coupon code." }, { status: 400 });
    }

    // Offer id for the chosen method (partner tiers are UPI-only).
    let offerId = null;
    if (disc.kind === 'partner') offerId = method === 'upi' ? disc.offerIdUpi : null;
    else if (disc.kind === 'promo') offerId = promoOfferId(disc.promo, method);

    /* ── Mid-trial conversion: preserve remaining trial days ─────────────── */
    if (isTrialing) {
      const startAt = Math.floor(new Date(existingSub.trial_ends_at).getTime() / 1000);

      // If a legacy mandate sub is attached, cancel it first so it can't also
      // charge at the same date. DB-only trials have no Razorpay sub → skip.
      if (existingSub.razorpay_subscription_id) {
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
      }

      const sub = await createSubscription({
        billingCycle,
        email: user.email,
        userId: user.id,
        offerId,
        trial: false,
        startAt,
      });

      const { error: convErr } = await admin
        .from('subscriptions')
        .update({
          plan: 'elite',
          status: 'created',
          razorpay_subscription_id: sub.id,
          billing_cycle: billingCycle,
          trial_ends_at: existingSub.trial_ends_at, // keep remaining trial days
        })
        .eq('id', existingSub.id);
      if (convErr) console.error('Mid-trial convert DB update error:', convErr.message);

      await bindCodeEffects(admin, { affiliate: disc.affiliate, promo: disc.promo, userId: user.id, subscriptionDbId: existingSub.id });

      return NextResponse.json({
        shortUrl: sub.short_url,
        subscriptionId: sub.id,
        keyId: process.env.RAZORPAY_KEY_ID || '',
      });
    }

    /* ── Post-trial / no active trial: charge now ───────────────────────── */
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
      trial: false, // trials are DB-only now; checkout never starts a mandate trial
    });

    const subRow = {
      user_id: user.id,
      plan: 'elite',
      status: 'created',
      razorpay_subscription_id: sub.id,
      billing_cycle: billingCycle,
      trial_ends_at: null,
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
