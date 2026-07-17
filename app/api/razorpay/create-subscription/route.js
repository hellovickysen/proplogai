import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createSubscription } from '@/lib/razorpay';
import { AFF_COOKIE, resolveAffiliateBySlug } from '@/lib/affiliate';

/**
 * POST /api/razorpay/create-subscription
 *
 * Creates a Razorpay subscription and returns the hosted checkout URL.
 * Body: { billingCycle: 'monthly' | 'yearly' }
 *
 * Uses service-role client for DB writes since RLS may block user inserts
 * on the subscriptions table.
 */

function getAdminClient() {
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

    const { billingCycle = 'monthly' } = await request.json();
    if (!['monthly', 'yearly'].includes(billingCycle)) {
      return NextResponse.json({ error: 'Invalid billing cycle.' }, { status: 400 });
    }

    // Use admin client for DB operations (bypasses RLS)
    const admin = getAdminClient();

    // Check if user already has an active subscription
    const { data: existingSub } = await admin
      .from('subscriptions')
      .select('id, status, razorpay_subscription_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingSub && (existingSub.status === 'active' || existingSub.status === 'authenticated')) {
      return NextResponse.json({ error: 'You already have an active subscription.' }, { status: 400 });
    }

    // Create Razorpay subscription
    const sub = await createSubscription({
      billingCycle,
      email: user.email,
      userId: user.id,
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

    // Bind affiliate attribution from the plog_aff cookie (first-touch, never breaks checkout).
    await bindAffiliateReferral(admin, request, user, subscriptionDbId);

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

/**
 * Link the checkout user to the referring affiliate captured at click time.
 * First-touch: if the user is already bound, we do nothing. Self-referrals are
 * blocked. Any failure here is swallowed so it can never block a payment.
 */
async function bindAffiliateReferral(admin, request, user, subscriptionDbId) {
  try {
    const slug = request.cookies.get(AFF_COOKIE)?.value;
    if (!slug) return;

    const affiliate = await resolveAffiliateBySlug(admin, slug);
    if (!affiliate) return;
    if (affiliate.user_id === user.id) return; // no self-referrals

    // First-touch lock: skip if this user is already attributed.
    const { data: existing } = await admin
      .from('affiliate_referrals')
      .select('id')
      .eq('referred_user_id', user.id)
      .maybeSingle();
    if (existing) return;

    await admin.from('affiliate_referrals').insert({
      affiliate_id: affiliate.id,
      referred_user_id: user.id,
      source: 'link',
      subscription_id: subscriptionDbId,
      status: 'active',
    });
  } catch (e) {
    console.error('Affiliate bind error (non-fatal):', e?.message || e);
  }
}
