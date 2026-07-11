import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { verifyPaymentSignature } from '@/lib/razorpay';

/**
 * GET /api/razorpay/callback
 *
 * Razorpay redirects here after hosted checkout completes.
 * Query params: razorpay_payment_id, razorpay_subscription_id, razorpay_signature
 *
 * Uses service-role client for DB writes. The webhook is the source of truth,
 * but this provides instant feedback and a safety-net upsert.
 */

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

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

  // Signature valid — update or create subscription record
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const admin = getAdminClient();

      // Try to update existing row first
      const { data: updated } = await admin
        .from('subscriptions')
        .update({
          status: 'authenticated',
          razorpay_payment_id: paymentId,
        })
        .eq('razorpay_subscription_id', subscriptionId)
        .eq('user_id', user.id)
        .select('id')
        .maybeSingle();

      // If no row existed, create one as a safety net
      if (!updated) {
        const { error: insertErr } = await admin
          .from('subscriptions')
          .insert({
            user_id: user.id,
            plan: 'elite',
            status: 'authenticated',
            razorpay_subscription_id: subscriptionId,
            razorpay_payment_id: paymentId,
            billing_cycle: 'monthly',
            trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          });
        if (insertErr) console.error('Callback insert error:', insertErr.message);
      }
    }
  } catch (err) {
    // Non-critical — webhook will handle the authoritative update
    console.error('Callback DB update error:', err);
  }

  return NextResponse.redirect(`${baseUrl}/dashboard/settings?tab=billing&status=success`);
}
