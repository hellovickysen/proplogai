/**
 * Plan system for PropLogAI.
 *
 * Two plans: Basic ($0) and Elite ($9.99/mo or $7.99/mo yearly).
 * Launch pricing: $4.99/mo for first 100 users (locked for life).
 * Beta flag (is_beta) grants Elite access with warning banners.
 * Admin (ADMIN_EMAIL) has unrestricted access — no limits, no warnings.
 *
 * Usage in Server Components:
 * const access = await getUserAccess(supabase, user);
 * if (!access.canUse('ai_analysis')) { ... show upgrade CTA ... }
 * if (access.showWarning('ai_analysis')) { ... show beta warning ... }
 *
 * Usage in Server Actions:
 * const access = await getUserAccess(supabase, user);
 * const remaining = await access.remaining('ai_analysis', supabase);
 * if (remaining <= 0) return { error: 'Limit reached...' };
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
    priceYearly: 7.99, // per month billed annually ($95.88/yr)
    badge: 'Elite',
    badgeColor: 'text-violet-300 border-violet-400/30 bg-violet-500/10',
  },
};

/* ─── Feature limits per plan ──────────────────────────────── */

export const FEATURES = {
  ai_analysis: {
    label: 'AI trade analysis',
    basic: 3, // per month
    elite: 100, // soft cap per month (generous, controls API cost)
    unit: 'per month',
  },
  coach_report: {
    label: 'Propol AI review',
    basic: 1, // 1 monthly review
    elite: 4, // weekly reviews (4/month)
    unit: 'per month',
  },
  trophy_uploads: {
    label: 'Trophy uploads',
    basic: 5, // total
    elite: Infinity,
    unit: 'total',
  },
  screenshots_per_trade: {
    label: 'Screenshots per trade',
    basic: 1,
    elite: 10,
    unit: 'per trade',
  },
  custom_setups: {
    label: 'Custom setups',
    basic: 3,
    elite: Infinity,
    unit: 'total',
  },
  reference_images_per_setup: {
    label: 'Reference images per setup',
    basic: 1,
    elite: 10,
    unit: 'per setup',
  },
  multi_account: {
    label: 'Multi-account',
    basic: false,
    elite: true,
  },
  accounts_limit: {
    label: 'Account limit',
    basic: 1,
    elite: 10,
    unit: 'total',
  },
  csv_export: {
    label: 'CSV export',
    basic: false,
    elite: true,
  },
  shareable_cards: {
    label: 'Shareable P&L cards',
    basic: true,
    elite: true,
  },
  email_coach: {
    label: 'Email coach reports',
    basic: false,
    elite: true,
  },
  calendar_insights: {
    label: 'Calendar insights',
    basic: false,
    elite: true,
  },
};

/* ─── Elite feature list for upgrade UI ────────────────────── */

export const ELITE_FEATURES = [
  { icon: '📂', label: 'Multi-account (up to 10 prop firms)' },
  { icon: '🤖', label: '100 AI trade analyses/month' },
  { icon: '📊', label: 'Weekly Propol AI reviews' },
  { icon: '📈', label: 'Calendar insights & analytics' },
  { icon: '📤', label: 'CSV export' },
  { icon: '📧', label: 'Email coach reports' },
  { icon: '📸', label: 'Up to 10 screenshots per trade' },
  { icon: '🏆', label: 'Unlimited trophy uploads' },
  { icon: '📋', label: 'Unlimited custom setups' },
];

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
    .select('plan, status, razorpay_subscription_id, trial_ends_at, renews_at')
    .eq('user_id', user.id)
    .maybeSingle();

  // Determine effective plan
  const rawPlan = sub?.plan || 'basic';
  const plan = (rawPlan === 'free' ? 'basic' : rawPlan === 'pro' ? 'elite' : rawPlan) || 'basic';
  const isBeta = prefs?.is_beta === true;

  // Check if subscription is actually active
  const isActiveSub = sub && (sub.status === 'active' || sub.status === 'authenticated');
  const isTrialing = sub?.trial_ends_at && new Date(sub.trial_ends_at) > new Date();
  const effectivePlan = isAdmin || isBeta || (plan === 'elite' && (isActiveSub || isTrialing))
    ? 'elite' : (plan === 'elite' && !isActiveSub && !isTrialing ? 'basic' : plan);

  return buildAccess(effectivePlan === 'elite' ? 'elite' : plan, isBeta, isAdmin, {
    subscriptionStatus: sub?.status || null,
    isTrialing: !!isTrialing,
    trialEndsAt: sub?.trial_ends_at || null,
    renewsAt: sub?.renews_at || null,
    razorpaySubscriptionId: sub?.razorpay_subscription_id || null,
  });
}

/**
 * Lightweight access check without DB queries.
 * Use when you already have prefs and subscription data.
 */
export function buildAccess(plan, isBeta, isAdmin, subInfo = {}) {
  // Effective plan: beta or admin gets elite access
  const effectivePlan = isAdmin || isBeta || plan === 'elite' ? 'elite' : 'basic';

  return {
    plan, // actual DB plan (basic or elite)
    effectivePlan, // what they can actually access
    isBeta,
    isAdmin,
    ...subInfo,

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
     * True when: user is on beta, feature is Elite-only, and user is not admin.
     */
    showWarning(feature) {
      if (isAdmin) return false;
      if (!isBeta) return false;
      const f = FEATURES[feature];
      if (!f) return false;
      // Show warning for features that Basic can't use or has limits on
      return typeof f.basic === 'boolean' ? !f.basic : f.basic < f.elite;
    },

    /**
     * Get the feature limit for this user.
     * Returns Infinity for unlimited features.
     */
    limit(feature) {
      const f = FEATURES[feature];
      if (!f) return Infinity;
      if (isAdmin) return Infinity;
      return typeof f[effectivePlan] === 'boolean'
        ? (f[effectivePlan] ? Infinity : 0)
        : f[effectivePlan];
    },

    /**
     * Get remaining usage for a rate-limited feature.
     * Requires supabase client and userId for DB queries.
     * Returns { used, limit, remaining }.
     */
    async remaining(feature, supabase, userId) {
      const f = FEATURES[feature];
      if (!f) return { used: 0, limit: Infinity, remaining: Infinity };
      const lim = isAdmin ? Infinity : (typeof f[effectivePlan] === 'boolean'
        ? (f[effectivePlan] ? Infinity : 0) : f[effectivePlan]);
      if (lim === Infinity) return { used: 0, limit: Infinity, remaining: Infinity };

      let used = 0;
      if ((feature === 'ai_analysis' || feature === 'coach_report') && f.unit === 'per month') {
        const now = new Date();
        const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
        const type = feature === 'ai_analysis' ? 'trade_analysis' : 'coach_report';
        const { count } = await supabase
          .from('ai_insights')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('type', type)
          .gte('created_at', monthStart);
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

    /**
     * Serialize for passing from Server Components to Client Components.
     * Converts Infinity to -1 (Infinity can't be serialized as JSON).
     */
    toJSON() {
      return {
        plan,
        effectivePlan,
        isBeta,
        isAdmin,
        ...subInfo,
      };
    },
  };
}
