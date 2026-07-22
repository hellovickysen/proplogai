/* ── Analyzer — orchestrates parse → stats → simulate → report ── */

import type {
  Trade, Statistics, SimulationResult, Improvement,
  AnalysisReport, ParseResult, SimulatorInput,
} from './types';
import { parseTrades }        from './parser';
import { computeStatistics }  from './statistics';
import { PROFILES }           from './profiles';
import { simulate }           from './simulator';

const ACCOUNT_SIZE = 100_000; // percentage-based; value is arbitrary
const SIMULATIONS  = 10_000;

/* ── Main entry point ──────────────────────────────────────── */

export async function analyzeStatement(
  fileContent: string | Uint8Array,
  fileName: string,
): Promise<AnalysisReport> {
  // 1. Parse
  const parsed: ParseResult = await parseTrades(fileContent, fileName);

  // 2. Statistics
  const stats = computeStatistics(parsed.trades);

  // 3. Simulate every profile
  const suitability: SimulationResult[] = PROFILES.map((profile) => {
    const input: SimulatorInput = {
      winRate:               stats.winRate / 100,
      avgWin:                stats.avgReward,
      avgLoss:               stats.avgRisk,
      tradesPerDay:          stats.avgTradesPerDay,
      dailyReturns:          stats.dailyReturns,
      profitTarget:          profile.profitTarget,
      dailyDrawdown:         profile.dailyDrawdown,
      overallDrawdown:       profile.overallDrawdown,
      minimumProfitableDays: profile.minimumProfitableDays,
      challengeDays:         profile.challengeDays,
      accountSize:           ACCOUNT_SIZE,
      simulations:           SIMULATIONS,
    };
    const out = simulate(input);
    return {
      profileId:        profile.id,
      profileName:      profile.name,
      passRate:          out.passRate,
      avgDaysToPass:     out.avgDaysToPass,
      medianDaysToPass:  out.medianDaysToPass,
      failReasons: {
        dailyDrawdown:    pct(out.failReasons.dailyDrawdown, SIMULATIONS),
        overallDrawdown:  pct(out.failReasons.overallDrawdown, SIMULATIONS),
        targetNotReached: pct(out.failReasons.targetNotReached, SIMULATIONS),
        minDaysNotMet:    pct(out.failReasons.minDaysNotMet, SIMULATIONS),
      },
    };
  });

  // 4. Best challenge
  const best = [...suitability].sort((a, b) => b.passRate - a.passRate)[0];
  const bestProfile = PROFILES.find((p) => p.id === best.profileId)!;

  // 5. Confidence
  const confidence = getConfidence(stats);

  // 6. Strengths & weaknesses
  const strengths  = getStrengths(stats);
  const weaknesses = getWeaknesses(stats);

  // 7. Top 3 improvements
  const improvements = getImprovements(stats);

  // 8. Failure reasons (aggregate from best challenge)
  const failureReasons = [
    { reason: 'Daily Drawdown',    percentage: best.failReasons.dailyDrawdown },
    { reason: 'Overall Drawdown',  percentage: best.failReasons.overallDrawdown },
    { reason: 'Target Not Reached', percentage: best.failReasons.targetNotReached },
    { reason: 'Min Days Not Met',  percentage: best.failReasons.minDaysNotMet },
  ].filter((f) => f.percentage > 0)
   .sort((a, b) => b.percentage - a.percentage);

  // 9. Expected days at different "account sizes" (presentation only — same sim)
  const baseDays = best.medianDaysToPass ?? best.avgDaysToPass ?? 20;
  const expectedDays = [
    { label: '50k Challenge',  days: baseDays },
    { label: '100k Challenge', days: baseDays + 1 },
    { label: '150k Challenge', days: baseDays + 2 },
  ];

  return {
    overallProbability: best.passRate,
    confidence,
    bestChallenge: {
      profileId: best.profileId,
      name:      bestProfile.name,
      reason:    buildReason(stats, bestProfile),
      rating:    ratingFromPassRate(best.passRate),
    },
    expectedDays,
    challengeSuitability: suitability,
    strengths,
    weaknesses,
    improvements,
    failureReasons,
    statistics: stats,
  };
}

/* ── Helpers ───────────────────────────────────────────────── */

function pct(count: number, total: number): number {
  return total > 0 ? Math.round((count / total) * 1000) / 10 : 0;
}

function getConfidence(s: Statistics): 'High' | 'Medium' | 'Low' {
  let score = 0;
  if (s.totalTrades >= 200) score += 3; else if (s.totalTrades >= 50) score += 2; else score += 1;
  if (s.tradingDays >= 30) score += 2; else if (s.tradingDays >= 15) score += 1;
  if (s.riskConsistency >= 60) score += 1;
  return score >= 5 ? 'High' : score >= 3 ? 'Medium' : 'Low';
}

function ratingFromPassRate(rate: number): number {
  if (rate >= 80) return 5;
  if (rate >= 65) return 4;
  if (rate >= 50) return 3;
  if (rate >= 35) return 2;
  return 1;
}

function buildReason(s: Statistics, profile: { name: string }): string {
  const parts: string[] = [];
  if (s.maxDrawdown < 3) parts.push('excellent drawdown control');
  else if (s.maxDrawdown < 5) parts.push('solid drawdown management');
  if (s.riskConsistency >= 70) parts.push('consistent risk management');
  if (s.positionSizeConsistency >= 70) parts.push('consistent position sizing');
  if (s.winRate >= 55) parts.push('strong win rate');
  if (s.avgRR >= 1.5) parts.push('favorable risk-reward ratio');
  if (parts.length === 0) parts.push('balanced trading profile');
  return parts.slice(0, 3).join(', ').replace(/^./, (c) => c.toUpperCase()) + '.';
}

/* ── Strengths / Weaknesses ────────────────────────────────── */

function getStrengths(s: Statistics): string[] {
  const out: string[] = [];
  if (s.winRate >= 55)                out.push('Above-average win rate');
  if (s.avgRR >= 1.5)                out.push('Strong risk-to-reward ratio');
  if (s.maxDrawdown < 3)             out.push('Excellent drawdown control');
  if (s.riskConsistency >= 70)       out.push('Consistent risk per trade');
  if (s.positionSizeConsistency >= 70) out.push('Consistent position sizing');
  if (s.profitFactor >= 1.5)         out.push('Healthy profit factor');
  if (s.largestLosingStreak <= 3)    out.push('Short losing streaks');
  if (s.expectancy > 0)             out.push('Positive expectancy');
  if (s.avgTradesPerDay <= 4)        out.push('Disciplined trade frequency');
  return out.slice(0, 4);
}

function getWeaknesses(s: Statistics): string[] {
  const out: string[] = [];
  if (s.winRate < 45)                 out.push('Low win rate');
  if (s.avgRR < 1)                   out.push('Poor risk-to-reward ratio');
  if (s.maxDrawdown > 6)             out.push('Large drawdowns');
  if (s.riskConsistency < 40)        out.push('Inconsistent risk sizing');
  if (s.positionSizeConsistency < 40) out.push('Inconsistent position sizes');
  if (s.largestLosingStreak >= 6)    out.push('Long losing streaks');
  if (s.avgTradesPerDay > 8)         out.push('Overtrading');
  if (s.expectancy <= 0)            out.push('Negative expectancy');
  if (s.profitFactor < 1)           out.push('Profit factor below 1');
  return out.slice(0, 4);
}

/* ── Improvements ──────────────────────────────────────────── */

function getImprovements(s: Statistics): Improvement[] {
  const candidates: Improvement[] = [];

  if (s.avgRR < 1.5) {
    candidates.push({
      title: 'Improve Risk-to-Reward',
      current: `${s.avgRR.toFixed(1)}`,
      recommended: '1.5',
      estimatedImpact: '+8–12%',
    });
  }
  if (s.avgTradesPerDay > 5) {
    candidates.push({
      title: 'Reduce daily trade count',
      current: `${s.avgTradesPerDay.toFixed(1)} trades/day`,
      recommended: '3–4 trades/day',
      estimatedImpact: '+5–10%',
    });
  }
  if (s.riskConsistency < 60) {
    candidates.push({
      title: 'Standardize risk per trade',
      current: `${s.riskConsistency}/100 consistency`,
      recommended: '70+/100',
      estimatedImpact: '+6–9%',
    });
  }
  if (s.maxDrawdown > 4) {
    candidates.push({
      title: 'Tighten drawdown management',
      current: `${s.maxDrawdown.toFixed(1)}% max DD`,
      recommended: 'Under 3%',
      estimatedImpact: '+7–14%',
    });
  }
  if (s.largestLosingStreak >= 5) {
    candidates.push({
      title: 'Stop trading after 2 consecutive losses',
      current: `${s.largestLosingStreak} loss streak`,
      recommended: 'Max 2–3',
      estimatedImpact: '+5–8%',
    });
  }
  if (s.winRate < 50 && s.avgRR >= 1) {
    candidates.push({
      title: 'Improve trade selection for higher win rate',
      current: `${s.winRate.toFixed(1)}%`,
      recommended: '50%+',
      estimatedImpact: '+6–10%',
    });
  }
  if (s.positionSizeConsistency < 50) {
    candidates.push({
      title: 'Use fixed position sizing',
      current: `${s.positionSizeConsistency}/100 consistency`,
      recommended: '70+/100',
      estimatedImpact: '+4–7%',
    });
  }

  return candidates.slice(0, 3);
}
