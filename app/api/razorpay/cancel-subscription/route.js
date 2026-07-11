import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { cancelSubscription } from '@/lib/razorpay';
import { sendEmail, isEmailConfigured } from '@/lib/email';
import { buildCancellationEmail } from '@/lib/subscription-emails';

/**
 * POST /api/razorpay/cancel-subscription
 *
 * Cancels the current user's Razorpay subscription.
 * - Active subscriptions: cancel at end of billing cycle (user keeps access)
 * - Trial/authenticated subscriptions: cancel immediately (no billing cycle yet)
 */

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function POST() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
    }

    const admin = getAdminClient();

    // Get the user's active subscription
    const { data: sub } = await admin
      .from('subscriptions')
      .select('id, razorpay_subscription_id, status, renews_at, trial_ends_at')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!sub || !sub.razorpay_subscription_id) {
      return NextResponse.json({ error: 'No active subscription found.' }, { status: 400 });
    }

    if (sub.status === 'cancelled') {
      return NextResponse.json({ error: 'Subscription is already cancelled.' }, { status: 400 });
    }

    // Determine if subscription is in trial (no billing cycle started)
    const isTrialing = sub.status === 'authenticated' || sub.status === 'created';

    try {
      // Trial: cancel immediately (cancel_at_cycle_end=false)
      // Active: cancel at end of billing cycle (cancel_at_cycle_end=true)
      await cancelSubscription(sub.razorpay_subscription_id, !isTrialing);
    } catch (rzpErr) {
      // If "no billing cycle" error, retry with immediate cancel
      if (rzpErr.message && rzpErr.message.includes('no billing cycle')) {
        await cancelSubscription(sub.razorpay_subscription_id, false);
      } else {
        throw rzpErr;
      }
    }

    // Update local DB
    await admin
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        plan: isTrialing ? 'basic' : sub.plan, // Trial: downgrade immediately
      })
      .eq('id', sub.id)
      .eq('user_id', user.id);

    // Send cancellation email
    if (isEmailConfigured()) {
      try {
        const cancelEmail = buildCancellationEmail({
          accessUntil: isTrialing ? null : (sub.renews_at || null),
        });
        await sendEmail({ to: user.email, subject: cancelEmail.subject, html: cancelEmail.html });
      } catch (e) { console.error('Cancellation email error:', e); }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Cancel subscription error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to cancel subscription.' },
      { status: 500 }
    );
  }
}
