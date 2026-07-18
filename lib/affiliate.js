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
 * Discount tiers (all require a code; no code = full price):
 * - Partner code, during trial → global partner rate (default 30%, admin-editable 30–50%)
 * - Partner code, after trial   → default rate (default 15%, admin-editable)
 * - Sitewide / occasion promo codes → their own configured %, whenever active
 * Rates + their Razorpay UPI offer ids live in site_settings (admin-editable).
 */

export const AFF_COOKIE = 'plog_aff'; // legacy (link tracking retired) — kept for any stragglers
export const AFF_COOKIE_MAX_AGE = 60 * 60 * 24 * 90;
// Influencer (partner) commission: 20% lifetime recurring by default.
export const DEFAULT_COMMISSION_RATE = 0.20;
export const MAX_COMMISSION_RATE = 0.60;

// Fallback partner discount if site_settings is unavailable (display only; the
// real charge is always enforced by the Razorpay offer). Source of truth is the
// site_settings row 'partner_trial_pct'.
export const PARTNER_DISCOUNT_PCT = 0.30;

// Plan prices in USD. Monthly = $9.99/mo; Yearly = $95.88 billed annually.
// Used only as a fallback when a webhook payment amount is unavailable.
export const PLAN_PRICE_USD = {
  monthly: 9.99,
  yearly: 95.88,
};

/**
 * Razorpay Offer id for the partner discount, per payment method (legacy env).
 * Superseded by site_settings ('partner_trial_offer_id_upi') but kept as a
 * fallback for backward compatibility.
 */
export function getPartnerOfferId(method = 'card') {
  if (method === 'upi') return process.env.RAZORPAY_OFFER_ID_5_UPI || null;
  return process.env.RAZORPAY_OFFER_ID_5 || null;
}

/** Which payment methods the partner discount is configured for (legacy env). */
export function partnerOfferMethods() {
  const methods = [];
  if (process.env.RAZORPAY_OFFER_ID_5) methods.push('card');
  if (process.env.RAZORPAY_OFFER_ID_5_UPI) methods.push('upi');
  return methods;
}

/** Which payment methods a promo code has an offer for. */
export function promoOfferMethods(promo) {
  const methods = [];
  if (promo?.razorpay_offer_id) methods.push('card');
  if (promo?.razorpay_offer_id_upi) methods.push('upi');
  return methods;
}

/** The promo code's Razorpay offer id for a given payment method. */
export function promoOfferId(promo, method = 'card') {
  if (method === 'upi') return promo?.razorpay_offer_id_upi || null;
  return promo?.razorpay_offer_id || null;
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

/* ─── Discount settings (admin-editable, site_settings) ──────── */

const DISCOUNT_KEYS = ['partner_trial_pct', 'partner_trial_offer_id_upi', 'default_pct', 'default_offer_id_upi'];

function clampInt(v, min, max, fallback) {
  const n = parseInt(v, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

/**
 * Read the global discount settings from site_settings. Requires the service
 * client (RLS restricts writes; reads are open but we use admin here for
 * consistency). Falls back to sane defaults + legacy env offer ids.
 */
export async function getDiscountSettings(adminSb) {
  const fallback = {
    partnerTrialPct: 30,
    partnerTrialOfferIdUpi: process.env.RAZORPAY_OFFER_ID_5_UPI || null,
    defaultPct: 15,
    defaultOfferIdUpi: process.env.RAZORPAY_OFFER_ID_15_UPI || null,
  };
  if (!adminSb) return fallback;
  try {
    const { data } = await adminSb
      .from('site_settings')
      .select('key, value')
      .in('key', DISCOUNT_KEYS);
    const m = {};
    for (const row of data || []) m[row.key] = row.value;
    return {
      partnerTrialPct: clampInt(m.partner_trial_pct, 30, 50, 30),
      partnerTrialOfferIdUpi: (m.partner_trial_offer_id_upi || fallback.partnerTrialOfferIdUpi) || null,
      defaultPct: clampInt(m.default_pct, 1, 100, 15),
      defaultOfferIdUpi: (m.default_offer_id_upi || fallback.defaultOfferIdUpi) || null,
    };
  } catch {
    return fallback;
  }
}

/**
 * Resolve a checkout code into the discount that will actually apply, given the
 * buyer's trial context. Centralizes the tier logic used by both the checkout
 * preview (validate-coupon) and the subscription creator, so the displayed rate
 * always equals the charged rate.
 *
 * Returns one of:
 *  - no/empty code:  { valid:true, kind:'none', pct:0, offerIdUpi:null, methods:[], label:'' }
 *  - invalid code:   { valid:false, error }
 *  - partner code:   { valid:true, kind:'partner', affiliate, pct, offerIdUpi, methods, label }
 *  - promo code:     { valid:true, kind:'promo', promo, pct, offerIdUpi, methods, label }
 *
 * `pct` is 0 (and methods empty) when no matching Razorpay offer is configured,
 * so we never show a discount we can't actually charge.
 */
export async function resolveDiscount(adminSb, rawCode, { isTrialing = false } = {}) {
  const code = normalizeCoupon(rawCode);
  if (!code) {
    return { valid: true, kind: 'none', pct: 0, offerIdUpi: null, methods: [], label: '' };
  }
  if (!isValidCoupon(code)) {
    return { valid: false, error: 'That code is invalid.' };
  }

  const settings = await getDiscountSettings(adminSb);

  // Partner coupon first
  const affiliate = await resolveAffiliateByCoupon(adminSb, code);
  if (affiliate) {
    const rawPct = isTrialing ? settings.partnerTrialPct : settings.defaultPct;
    const offerIdUpi = isTrialing ? settings.partnerTrialOfferIdUpi : settings.defaultOfferIdUpi;
    const configured = !!offerIdUpi;
    const pct = configured ? rawPct : 0;
    const methods = configured ? ['upi'] : [];
    const label = configured
      ? (isTrialing
          ? `${pct}% off — partner code (trial rate)`
          : `${pct}% off — standard rate (your trial has ended)`)
      : 'Partner code applied — no discount is configured yet.';
    return { valid: true, kind: 'partner', affiliate, pct, offerIdUpi: configured ? offerIdUpi : null, methods, label };
  }

  // Admin promo / occasion code (keeps its own % whenever active)
  const promo = await resolvePromoCode(adminSb, code);
  if (promo) {
    const methods = promoOfferMethods(promo);
    const pct = methods.length ? Math.round(Number(promo.discount_pct) || 0) : 0;
    const offerIdUpi = promo.razorpay_offer_id_upi || null;
    const label = methods.length
      ? `${pct}% off — ${promo.label || 'promo code'}`
      : 'Promo code applied — no discount is configured yet.';
    return { valid: true, kind: 'promo', promo, pct, offerIdUpi, methods, label };
  }

  return { valid: false, error: 'That code is invalid, expired, or inactive.' };
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
    .select('id, code, label, discount_pct, razorpay_offer_id, razorpay_offer_id_upi, active, starts_at, expires_at, max_redemptions, redeemed_count')
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
