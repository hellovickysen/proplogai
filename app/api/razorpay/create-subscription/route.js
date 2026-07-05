import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSubscription } from '@/lib/razorpay';

/**
 * POST /api/razorpay/create-subscription
 *
 * Creates a Razorpay subscription and returns the hosted checkout URL.
 * Body: { billingCycle: 'monthly' | 'yearly' }
 */
export async function POST(request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
    }

    const { billingCycle = 'monthly' } = await request.json();
    if (!['monthly', 'yearly'].includes(billingCycle)) {
      return NextResponse.json({ error: 'Invalid billing cycle.' }, { status: 400 });
    }

    // Check if user already has an active subscription
    const { data: existingSub } = await supabase
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

    if (existingSub) {
      await supabase
        .from('subscriptions')
        .update(subRow)
        .eq('id', existingSub.id)
        .eq('user_id', user.id);
    } else {
      await supabase.from('subscriptions').insert(subRow);
    }

    return NextResponse.json({
      shortUrl: sub.short_url,
      subscriptionId: sub.id,
    });
  } catch (err) {
    console.error('Create subscription error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to create subscription.' },
      { status: 500 }
    );
  }
}
