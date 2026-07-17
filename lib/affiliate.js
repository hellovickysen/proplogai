/**
 * Affiliate / partner program shared logic.
 *
 * Server-only helpers (Node runtime). Do NOT import this in middleware
 * (edge runtime) — middleware inlines its own tiny constants.
 *
 * Attribution model: coupon-code-only. A buyer enters an approved partner's
 * coupon at checkout, which (a) applies a Razorpay discount offer and
 * (b) binds the buyer to the partner. Commission is computed from the actual
 * amount Razorpay charged (net of any discount).
 *
 * Admin promo codes (promo_codes table) are a separate, store-wide discount
 * system with NO partner commission.
 */

export const AFF_COOKIE = 'plog_aff'; // legacy (link tracking retired) — kept for any stragglers
export const AFF_COOKIE_MAX_AGE = 60 * 60 * 24 * 90;
export const DEFAULT_COMMISSION_RATE = 0.40;
export const MAX_COMMISSION_RATE = 0.60;

// Buyer discount applied at checkout via a Razorpay Offer (first charge only).
export const PARTNER_DISCOUNT_PCT = 0.05;

// Plan prices in USD. Monthly = $9.99/mo; Yearly = $95.88 billed annually.
// Used only as a fallback when a webhook payment amount is unavailable.
export const PLAN_PRICE_USD = {
  monthly: 9.99,
  yearly: 95.88,
};

/** Razorpay Offer id for the 5% partner discount (created in the Razorpay Dashboard). */
export function getPartnerOfferId() {
  return process.env.RAZORPAY_OFFER_ID_5 || null;
}

/* ─── Validation ───────────────────────────────────────────── */

export function isValidSlug(value) {
  return typeof value === 'string' && /^[A-Za-z0-9_]{3,20}$/.test(value);
}

/** Coupon / promo codes: 3–20 chars, letters/numbers only, uppercased. */
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
 * Fallback commission amount (USD, 2dp) from the known plan price.
 * The webhook prefers the actual charged amount; this is only used when the
 * payment amount is missing.
 */
export function commissionForCharge(rate, billingCycle) {
  const price = PLAN_PRICE_USD[billingCycle] ?? PLAN_PRICE_USD.monthly;
  const r = Math.max(0, Math.min(MAX_COMMISSION_RATE, Number(rate) || 0));
  return Math.round(price * r * 100) / 100;
}

/* ─── Partner coupon resolution ────────────────────────────────
 * Resolve a coupon code to its APPROVED partner. Returns null if the code
 * is invalid, unknown, or the partner isn't approved.
 */
export async function resolveAffiliateByCoupon(adminSb, code) {
  if (!adminSb) return null;
  const clean = normalizeCoupon(code);
  if (!isValidCoupon(clean)) return null;

  const { data: coupon } = await adminSb
    .from('affiliate_coupons')
    .select('affiliate_id')
    .ilike('code', clean)
    .maybeSingle();
  if (!coupon) return null;

  const { data: aff } = await adminSb
    .from('affiliates')
    .select('id, user_id, status, commission_rate, referral_username')
    .eq('id', coupon.affiliate_id)
    .eq('status', 'approved')
    .maybeSingle();
  return aff || null;
}

/* ─── Admin promo code resolution ──────────────────────────────
 * Resolve an admin promo code, honoring active flag, date window, and the
 * max-redemptions cap. Returns the row or null.
 */
export async function resolvePromoCode(adminSb, code) {
  if (!adminSb) return null;
  const clean = normalizeCoupon(code);
  if (!isValidCoupon(clean)) return null;

  const { data } = await adminSb
    .from('promo_codes')
    .select('id, code, label, discount_pct, razorpay_offer_id, active, starts_at, expires_at, max_redemptions, redeemed_count')
    .ilike('code', clean)
    .maybeSingle();
  if (!data || !data.active) return null;

  const now = Date.now();
  if (data.starts_at && new Date(data.starts_at).getTime() > now) return null;
  if (data.expires_at && new Date(data.expires_at).getTime() < now) return null;
  if (data.max_redemptions != null && (data.redeemed_count || 0) >= data.max_redemptions) return null;

  return data;
}

/* Legacy resolver (username OR coupon) — retained for any remaining callers. */
export async function resolveAffiliateBySlug(adminSb, slug) {
  if (!adminSb || !slug) return null;
  const clean = String(slug).trim();
  if (!clean) return null;

  const { data: byName } = await adminSb
    .from('affiliates')
    .select('id, user_id, status, commission_rate, referral_username')
    .ilike('referral_username', clean)
    .eq('status', 'approved')
    .maybeSingle();
  if (byName) return byName;

  return resolveAffiliateByCoupon(adminSb, clean);
}

/**
 * Build a stats summary for a partner dashboard.
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
