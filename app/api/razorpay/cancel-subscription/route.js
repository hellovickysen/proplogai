import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cancelSubscription } from '@/lib/razorpay';
import { sendEmail, isEmailConfigured } from '@/lib/email';
import { buildCancellationEmail } from '@/lib/subscription-emails';

/**
 * POST /api/razorpay/cancel-subscription
 *
 * Cancels the current user's Razorpay subscription at the end of the billing cycle.
 */
export async function POST() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
    }

    // Get the user's active subscription
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('id, razorpay_subscription_id, status, renews_at')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!sub || !sub.razorpay_subscription_id) {
      return NextResponse.json({ error: 'No active subscription found.' }, { status: 400 });
    }

    if (sub.status === 'cancelled') {
      return NextResponse.json({ error: 'Subscription is already cancelled.' }, { status: 400 });
    }

    // Cancel at end of billing cycle (user keeps access until then)
    await cancelSubscription(sub.razorpay_subscription_id, true);

    // Update local DB
    await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', sub.id)
      .eq('user_id', user.id);

    // Send cancellation email
    if (isEmailConfigured()) {
      try {
        const cancelEmail = buildCancellationEmail({ accessUntil: sub.renews_at || null });
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
