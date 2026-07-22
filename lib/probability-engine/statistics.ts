/* ── Statistics Calculator ──────────────────────────────────── */

import type { Trade, Statistics } from './types';

export function computeStatistics(trades: Trade[]): Statistics {
  const wins   = trades.filter((t) => t.netProfit > 0);
  const losses = trades.filter((t) => t.netProfit < 0);

  const totalTrades = trades.length;
  const winRate     = (wins.length / totalTrades) * 100;
  const lossRate    = (losses.length / totalTrades) * 100;

  const avgReward = wins.length   ? wins.reduce((s, t) => s + t.netProfit, 0) / wins.length     : 0;
  const avgRisk   = losses.length ? Math.abs(losses.reduce((s, t) => s + t.netProfit, 0) / losses.length) : 0;
  const avgRR     = avgRisk > 0 ? avgReward / avgRisk : avgReward > 0 ? 99 : 0;

  const totalProfit = trades.reduce((s, t) => s + t.netProfit, 0);
  const grossProfit = wins.reduce((s, t) => s + t.netProfit, 0);
  const grossLoss   = Math.abs(losses.reduce((s, t) => s + t.netProfit, 0));
  const expectancy  = avgRisk > 0
    ? (winRate / 100) * avgReward - (lossRate / 100) * avgRisk
    : avgReward;
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 99 : 0;

  /* ── Daily aggregation ───────────────────────────────────── */
  const dailyMap: Record<string, number> = {};
  trades.forEach((t) => {
    const day = t.date.slice(0, 10);
    dailyMap[day] = (dailyMap[day] ?? 0) + t.netProfit;
  });
  const dailyReturns  = Object.values(dailyMap);
  const tradingDays   = dailyReturns.length;
  const avgDailyReturn = tradingDays ? dailyReturns.reduce((s, v) => s + v, 0) / tradingDays : 0;
  const avgTradesPerDay = tradingDays ? totalTrades / tradingDays : 0;

  /* ── Max drawdown (% of running peak) ────────────────────── */
  let equity = 0, peak = 0, maxDD = 0;
  trades.forEach((t) => {
    equity += t.netProfit;
    if (equity > peak) peak = equity;
    if (peak > 0) {
      const dd = ((peak - equity) / peak) * 100;
      if (dd > maxDD) maxDD = dd;
    }
  });

  /* ── Streaks ─────────────────────────────────────────────── */
  let maxWinStreak = 0, maxLossStreak = 0, curW = 0, curL = 0;
  trades.forEach((t) => {
    if (t.netProfit > 0) { curW++; curL = 0; if (curW > maxWinStreak) maxWinStreak = curW; }
    else if (t.netProfit < 0) { curL++; curW = 0; if (curL > maxLossStreak) maxLossStreak = curL; }
    else { curW = 0; curL = 0; }
  });

  /* ── Holding time ────────────────────────────────────────── */
  const durations = trades.filter((t) => t.duration > 0).map((t) => t.duration);
  const avgHoldingTime = durations.length ? durations.reduce((s, v) => s + v, 0) / durations.length : 0;

  /* ── Risk consistency (0–100) ────────────────────────────── */
  const riskAmounts = losses.map((t) => Math.abs(t.netProfit)).filter((v) => v > 0);
  const riskConsistency = riskAmounts.length >= 2
    ? Math.max(0, Math.round(100 * (1 - coeffOfVariation(riskAmounts))))
    : 50;

  /* ── Position size consistency (0–100) ───────────────────── */
  const lots = trades.map((t) => t.lotSize).filter((v) => v > 0);
  const positionSizeConsistency = lots.length >= 2
    ? Math.max(0, Math.round(100 * (1 - coeffOfVariation(lots))))
    : 50;

  return {
    totalTrades,
    tradingDays,
    totalProfit,
    winRate,
    lossRate,
    avgRisk,
    avgReward,
    avgRR,
    expectancy,
    profitFactor,
    avgDailyReturn,
    maxDrawdown: maxDD,
    largestLosingStreak: maxLossStreak,
    largestWinningStreak: maxWinStreak,
    avgTradesPerDay,
    avgHoldingTime,
    riskConsistency,
    positionSizeConsistency,
    dailyReturns,
  };
}

/* ── Helpers ───────────────────────────────────────────────── */

function mean(arr: number[]): number {
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function stdDev(arr: number[]): number {
  const m = mean(arr);
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length);
}

function coeffOfVariation(arr: number[]): number {
  const m = mean(arr);
  return m !== 0 ? stdDev(arr) / Math.abs(m) : 1;
}
