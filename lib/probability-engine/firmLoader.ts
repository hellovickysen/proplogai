/* ── Firm Loader — fetch prop firms from Supabase ──────────── */

import type { ChallengeProfile } from './types';

interface DBFirm {
  id: string;
  name: string;
  slug: string;
  profit_target: number;
  daily_drawdown: number;
  overall_drawdown: number;
  min_trading_days: number;
  challenge_days: number;
  max_risk_per_trade: number | null;
  consistency_requirement: number | null;
  affiliate_link: string | null;
  logo_url: string | null;
  display_order: number;
  active: boolean;
}

export interface FirmWithMeta extends ChallengeProfile {
  affiliateLink: string | null;
  logoUrl: string | null;
}

/**
 * Fetch active prop firms from Supabase, ordered by display_order.
 * Falls back to hardcoded profiles if DB is unavailable.
 */
export async function loadFirms(supabaseUrl?: string, supabaseKey?: string): Promise<FirmWithMeta[]> {
  const url = supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = supabaseKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return fallbackFirms();
  }

  try {
    const res = await fetch(
      `${url}/rest/v1/prop_firms?active=eq.true&order=display_order.asc`,
      {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
        next: { revalidate: 300 }, // cache for 5 minutes
      },
    );

    if (!res.ok) {
      console.warn('[firmLoader] Supabase returned', res.status, '— using fallback');
      return fallbackFirms();
    }

    const firms: DBFirm[] = await res.json();
    if (!firms.length) return fallbackFirms();

    return firms.map(dbToProfile);
  } catch (err) {
    console.warn('[firmLoader] Failed to fetch firms:', err);
    return fallbackFirms();
  }
}

function dbToProfile(f: DBFirm): FirmWithMeta {
  return {
    id: f.slug,
    name: f.name,
    description: '',
    profitTarget: Number(f.profit_target),
    dailyDrawdown: Number(f.daily_drawdown),
    overallDrawdown: Number(f.overall_drawdown),
    minimumProfitableDays: Number(f.min_trading_days),
    challengeDays: Number(f.challenge_days),
    maxRiskPerTrade: f.max_risk_per_trade != null ? Number(f.max_risk_per_trade) : undefined,
    consistencyRequirement: f.consistency_requirement != null ? Number(f.consistency_requirement) : undefined,
    affiliateLink: f.affiliate_link,
    logoUrl: f.logo_url,
  };
}

function fallbackFirms(): FirmWithMeta[] {
  return [
    { id: 'one-step', name: 'One-Step Challenge', description: '', profitTarget: 8, dailyDrawdown: 2, overallDrawdown: 4, minimumProfitableDays: 5, challengeDays: 30, affiliateLink: null, logoUrl: null },
    { id: 'two-step', name: 'Two-Step Challenge', description: '', profitTarget: 8, dailyDrawdown: 2, overallDrawdown: 4, minimumProfitableDays: 5, challengeDays: 30, affiliateLink: null, logoUrl: null },
    { id: 'instant', name: 'Instant Funding', description: '', profitTarget: 0, dailyDrawdown: 2, overallDrawdown: 4, minimumProfitableDays: 5, challengeDays: 30, maxRiskPerTrade: 1, consistencyRequirement: 20, affiliateLink: null, logoUrl: null },
  ];
}
