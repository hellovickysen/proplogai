/**
 * Plan system for PropLogAI.
 *
 * Two plans: Basic ($0) and Elite ($9.99/mo).
 * Beta flag (is_beta) grants Elite access with warning banners.
 * Admin (ADMIN_EMAIL) has unrestricted access — no limits, no warnings.
 *
 * Usage in Server Components:
 *   const access = await getUserAccess(supabase, user);
 *   if (!access.canUse('ai_analysis')) { ... show upgrade CTA ... }
 *   if (access.showWarning('ai_analysis')) { ... show beta warning ... }
 *
 * Usage in Server Actions:
 *   const access = await getUserAccess(supabase, user);
 *   const remaining = await access.remaining('ai_analysis', supabase);
 *   if (remaining <= 0) return { error: 'Limit reached...' };
 */

import { ADMIN_EMAIL } from '@/lib/supabase/admin';

/* ─── Plan definitions ─────────────────────────────────────── */

export const PLANS = {
  basic: {
    name: 'Basic',
    price: '$0',
    priceMonthly: 0,
    badge: 'Basic',
    badgeColor: 'text-white/60 border-white/15 bg-white/5',
  },
  elite: {
    name: 'Elite',
    price: '$9.99/mo',
    priceMonthly: 9.99,
    badge: 'Elite',
    badgeColor: 'text-violet-300 border-violet-400/30 bg-violet-500/10',
  },
};

/* ─── Feature limits per plan ──────────────────────────────── */

export const FEATURES = {
  ai_analysis: {
    label: 'AI trade analysis',
    basic: 5,       // per month
    elite: 100,     // soft cap per month (generous, controls API cost)
    unit: 'per month',
  },
  coach_report: {
    label: 'Propol AI review',
    basic: 1,       // 1 monthly review
    elite: 4,       // weekly reviews (4/month)
    unit: 'per month',
  },
  trophy_uploads: {
    label: 'Trophy uploads',
    basic: 5,       // total
    elite: Infinity,
    unit: 'total',
  },
  screenshots_per_trade: {
    label: 'Screenshots per trade',
    basic: 1,
    elite: 10,      // MAX_SCREENSHOTS from trades/actions.js
    unit: 'per trade',
  },
  custom_setups: {
    label: 'Custom setups',
    basic: 3,
    elite: Infinity,
    unit: 'total',
  },
  csv_export: {
    label: 'CSV export',
    basic: false,
    elite: true,
  },
  shareable_cards: {
    label: 'Shareable P&L cards',
    basic: false,
    elite: true,
  },
  email_coach: {
    label: 'Email coach reports',
    basic: false,
    elite: true,
  },
  advanced_discipline: {
    label: 'Advanced discipline stats',
    basic: false,
    elite: true,
  },
};

/* ─── Access helper ────────────────────────────────────────── */

/**
 * Get the current user's plan access level.
 *
 * @param {object} supabase - Supabase client
 * @param {object} user - Auth user object (must have .id and .email)
 * @returns {object} Access object with canUse(), showWarning(), limit(), remaining()
 */
export async function getUserAccess(supabase, user) {
  if (!user) {
    return buildAccess('basic', false, false);
  }

  const isAdmin = user.email === ADMIN_EMAIL;

  // Fetch plan and beta status
  const { data: prefs } = await supabase
    .from('user_preferences')
    .select('is_beta')
    .eq('user_id', user.id)
    .maybeSingle();

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan, status')
    .eq('user_id', user.id)
    .maybeSingle();

  // Determine effective plan
  const rawPlan = sub?.plan || 'basic';
  const plan = (rawPlan === 'free' ? 'basic' : rawPlan === 'pro' ? 'elite' : rawPlan) || 'basic';
  const isBeta = prefs?.is_beta === true;

  return buildAccess(plan, isBeta, isAdmin);
}

/**
 * Lightweight access check without DB queries.
 * Use when you already have prefs and subscription data.
 */
export function buildAccess(plan, isBeta, isAdmin) {
  // Effective plan: beta or admin gets elite access
  const effectivePlan = isAdmin || isBeta || plan === 'elite' ? 'elite' : 'basic';

  return {
    plan,            // actual DB plan (basic or elite)
    effectivePlan,   // what they can actually access
    isBeta,
    isAdmin,

    /**
     * Can the user access this feature?
     * Admin/elite/beta: always true. Basic: depends on feature.
     */
    canUse(feature) {
      if (isAdmin) return true;
      const f = FEATURES[feature];
      if (!f) return true; // unknown feature = unrestricted
      if (effectivePlan === 'elite') return true;
      // Basic: boolean features check true/false, numeric check > 0
      return typeof f.basic === 'boolean' ? f.basic : f.basic > 0;
    },

    /**
     * Should we show a beta warning for this feature?
     * Only true if: user is beta, feature is elite-only, and user isn't on a paid elite plan.
     */
    showWarning(feature) {
      if (isAdmin) return false;
      if (!isBeta) return false;
      if (plan === 'elite') return false; // paid elite — no warning needed
      const f = FEATURES[feature];
      if (!f) return false;
      // Show warning if the feature's basic value is limited/false
      return typeof f.basic === 'boolean' ? !f.basic : f.basic < f.elite;
    },

    /**
     * Get the limit for a feature.
     * Returns Infinity for unlimited, false for blocked boolean features.
     */
    limit(feature) {
      const f = FEATURES[feature];
      if (!f) return Infinity;
      if (isAdmin) return Infinity;
      return f[effectivePlan] ?? f.basic;
    },

    /**
     * Check remaining usage for a rate-limited feature.
     * Requires a supabase client for DB queries.
     * Returns { used, limit, remaining } for numeric limits.
     */
    async remaining(feature, supabase, userId) {
      const f = FEATURES[feature];
      if (!f) return { used: 0, limit: Infinity, remaining: Infinity };

      const lim = this.limit(feature);
      if (lim === Infinity || lim === true) return { used: 0, limit: Infinity, remaining: Infinity };
      if (lim === false) return { used: 0, limit: 0, remaining: 0 };

      let used = 0;

      if (feature === 'ai_analysis' && f.unit === 'per month') {
        const monthStart = new Date();
        monthStart.setUTCDate(1);
        monthStart.setUTCHours(0, 0, 0, 0);
        const { count } = await supabase
          .from('ai_insights')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('type', 'trade_analysis')
          .gte('created_at', monthStart.toISOString());
        used = count || 0;
      } else if (feature === 'coach_report' && f.unit === 'per month') {
        const monthStart = new Date();
        monthStart.setUTCDate(1);
        monthStart.setUTCHours(0, 0, 0, 0);
        const { count } = await supabase
          .from('ai_insights')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('type', 'coach_report')
          .gte('created_at', monthStart.toISOString());
        used = count || 0;
      } else if (feature === 'trophy_uploads' && f.unit === 'total') {
        const { count } = await supabase
          .from('trophies')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId);
        used = count || 0;
      } else if (feature === 'custom_setups' && f.unit === 'total') {
        const { count } = await supabase
          .from('setups')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('is_default', false);
        used = count || 0;
      }

      return { used, limit: lim, remaining: Math.max(0, lim - used) };
    },

    /** Serialize for passing to client components */
    toJSON() {
      return { plan, effectivePlan, isBeta, isAdmin };
    },
  };
}
