import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { resolveDiscount } from '@/lib/affiliate';

/**
 * POST /api/partner/validate-coupon
 * Body: { code: string }
 *
 * Validates an explicit code for the signed-in user WITHOUT creating anything,
 * and returns the discount that WILL actually apply given the trial context
 * (during the trial the +trial-auto-bonus is already stacked in), so the
 * checkout preview matches the charge.
 *
 * Returns { valid, discountPct, kind, methods, label, isTrialing }.
 * discountPct is 0 when the matching combined Razorpay offer isn't configured.
 */
export async function POST(request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ valid: false, error: 'Please sign in.' }, { status: 401 });
    }

    const { code } = await request.json().catch(() => ({}));
    const clean = typeof code === 'string' ? code.trim() : '';
    if (!clean) {
      return NextResponse.json({ valid: false, error: 'Enter a code.' });
    }

    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Trial context adds the trial auto-bonus on top of the code's base rate.
    const { data: sub } = await admin
      .from('subscriptions')
      .select('trial_ends_at')
      .eq('user_id', user.id)
      .maybeSingle();
    const isTrialing = !!(sub?.trial_ends_at && new Date(sub.trial_ends_at) > new Date());

    const disc = await resolveDiscount(admin, clean, { isTrialing });
    if (!disc.valid) {
      return NextResponse.json({ valid: false, error: disc.error || 'That code is invalid.' });
    }
    if (disc.kind === 'partner' && disc.affiliate?.user_id === user.id) {
      return NextResponse.json({ valid: false, error: "You can't use your own code." });
    }

    return NextResponse.json({
      valid: true,
      discountPct: disc.pct,
      kind: disc.kind,
      methods: disc.methods,
      label: disc.label,
      isTrialing,
    });
  } catch (err) {
    console.error('validate-coupon error:', err);
    return NextResponse.json({ valid: false, error: 'Could not validate the code.' }, { status: 500 });
  }
}
