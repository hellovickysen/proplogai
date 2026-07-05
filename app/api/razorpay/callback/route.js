import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyPaymentSignature } from '@/lib/razorpay';

/**
 * GET /api/razorpay/callback
 *
 * Razorpay redirects here after hosted checkout completes.
 * Query params: razorpay_payment_id, razorpay_subscription_id, razorpay_signature
 *
 * This is a UX convenience redirect — the webhook is the source of truth.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const paymentId = searchParams.get('razorpay_payment_id');
  const subscriptionId = searchParams.get('razorpay_subscription_id');
  const signature = searchParams.get('razorpay_signature');

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://proplogai.com';

  // If no params, user probably cancelled
  if (!paymentId || !subscriptionId || !signature) {
    return NextResponse.redirect(`${baseUrl}/dashboard/settings?tab=billing&status=cancelled`);
  }

  // Verify the callback signature
  const isValid = verifyPaymentSignature(paymentId, subscriptionId, signature);
  if (!isValid) {
    console.error('Invalid Razorpay callback signature');
    return NextResponse.redirect(`${baseUrl}/dashboard/settings?tab=billing&status=failed`);
  }

  // Signature valid — update subscription status optimistically
  // (webhook will also update, but this gives instant UI feedback)
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      await supabase
        .from('subscriptions')
        .update({
          status: 'authenticated',
          razorpay_payment_id: paymentId,
        })
        .eq('razorpay_subscription_id', subscriptionId)
        .eq('user_id', user.id);
    }
  } catch (err) {
    // Non-critical — webhook will handle the authoritative update
    console.error('Callback DB update error:', err);
  }

  return NextResponse.redirect(`${baseUrl}/dashboard/settings?tab=billing&status=success`);
}
