/* ── Analyzer — orchestrates parse → stats → simulate → report ── */

import type {
  Trade, Statistics, SimulationResult, Improvement,
  AnalysisReport, ParseResult, SimulatorInput,
  ProbabilityBreakdown, TradingPersonality,
  IndustryComparison, BiggestMistake, TraderLevel, RiskMeter, WeekProjection,
} from './types';
import { parseTrades }        from './parser';
import { computeStatistics }  from './statistics';
import { PROFILES }           from './profiles';
import { simulate }           from './simulator';

const ACCOUNT_SIZE = 100_000;
const SIMULATIONS  = 10_000;

/* ── Main entry point ──────────────────────────────────────── */

export async function analyzeStatement(
  fileContent: string | Uint8Array,
  fileName: string,
): Promise<AnalysisReport> {
  const parsed: ParseResult = await parseTrades(fileContent, fileName);
  const stats = computeStatistics(parsed.trades);

  // Simulate every profile
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
      difficulty:        getDifficulty(out.passRate),
      failReasons: {
        dailyDrawdown:    pct(out.failReasons.dailyDrawdown, SIMULATIONS),
        overallDrawdown:  pct(out.failReasons.overallDrawdown, SIMULATIONS),
        targetNotReached: pct(out.failReasons.targetNotReached, SIMULATIONS),
        minDaysNotMet:    pct(out.failReasons.minDaysNotMet, SIMULATIONS),
      },
    };
  });

  const best = [...suitability].sort((a, b) => b.passRate - a.passRate)[0];
  const bestProfile = PROFILES.find((p) => p.id === best.profileId)!;

  const confidence = getConfidence(stats);
  const confidenceReasons = getConfidenceReasons(stats);
  const strengths  = getStrengths(stats);
  const weaknesses = getWeaknesses(stats);
  const improvements = getImprovements(stats);
  const probabilityBreakdown = getBreakdown(stats);
  const personality = getPersonality(stats);
  const biggestKiller = getBiggestMistake(stats);
  const traderLevel = getTraderLevel(best.passRate, stats);
  const propPassScore = traderLevel.score;
  const percentile = getPercentile(best.passRate, stats);
  const verdict = getVerdict(best.passRate, stats, bestProfile.name, biggestKiller);
  const riskMeter = getRiskMeter(stats);
  const readyToday = best.passRate >= 60;
  const weekProjection = getWeekProjection(best.passRate, best.medianDaysToPass ?? best.avgDaysToPass ?? 20);

  const failureReasons = [
    { reason: 'Daily Drawdown',    percentage: best.failReasons.dailyDrawdown },
    { reason: 'Overall Drawdown',  percentage: best.failReasons.overallDrawdown },
    { reason: 'Target Not Reached', percentage: best.failReasons.targetNotReached },
    { reason: 'Min Days Not Met',  percentage: best.failReasons.minDaysNotMet },
  ].filter((f) => f.percentage > 0)
   .sort((a, b) => b.percentage - a.percentage);

  // Best/Most Likely/Worst case days
  const baseDays = best.medianDaysToPass ?? best.avgDaysToPass ?? 20;
  const expectedDays = [
    { label: 'Best Case',   days: Math.max(5, Math.round(baseDays * 0.7)) },
    { label: 'Most Likely', days: baseDays },
    { label: 'Worst Case',  days: Math.round(baseDays * 1.6) },
  ];

  // Simulation summary
  const totalSims = SIMULATIONS;
  const passedSims = Math.round((best.passRate / 100) * totalSims);

  return {
    overallProbability: best.passRate,
    propPassScore,
    confidence,
    confidenceReasons,
    percentile,
    traderLevel,
    bestChallenge: {
      profileId: best.profileId,
      name:      bestProfile.name,
      reason:    buildReason(stats, bestProfile),
      rating:    ratingFromPassRate(best.passRate),
    },
    expectedDays,
    challengeSuitability: suitability,
    probabilityBreakdown,
    personality,
    riskMeter,
    biggestKiller,
    readyToday,
    weekProjection,
    simulationSummary: { total: totalSims, passed: passedSims, failed: totalSims - passedSims },
    strengths,
    weaknesses,
    improvements,
    failureReasons,
    verdict,
    statistics: stats,
  };
}

/* ── Helpers ───────────────────────────────────────────────── */

function pct(count: number, total: number): number {
  return total > 0 ? Math.round((count / total) * 1000) / 10 : 0;
}

function getDifficulty(passRate: number): string {
  if (passRate >= 75) return 'Easy';
  if (passRate >= 55) return 'Medium';
  if (passRate >= 35) return 'Hard';
  return 'Very Hard';
}

function getConfidence(s: Statistics): 'High' | 'Medium' | 'Low' {
  let score = 0;
  if (s.totalTrades >= 200) score += 3; else if (s.totalTrades >= 50) score += 2; else score += 1;
  if (s.tradingDays >= 30) score += 2; else if (s.tradingDays >= 15) score += 1;
  if (s.riskConsistency >= 60) score += 1;
  return score >= 5 ? 'High' : score >= 3 ? 'Medium' : 'Low';
}

function getConfidenceReasons(s: Statistics): string[] {
  const reasons: string[] = [];
  reasons.push(`${s.totalTrades} trades analyzed`);
  reasons.push(`${s.tradingDays} trading days`);
  if (s.totalTrades >= 100) reasons.push('Large sample size');
  else if (s.totalTrades >= 50) reasons.push('Adequate sample size');
  else reasons.push('Small sample — upload more trades for accuracy');
  return reasons;
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

/* ── Probability Breakdown ─────────────────────────────────── */

function getBreakdown(s: Statistics): ProbabilityBreakdown[] {
  const items: ProbabilityBreakdown[] = [];

  // Win Rate
  const wrImpact = s.winRate >= 55 ? Math.round((s.winRate - 45) * 2.5) : -Math.round((55 - s.winRate) * 2);
  items.push({ factor: 'Win Rate', current: `${s.winRate.toFixed(1)}%`, ideal: '50%+', impact: clamp(wrImpact, -30, 35), status: wrImpact >= 0 ? 'positive' : 'negative' });

  // Risk Management
  const rmScore = (s.riskConsistency + s.positionSizeConsistency) / 2;
  const rmImpact = rmScore >= 60 ? Math.round((rmScore - 40) * 0.5) : -Math.round((60 - rmScore) * 0.4);
  items.push({ factor: 'Risk Management', current: `${Math.round(rmScore)}/100`, ideal: '70+/100', impact: clamp(rmImpact, -25, 30), status: rmImpact >= 0 ? 'positive' : 'negative' });

  // Reward Ratio
  const rrImpact = s.avgRR >= 1.5 ? Math.round((s.avgRR - 1) * 20) : -Math.round((1.5 - s.avgRR) * 15);
  items.push({ factor: 'Reward Ratio', current: `${s.avgRR.toFixed(1)}:1`, ideal: '1.5:1+', impact: clamp(rrImpact, -20, 25), status: rrImpact >= 0 ? 'positive' : 'negative' });

  // Consistency
  const consImpact = s.riskConsistency >= 60 ? Math.round((s.riskConsistency - 40) * 0.3) : -Math.round((60 - s.riskConsistency) * 0.25);
  items.push({ factor: 'Consistency', current: `${s.riskConsistency}/100`, ideal: '60+/100', impact: clamp(consImpact, -15, 20), status: consImpact >= 0 ? 'positive' : 'negative' });

  // Drawdown Control
  const ddImpact = s.maxDrawdown < 3 ? 18 : s.maxDrawdown < 5 ? 10 : s.maxDrawdown < 8 ? -5 : -Math.round(s.maxDrawdown * 1.5);
  items.push({ factor: 'Drawdown Control', current: `${s.maxDrawdown.toFixed(1)}%`, ideal: 'Under 3%', impact: clamp(ddImpact, -25, 20), status: ddImpact >= 0 ? 'positive' : 'negative' });

  // Overtrading
  const otImpact = s.avgTradesPerDay > 8 ? -Math.round((s.avgTradesPerDay - 4) * 2.5) : s.avgTradesPerDay > 5 ? -Math.round((s.avgTradesPerDay - 4) * 1.5) : 5;
  items.push({ factor: 'Trade Frequency', current: `${s.avgTradesPerDay.toFixed(1)}/day`, ideal: '3-5/day', impact: clamp(otImpact, -20, 8), status: otImpact >= 0 ? 'positive' : 'negative' });

  items.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
  return items;
}

/* ── Risk Meter ────────────────────────────────────────────── */

function getRiskMeter(s: Statistics): { currentRisk: number; idealRisk: number; level: 'Low' | 'Medium' | 'High' } {
  // Estimate average risk % from avg loss relative to typical account
  const avgRiskPct = s.avgRisk > 0 ? Math.min(5, s.avgRisk / 1000) : 1;
  const level = avgRiskPct > 2 ? 'High' : avgRiskPct > 1 ? 'Medium' : 'Low';
  return { currentRisk: Math.round(avgRiskPct * 10) / 10, idealRisk: 0.5, level };
}

/* ── Week Projection ───────────────────────────────────────── */

function getWeekProjection(passRate: number, daysToPass: number): { week: number; label: string; outcome: string }[] {
  const weeks = [];
  const totalWeeks = Math.ceil(daysToPass / 5); // 5 trading days per week

  if (passRate >= 60) {
    weeks.push({ week: 1, label: 'Week 1', outcome: 'Build momentum' });
    if (totalWeeks >= 2) weeks.push({ week: 2, label: 'Week 2', outcome: `Reach ${Math.round(passRate * 0.4)}% of target` });
    if (totalWeeks >= 3) weeks.push({ week: 3, label: 'Week 3', outcome: totalWeeks <= 3 ? 'Pass' : `Reach ${Math.round(passRate * 0.7)}% of target` });
    if (totalWeeks >= 4) weeks.push({ week: 4, label: 'Week 4', outcome: 'Pass' });
  } else {
    weeks.push({ week: 1, label: 'Week 1', outcome: 'Survive drawdown limits' });
    weeks.push({ week: 2, label: 'Week 2', outcome: 'Build small gains' });
    weeks.push({ week: 3, label: 'Week 3', outcome: 'Assess progress' });
    if (totalWeeks >= 4) weeks.push({ week: 4, label: 'Week 4', outcome: passRate >= 40 ? 'Push for target' : 'Likely need extension' });
  }

  return weeks;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/* ── Trading Personality ───────────────────────────────────── */

function getPersonality(s: Statistics): TradingPersonality {
  // Data-based, professional labels
  if (s.avgTradesPerDay >= 8 && s.avgHoldingTime < 15) return { id: 'hft', emoji: '⚡', title: 'High-Volume Scalper', description: `${s.avgTradesPerDay.toFixed(0)} trades/day with ${Math.round(s.avgHoldingTime)}min avg hold time. High frequency, short duration.` };
  if (s.avgRR >= 2 && s.winRate < 45) return { id: 'sniper', emoji: '🎯', title: 'High RR Swing Trader', description: `${s.avgRR.toFixed(1)}:1 avg R:R with ${s.winRate.toFixed(0)}% win rate. Fewer wins but larger payoffs.` };
  if (s.riskConsistency >= 75 && s.positionSizeConsistency >= 75) return { id: 'systematic', emoji: '🧠', title: 'Systematic Rule-Based Trader', description: `Risk consistency ${s.riskConsistency}/100, position consistency ${s.positionSizeConsistency}/100. Highly disciplined execution.` };
  if (s.maxDrawdown < 3 && s.riskConsistency >= 60) return { id: 'conservative', emoji: '🛡', title: 'Conservative Risk Manager', description: `Max drawdown ${s.maxDrawdown.toFixed(1)}% with ${s.riskConsistency}/100 risk consistency. Capital preservation first.` };
  if (s.avgTradesPerDay >= 5 && s.avgHoldingTime < 60) return { id: 'scalper', emoji: '⚔', title: 'Active Scalper', description: `${s.avgTradesPerDay.toFixed(1)} trades/day with ${Math.round(s.avgHoldingTime)}min avg hold. Quick entries and exits.` };
  if (s.avgHoldingTime > 240) return { id: 'swing', emoji: '📈', title: 'Position Trader', description: `${Math.round(s.avgHoldingTime / 60)}h avg hold time. Lets trades run for larger moves.` };
  return { id: 'balanced', emoji: '⚖️', title: 'Balanced Day Trader', description: `${s.avgTradesPerDay.toFixed(1)} trades/day, ${s.avgRR.toFixed(1)}:1 R:R, ${s.winRate.toFixed(0)}% win rate. Well-rounded approach.` };
}

/* ── Badges ─────────────────────────────────────────────────── */

function getBadges(s: Statistics): Badge[] {
  return [
    { id: 'risk-master',        emoji: '🏆', title: 'Risk Master',        unlocked: s.riskConsistency >= 70 },
    { id: 'drawdown-defender',  emoji: '🛡', title: 'Drawdown Defender',  unlocked: s.maxDrawdown < 4 },
    { id: 'consistency-king',   emoji: '👑', title: 'Consistency King',   unlocked: s.positionSizeConsistency >= 70 && s.riskConsistency >= 70 },
    { id: 'rr-expert',          emoji: '🎯', title: 'R:R Expert',         unlocked: s.avgRR >= 1.5 },
    { id: 'patience-trader',    emoji: '🧘', title: 'Patience Trader',    unlocked: s.avgTradesPerDay <= 4 },
    { id: 'win-streak',         emoji: '🔥', title: 'Win Streak Hero',    unlocked: s.largestWinningStreak >= 7 },
    { id: 'profit-machine',     emoji: '💰', title: 'Profit Machine',     unlocked: s.profitFactor >= 2 },
    { id: 'iron-discipline',    emoji: '⚔️', title: 'Iron Discipline',    unlocked: s.riskConsistency >= 80 },
  ];
}

/* ── Biggest Mistake ───────────────────────────────────────── */

function getBiggestMistake(s: Statistics): BiggestMistake {
  const candidates: { score: number; mistake: BiggestMistake }[] = [];

  if (s.avgTradesPerDay > 6) {
    candidates.push({
      score: (s.avgTradesPerDay - 4) * 10,
      mistake: {
        title: 'Overtrading',
        description: `You average ${s.avgTradesPerDay.toFixed(1)} trades per day. Most successful prop traders average 3-5. Reducing trade frequency alone could significantly improve your pass rate.`,
        impact: `Reducing to 3-4 trades/day could increase your probability by approximately ${Math.round((s.avgTradesPerDay - 4) * 3)}%.`,
      },
    });
  }

  if (s.avgRR < 1) {
    candidates.push({
      score: (1.5 - s.avgRR) * 25,
      mistake: {
        title: 'Poor Risk-to-Reward',
        description: `Your average R:R is ${s.avgRR.toFixed(2)}:1. You're risking more than you stand to gain on each trade.`,
        impact: `Improving R:R to 1.5:1 could increase your probability by approximately 12%.`,
      },
    });
  }

  if (s.riskConsistency < 40) {
    candidates.push({
      score: (60 - s.riskConsistency),
      mistake: {
        title: 'Inconsistent Risk',
        description: `Your risk per trade varies wildly (consistency: ${s.riskConsistency}/100). This makes your results unpredictable and drawdowns harder to control.`,
        impact: `Standardizing your risk could increase your probability by approximately 9%.`,
      },
    });
  }

  if (s.maxDrawdown > 6) {
    candidates.push({
      score: s.maxDrawdown * 3,
      mistake: {
        title: 'Large Drawdowns',
        description: `Your max drawdown is ${s.maxDrawdown.toFixed(1)}%. Most prop firm challenges allow only 4-5%. One bad day could end your challenge.`,
        impact: `Tightening drawdown management could increase your probability by approximately ${Math.round(s.maxDrawdown * 2)}%.`,
      },
    });
  }

  if (s.largestLosingStreak >= 6) {
    candidates.push({
      score: s.largestLosingStreak * 4,
      mistake: {
        title: 'Long Losing Streaks',
        description: `Your longest losing streak was ${s.largestLosingStreak} trades. Consider stopping after 2-3 consecutive losses.`,
        impact: `A cool-down rule after 2 losses could increase your probability by approximately 7%.`,
      },
    });
  }

  if (s.winRate < 40) {
    candidates.push({
      score: (50 - s.winRate) * 2,
      mistake: {
        title: 'Low Win Rate',
        description: `Your win rate is ${s.winRate.toFixed(1)}%. Unless your R:R is very high, this makes it difficult to reach profit targets.`,
        impact: `Improving win rate to 50% could increase your probability by approximately 10%.`,
      },
    });
  }

  if (candidates.length === 0) {
    return { title: 'No Major Issues', description: 'Your trading profile is well-balanced. Focus on maintaining consistency.', impact: 'Keep doing what you are doing.' };
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates[0].mistake;
}

/* ── Trader Level ──────────────────────────────────────────── */

function getTraderLevel(passRate: number, s: Statistics): TraderLevel {
  // Composite score from pass rate + consistency + discipline
  const score = Math.round(
    passRate * 0.5 +
    s.riskConsistency * 0.2 +
    (s.profitFactor >= 1 ? Math.min(s.profitFactor * 10, 20) : 0) +
    (s.maxDrawdown < 5 ? 10 : 0)
  );

  const clamped = clamp(score, 0, 100);
  let level: string;
  if (clamped >= 85) level = 'Elite';
  else if (clamped >= 70) level = 'Professional';
  else if (clamped >= 55) level = 'Advanced';
  else if (clamped >= 35) level = 'Intermediate';
  else level = 'Beginner';

  return { level, score: clamped };
}

/* ── Percentile ────────────────────────────────────────────── */

function getPercentile(passRate: number, s: Statistics): number {
  // Estimate percentile based on composite score
  // Industry benchmarks: avg win rate ~47%, avg RR ~1.1, avg consistency ~45
  let score = 0;
  if (s.winRate > 47) score += Math.min(25, (s.winRate - 47) * 3);
  if (s.avgRR > 1.1) score += Math.min(25, (s.avgRR - 1.1) * 15);
  if (s.riskConsistency > 45) score += Math.min(25, (s.riskConsistency - 45) * 1);
  if (s.maxDrawdown < 5) score += 15;
  else if (s.maxDrawdown < 8) score += 5;
  if (passRate > 50) score += Math.min(10, (passRate - 50) * 0.5);
  return clamp(Math.round(score + 30), 5, 97); // floor at 5%, cap at 97%
}

/* ── Verdict ───────────────────────────────────────────────── */

function getVerdict(passRate: number, s: Statistics, challengeName: string, mistake: BiggestMistake): string {
  if (passRate >= 80) {
    return `You are ready. Your historical trading suggests a ${passRate}% probability of passing a standard ${challengeName}. ${mistake.title !== 'No Major Issues' ? `Your only notable area for improvement is ${mistake.title.toLowerCase()}. Addressing this could push your probability above 90%.` : 'Maintain your current discipline and you should pass with confidence.'}`;
  }
  if (passRate >= 60) {
    return `You have a solid chance. At ${passRate}%, you are likely to pass a ${challengeName}, but there is room for improvement. ${mistake.title !== 'No Major Issues' ? `Focus on fixing ${mistake.title.toLowerCase()} — this is your biggest opportunity to improve.` : 'Stay consistent and disciplined.'}`;
  }
  if (passRate >= 40) {
    return `You have potential, but need work. At ${passRate}%, you have roughly even odds. ${mistake.title !== 'No Major Issues' ? `Your biggest obstacle is ${mistake.title.toLowerCase()}. Fixing this alone could move you above 60%.` : 'Focus on consistency and risk management.'}`;
  }
  return `You are not yet ready. At ${passRate}%, the odds are against you. ${mistake.title !== 'No Major Issues' ? `Start by addressing ${mistake.title.toLowerCase()} before attempting a challenge.` : 'Review your strategy fundamentals before risking challenge fees.'}`;
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
    candidates.push({ title: 'Improve Risk-to-Reward', current: `${s.avgRR.toFixed(1)}`, recommended: '1.5', estimatedImpact: '+8-12%' });
  }
  if (s.avgTradesPerDay > 5) {
    candidates.push({ title: 'Reduce daily trade count', current: `${s.avgTradesPerDay.toFixed(1)} trades/day`, recommended: '3-4 trades/day', estimatedImpact: '+5-10%' });
  }
  if (s.riskConsistency < 60) {
    candidates.push({ title: 'Standardize risk per trade', current: `${s.riskConsistency}/100 consistency`, recommended: '70+/100', estimatedImpact: '+6-9%' });
  }
  if (s.maxDrawdown > 4) {
    candidates.push({ title: 'Tighten drawdown management', current: `${s.maxDrawdown.toFixed(1)}% max DD`, recommended: 'Under 3%', estimatedImpact: '+7-14%' });
  }
  if (s.largestLosingStreak >= 5) {
    candidates.push({ title: 'Stop after 2 consecutive losses', current: `${s.largestLosingStreak} loss streak`, recommended: 'Max 2-3', estimatedImpact: '+5-8%' });
  }
  if (s.winRate < 50 && s.avgRR >= 1) {
    candidates.push({ title: 'Improve trade selection', current: `${s.winRate.toFixed(1)}%`, recommended: '50%+', estimatedImpact: '+6-10%' });
  }
  if (s.positionSizeConsistency < 50) {
    candidates.push({ title: 'Use fixed position sizing', current: `${s.positionSizeConsistency}/100`, recommended: '70+/100', estimatedImpact: '+4-7%' });
  }

  return candidates.slice(0, 3);
}
