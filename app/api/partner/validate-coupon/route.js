import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import {
  resolveAffiliateByCoupon,
  resolvePromoCode,
  getPartnerOfferId,
  PARTNER_DISCOUNT_PCT,
} from '@/lib/affiliate';

/**
 * POST /api/partner/validate-coupon
 * Body: { code: string }
 *
 * Validates a code (partner coupon OR admin promo) for the signed-in user
 * WITHOUT creating anything. Powers the live price preview on checkout.
 *
 * Returns { valid, discountPct, kind } where kind is 'partner' | 'promo'.
 * discountPct is 0 (even for a valid code) when the underlying Razorpay offer
 * isn't configured — so the displayed price always matches the real charge.
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

    // Partner coupon first
    const affiliate = await resolveAffiliateByCoupon(admin, clean);
    if (affiliate) {
      if (affiliate.user_id === user.id) {
        return NextResponse.json({ valid: false, error: "You can't use your own code." });
      }
      const discountPct = getPartnerOfferId() ? Math.round(PARTNER_DISCOUNT_PCT * 100) : 0;
      return NextResponse.json({ valid: true, discountPct, kind: 'partner' });
    }

    // Admin promo code
    const promo = await resolvePromoCode(admin, clean);
    if (promo) {
      const discountPct = promo.razorpay_offer_id ? Math.round(Number(promo.discount_pct) || 0) : 0;
      return NextResponse.json({ valid: true, discountPct, kind: 'promo' });
    }

    return NextResponse.json({ valid: false, error: 'That code is invalid, expired, or inactive.' });
  } catch (err) {
    console.error('validate-coupon error:', err);
    return NextResponse.json({ valid: false, error: 'Could not validate the code.' }, { status: 500 });
  }
}
