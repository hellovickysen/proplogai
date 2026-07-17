/**
 * Affiliate program shared logic (Phase 1 MVP).
 *
 * Server-only helpers (Node runtime). Do NOT import this in middleware
 * (edge runtime) — middleware inlines its own tiny cookie constant.
 *
 * Design notes:
 * - Commission base is the KNOWN plan price in USD (not the raw Razorpay
 *   payment amount, whose currency/units can vary). Admin pays out manually.
 * - All writes are expected to run through server actions / webhook using the
 *   service-role admin client with explicit ownership scoping.
 */

export const AFF_COOKIE = 'plog_aff';
export const AFF_COOKIE_MAX_AGE = 60 * 60 * 24 * 90; // 90 days
export const DEFAULT_COMMISSION_RATE = 0.40;
export const MAX_COMMISSION_RATE = 0.60;

// Plan prices in USD. Monthly = $9.99/mo; Yearly = $95.88 billed annually.
export const PLAN_PRICE_USD = {
  monthly: 9.99,
  yearly: 95.88,
};

/* ─── Validation ───────────────────────────────────────────── */

/** Referral usernames + coupon codes: 3–20 chars, letters/numbers/underscore. */
export function isValidSlug(value) {
  return typeof value === 'string' && /^[A-Za-z0-9_]{3,20}$/.test(value);
}

/** Coupon codes: 3–20 chars, letters/numbers only, uppercased. */
export function normalizeCoupon(value) {
  return String(value || '').trim().toUpperCase();
}
export function isValidCoupon(value) {
  return /^[A-Z0-9]{3,20}$/.test(normalizeCoupon(value));
}

/** Slugify an arbitrary name/email local-part into a candidate username. */
export function slugifyUsername(input) {
  const base = String(input || '')
    .split('@')[0]
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 20);
  return base.length >= 3 ? base : (base + 'user').slice(0, 20);
}

/* ─── Commission math ──────────────────────────────────────── */

/**
 * Compute the commission amount (USD, 2dp) for a single charge.
 * @param {number} rate - affiliate commission rate (0..0.60)
 * @param {string} billingCycle - 'monthly' | 'yearly'
 */
export function commissionForCharge(rate, billingCycle) {
  const price = PLAN_PRICE_USD[billingCycle] ?? PLAN_PRICE_USD.monthly;
  const r = Math.max(0, Math.min(MAX_COMMISSION_RATE, Number(rate) || 0));
  return Math.round(price * r * 100) / 100;
}

/* ─── Slug resolution (username OR coupon) ─────────────────────
 * Resolves a public slug to an APPROVED affiliate id.
 * Requires an admin (service-role) supabase client. Returns null if not found.
 */
export async function resolveAffiliateBySlug(adminSb, slug) {
  if (!adminSb || !slug) return null;
  const clean = String(slug).trim();
  if (!clean) return null;

  // Try username first
  const { data: byName } = await adminSb
    .from('affiliates')
    .select('id, user_id, status, commission_rate, referral_username')
    .ilike('referral_username', clean)
    .eq('status', 'approved')
    .maybeSingle();
  if (byName) return byName;

  // Then coupon code
  const { data: coupon } = await adminSb
    .from('affiliate_coupons')
    .select('affiliate_id')
    .ilike('code', clean)
    .maybeSingle();
  if (!coupon) return null;

  const { data: byCoupon } = await adminSb
    .from('affiliates')
    .select('id, user_id, status, commission_rate, referral_username')
    .eq('id', coupon.affiliate_id)
    .eq('status', 'approved')
    .maybeSingle();
  return byCoupon || null;
}

/**
 * Build a stats summary for an affiliate dashboard.
 * Uses the admin client but every query is scoped to affiliateId.
 */
export async function getAffiliateStats(adminSb, affiliateId) {
  const zero = {
    clicks: 0, referred: 0, activeSubs: 0, paidUsers: 0,
    pendingCommission: 0, paidCommission: 0, lifetimeEarnings: 0,
  };
  if (!adminSb || !affiliateId) return zero;

  const [{ count: clicks }, { count: referred }, { data: commissions }, { data: referrals }] =
    await Promise.all([
      adminSb.from('affiliate_referral_clicks').select('id', { count: 'exact', head: true }).eq('affiliate_id', affiliateId),
      adminSb.from('affiliate_referrals').select('id', { count: 'exact', head: true }).eq('affiliate_id', affiliateId),
      adminSb.from('affiliate_commissions').select('amount, status, referred_user_id').eq('affiliate_id', affiliateId),
      adminSb.from('affiliate_referrals').select('referred_user_id, status').eq('affiliate_id', affiliateId),
    ]);

  let pendingCommission = 0, paidCommission = 0, lifetimeEarnings = 0;
  const paidUserSet = new Set();
  for (const c of commissions || []) {
    const amt = Number(c.amount) || 0;
    if (c.status === 'pending') pendingCommission += amt;
    if (c.status === 'approved') pendingCommission += amt;
    if (c.status === 'paid') paidCommission += amt;
    if (c.status !== 'reversed') {
      lifetimeEarnings += amt;
      if (c.referred_user_id) paidUserSet.add(c.referred_user_id);
    }
  }

  const activeSubs = (referrals || []).filter((r) => r.status === 'active').length;

  return {
    clicks: clicks || 0,
    referred: referred || 0,
    activeSubs,
    paidUsers: paidUserSet.size,
    pendingCommission: Math.round(pendingCommission * 100) / 100,
    paidCommission: Math.round(paidCommission * 100) / 100,
    lifetimeEarnings: Math.round(lifetimeEarnings * 100) / 100,
  };
}
