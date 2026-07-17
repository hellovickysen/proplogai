import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { resolveAffiliateByCoupon, getPartnerOfferId, PARTNER_DISCOUNT_PCT } from '@/lib/affiliate';

/**
 * POST /api/partner/validate-coupon
 * Body: { code: string }
 *
 * Validates a partner coupon for the signed-in user WITHOUT creating anything.
 * Powers the live price preview on the checkout page.
 *
 * Returns { valid: boolean, discountPct: number, error?: string }.
 * discountPct is 0 (even for a valid code) when the Razorpay discount offer
 * isn't configured yet — so the displayed price always matches the real charge.
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

    const affiliate = await resolveAffiliateByCoupon(admin, clean);
    if (!affiliate) {
      return NextResponse.json({ valid: false, error: 'That code is invalid or inactive.' });
    }
    if (affiliate.user_id === user.id) {
      return NextResponse.json({ valid: false, error: "You can't use your own code." });
    }

    // Only advertise a discount if the Razorpay offer is actually configured.
    const discountPct = getPartnerOfferId() ? Math.round(PARTNER_DISCOUNT_PCT * 100) : 0;
    return NextResponse.json({ valid: true, discountPct });
  } catch (err) {
    console.error('validate-coupon error:', err);
    return NextResponse.json({ valid: false, error: 'Could not validate the code.' }, { status: 500 });
  }
}
