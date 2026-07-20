/**
 * Affiliate / partner program shared logic.
 *
 * Server-only helpers (Node runtime). Do NOT import this in middleware
 * (edge runtime) — middleware inlines its own tiny constants.
 *
 * Discount model (charge-now; additive stacking during the trial):
 * - Partner code → partner rate (default 30%, editable). During the trial the
 *   trial auto-bonus (default 10%, editable) stacks on top → e.g. 40%.
 * - Sitewide / occasion promo code → its own % (editable). During the trial the
 *   trial auto-bonus stacks on top too.
 * - No code, still in trial → the trial auto-bonus alone (e.g. 10%), if configured.
 * - No code, not in trial → full price.
 * Razorpay allows one offer per subscription, so each combined rate maps to a
 * single pre-made UPI offer id ("slot"). Rates + slots live in site_settings;
 * promo codes carry a base UPI offer + an in-trial UPI offer (base% + bonus%).
 */

export const AFF_COOKIE = 'plog_aff'; // legacy (link tracking retired) — kept for any stragglers
export const AFF_COOKIE_MAX_AGE = 60 * 60 * 24 * 90;
// Influencer (partner) commission: 20% lifetime recurring by default.
export const DEFAULT_COMMISSION_RATE = 0.20;
export const MAX_COMMISSION_RATE = 0.60;

// Fallback partner discount for display if site_settings is unavailable. The
// real charge is always enforced by the Razorpay offer. Source of truth is the
// site_settings row 'partner_pct'.
export const PARTNER_DISCOUNT_PCT = 0.30;

// Plan prices in USD. Monthly = $9.99/mo; Yearly = $95.88 billed annually.
// Used only as a fallback when a webhook payment amount is unavailable.
export const PLAN_PRICE_USD = {
  monthly: 9.99,
  yearly: 95.88,
};

/**
 * Razorpay Offer id for the partner discount, per payment method (legacy env).
 * Superseded by site_settings but kept as a fallback for backward compatibility.
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

const DISCOUNT_KEYS = [
  'partner_pct',
  'trial_auto_pct',
  'partner_offer_upi',
  'partner_trial_offer_upi',
  'trial_auto_offer_upi',
];

function clampInt(v, min, max, fallback) {
  const n = parseInt(v, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

/**
 * Read the global discount settings from site_settings.
 * partnerPct / trialAutoPct are the editable rates; the *OfferUpi values are the
 * pre-made Razorpay UPI offer ids for each scenario (charge-now):
 * - partnerOfferUpi         → partner code, not in trial (partnerPct)
 * - partnerTrialOfferUpi    → partner code, in trial (partnerPct + trialAutoPct)
 * - trialAutoOfferUpi       → no code, in trial (trialAutoPct)
 */
export async function getDiscountSettings(adminSb) {
  const fallback = {
    partnerPct: 30,
    trialAutoPct: 10,
    partnerOfferUpi: null,
    partnerTrialOfferUpi: null,
    trialAutoOfferUpi: null,
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
      partnerPct: clampInt(m.partner_pct, 1, 100, 30),
      trialAutoPct: clampInt(m.trial_auto_pct, 0, 100, 10),
      partnerOfferUpi: m.partner_offer_upi || null,
      partnerTrialOfferUpi: m.partner_trial_offer_upi || null,
      trialAutoOfferUpi: m.trial_auto_offer_upi || null,
    };
  } catch {
    return fallback;
  }
}

/**
 * Resolve an explicit checkout code into the discount that will actually apply,
 * given the buyer's trial context. During the trial, the trial auto-bonus is
 * added on top of the code's base rate (additive stacking), and the offer id is
 * the pre-made combined UPI offer. Centralized so the checkout preview
 * (validate-coupon) and the subscription creator always agree.
 *
 * pct is 0 (methods empty, offer null) when the matching combined offer isn't
 * configured yet — so we never show a discount we can't actually charge.
 *
 * The no-code trial auto-bonus is applied by the subscription creator directly
 * (see create-subscription), not here — this only handles explicit codes.
 */
export async function resolveDiscount(adminSb, rawCode, { isTrialing = false } = {}) {
  const code = normalizeCoupon(rawCode);
  if (!code) {
    return { valid: true, kind: 'none', pct: 0, offerIdUpi: null, methods: [], label: '' };
  }
  if (!isValidCoupon(code)) {
    return { valid: false, error: 'That code is invalid.' };
  }

  const s = await getDiscountSettings(adminSb);
  const bonus = isTrialing ? s.trialAutoPct : 0;

  // Partner coupon first
  const affiliate = await resolveAffiliateByCoupon(adminSb, code);
  if (affiliate) {
    const offer = isTrialing ? s.partnerTrialOfferUpi : s.partnerOfferUpi;
    const configured = !!offer;
    const pct = configured ? s.partnerPct + bonus : 0;
    const methods = configured ? ['upi'] : [];
    const label = configured
      ? (isTrialing
          ? `${pct}% off — partner code + ${s.trialAutoPct}% trial bonus`
          : `${pct}% off — partner code`)
      : 'Partner code applied — no discount is configured yet.';
    return { valid: true, kind: 'partner', affiliate, pct, offerIdUpi: configured ? offer : null, methods, label };
  }

  // Admin promo / occasion code
  const promo = await resolvePromoCode(adminSb, code);
  if (promo) {
    const base = Math.round(Number(promo.discount_pct) || 0);
    const offer = isTrialing ? (promo.razorpay_offer_id_upi_trial || null) : (promo.razorpay_offer_id_upi || null);
    const configured = !!offer;
    const pct = configured ? base + bonus : 0;
    const methods = configured ? ['upi'] : [];
    const label = configured
      ? (isTrialing
          ? `${pct}% off — ${promo.label || 'promo code'} + ${s.trialAutoPct}% trial bonus`
          : `${pct}% off — ${promo.label || 'promo code'}`)
      : 'Promo code applied — no discount is configured yet.';
    return { valid: true, kind: 'promo', promo, pct, offerIdUpi: configured ? offer : null, methods, label };
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
    .select('id, code, label, discount_pct, razorpay_offer_id, razorpay_offer_id_upi, razorpay_offer_id_upi_trial, active, starts_at, expires_at, max_redemptions, redeemed_count')
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
