/**
 * Metrics Engine
 * Calculates 30+ trading metrics from normalized trades.
 */

/* ── Helpers ───────────────────────────────────────────────── */

function getTradeDate(t) {
  if (!t.date) return null;
  return t.date.slice(0, 10); // YYYY-MM-DD
}

function getSession(t) {
  if (!t.date) return 'Unknown';
  const h = new Date(t.date).getUTCHours();
  if (h >= 0 && h < 8) return 'Asian';
  if (h >= 8 && h < 13) return 'London';
  if (h >= 13 && h < 21) return 'New York';
  return 'Off-hours';
}

function getDayOfWeek(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
}

function getMonth(dateStr) {
  return dateStr.slice(0, 7); // YYYY-MM
}

function getWeek(dateStr) {
  const d = new Date(dateStr);
  const start = new Date(d.getFullYear(), 0, 1);
  const diff = d - start;
  const week = Math.ceil((diff / 86400000 + start.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

/* ── Main Compute ──────────────────────────────────────────── */

export function computeMetrics(trades) {
  if (!trades || trades.length === 0) {
    return null;
  }

  const wins = trades.filter((t) => t.netProfit > 0);
  const losses = trades.filter((t) => t.netProfit < 0);
  const breakeven = trades.filter((t) => t.netProfit === 0);

  // Basic
  const winRate = (wins.length / trades.length) * 100;
  const avgProfit = wins.length > 0 ? wins.reduce((s, t) => s + t.netProfit, 0) / wins.length : 0;
  const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + t.netProfit, 0) / losses.length) : 0;
  const avgRR = avgLoss > 0 ? avgProfit / avgLoss : avgProfit > 0 ? Infinity : 0;
  const expectancy = avgLoss > 0
    ? (winRate / 100) * avgProfit - ((100 - winRate) / 100) * avgLoss
    : avgProfit;

  const totalProfit = trades.reduce((s, t) => s + t.netProfit, 0);
  const grossProfit = wins.reduce((s, t) => s + t.netProfit, 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + t.netProfit, 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0;

  // Drawdown
  let peak = 0;
  let maxDD = 0;
  let equity = 0;
  const equityCurve = [];
  const drawdownCurve = [];

  trades.forEach((t) => {
    equity += t.netProfit;
    if (equity > peak) peak = equity;
    const dd = peak > 0 ? ((peak - equity) / peak) * 100 : 0;
    if (dd > maxDD) maxDD = dd;
    equityCurve.push({ date: t.date, equity, trade: t.symbol });
    drawdownCurve.push({ date: t.date, drawdown: -dd });
  });

  const recoveryFactor = maxDD > 0 ? totalProfit / (maxDD * (peak / 100)) : 0;

  // Streaks
  let maxConsWins = 0, maxConsLosses = 0;
  let curWins = 0, curLosses = 0;
  const streaks = [];
  trades.forEach((t) => {
    if (t.netProfit > 0) {
      curWins++;
      curLosses = 0;
      if (curWins > maxConsWins) maxConsWins = curWins;
    } else if (t.netProfit < 0) {
      curLosses++;
      curWins = 0;
      if (curLosses > maxConsLosses) maxConsLosses = curLosses;
    }
    streaks.push({ wins: curWins, losses: curLosses });
  });

  // Daily stats
  const dailyMap = {};
  trades.forEach((t) => {
    const day = getTradeDate(t);
    if (!day) return;
    if (!dailyMap[day]) dailyMap[day] = { pnl: 0, count: 0, trades: [] };
    dailyMap[day].pnl += t.netProfit;
    dailyMap[day].count++;
    dailyMap[day].trades.push(t);
  });

  const tradingDays = Object.keys(dailyMap).length;
  const dailyReturns = Object.values(dailyMap).map((d) => d.pnl);
  const avgDailyReturn = dailyReturns.length > 0 ? dailyReturns.reduce((s, v) => s + v, 0) / dailyReturns.length : 0;
  const avgDailyGain = dailyReturns.length > 0 ? dailyReturns.reduce((s, v) => s + v, 0) / dailyReturns.length : 0;
  const tradesPerDay = tradingDays > 0 ? trades.length / tradingDays : 0;
  const largestWinDay = Math.max(...dailyReturns, 0);
  const largestLossDay = Math.min(...dailyReturns, 0);

  // Max daily drawdown
  let maxDailyDD = 0;
  dailyReturns.forEach((r) => {
    if (r < 0 && Math.abs(r) > maxDailyDD) maxDailyDD = Math.abs(r);
  });

  // Holding time
  const durations = trades.filter((t) => t.duration > 0).map((t) => t.duration);
  const avgHoldingTime = durations.length > 0 ? durations.reduce((s, v) => s + v, 0) / durations.length : 0;

  // Risk / Reward per trade
  const risksPerTrade = trades.map((t) => {
    if (t.stopLoss && t.entry) {
      return Math.abs(t.entry - t.stopLoss) * t.lotSize;
    }
    return Math.abs(t.netProfit < 0 ? t.netProfit : 0);
  });
  const avgRisk = risksPerTrade.length > 0 ? risksPerTrade.reduce((s, v) => s + v, 0) / risksPerTrade.length : 0;

  const rewardsPerTrade = trades.map((t) => {
    if (t.takeProfit && t.entry) {
      return Math.abs(t.takeProfit - t.entry) * t.lotSize;
    }
    return t.netProfit > 0 ? t.netProfit : 0;
  });
  const avgReward = rewardsPerTrade.length > 0 ? rewardsPerTrade.reduce((s, v) => s + v, 0) / rewardsPerTrade.length : 0;

  // Symbol analysis
  const symbolMap = {};
  trades.forEach((t) => {
    if (!symbolMap[t.symbol]) symbolMap[t.symbol] = { pnl: 0, count: 0, wins: 0 };
    symbolMap[t.symbol].pnl += t.netProfit;
    symbolMap[t.symbol].count++;
    if (t.netProfit > 0) symbolMap[t.symbol].wins++;
  });
  const symbolEntries = Object.entries(symbolMap).map(([s, d]) => ({ symbol: s, ...d, winRate: (d.wins / d.count) * 100 }));
  symbolEntries.sort((a, b) => b.pnl - a.pnl);
  const bestSymbol = symbolEntries[0] || null;
  const worstSymbol = symbolEntries[symbolEntries.length - 1] || null;

  // Session analysis
  const sessionMap = {};
  trades.forEach((t) => {
    const s = getSession(t);
    if (!sessionMap[s]) sessionMap[s] = { pnl: 0, count: 0, wins: 0 };
    sessionMap[s].pnl += t.netProfit;
    sessionMap[s].count++;
    if (t.netProfit > 0) sessionMap[s].wins++;
  });
  const sessionEntries = Object.entries(sessionMap).map(([s, d]) => ({ session: s, ...d, winRate: (d.wins / d.count) * 100 }));
  sessionEntries.sort((a, b) => b.pnl - a.pnl);
  const bestSession = sessionEntries[0] || null;
  const worstSession = sessionEntries[sessionEntries.length - 1] || null;

  // Weekly performance
  const weeklyMap = {};
  Object.entries(dailyMap).forEach(([day, data]) => {
    const w = getWeek(day);
    if (!weeklyMap[w]) weeklyMap[w] = 0;
    weeklyMap[w] += data.pnl;
  });
  const weeklyPerformance = Object.entries(weeklyMap).map(([w, pnl]) => ({ week: w, pnl }));

  // Monthly performance
  const monthlyMap = {};
  Object.entries(dailyMap).forEach(([day, data]) => {
    const m = getMonth(day);
    if (!monthlyMap[m]) monthlyMap[m] = 0;
    monthlyMap[m] += data.pnl;
  });
  const monthlyPerformance = Object.entries(monthlyMap).map(([m, pnl]) => ({ month: m, pnl }));

  // Consistency Score (0-100): measures how consistent daily returns are
  const dailyReturnStdDev = stdDev(dailyReturns);
  const dailyReturnMean = avgDailyReturn;
  const consistencyRatio = dailyReturnMean !== 0 ? Math.abs(dailyReturnMean / (dailyReturnStdDev || 1)) : 0;
  const consistencyScore = Math.min(100, Math.round(consistencyRatio * 40));

  // Discipline Score (0-100): measures adherence to risk rules
  const tradesWithSL = trades.filter((t) => t.stopLoss > 0).length;
  const slUsageRate = trades.length > 0 ? tradesWithSL / trades.length : 0;
  const lotSizes = trades.map((t) => t.lotSize).filter((l) => l > 0);
  const lotConsistency = lotSizes.length > 1 ? 1 - (stdDev(lotSizes) / (mean(lotSizes) || 1)) : 1;
  const overtradingPenalty = tradesPerDay > 10 ? 0.7 : tradesPerDay > 6 ? 0.85 : 1;
  const disciplineScore = Math.min(100, Math.max(0, Math.round(
    (slUsageRate * 40 + Math.max(0, lotConsistency) * 30 + overtradingPenalty * 30)
  )));

  // RR distribution for charts
  const rrDistribution = trades.map((t) => {
    if (t.netProfit > 0 && avgLoss > 0) return t.netProfit / avgLoss;
    if (t.netProfit < 0 && avgLoss > 0) return t.netProfit / avgLoss;
    return 0;
  });

  // Win/Loss distribution
  const winLossDistribution = trades.map((t) => t.netProfit);

  // Calendar heatmap data
  const calendarData = Object.entries(dailyMap).map(([day, data]) => ({
    date: day,
    pnl: data.pnl,
    count: data.count,
  }));

  // Day of week performance
  const dowMap = {};
  Object.entries(dailyMap).forEach(([day, data]) => {
    const dow = getDayOfWeek(day);
    if (!dowMap[dow]) dowMap[dow] = { pnl: 0, count: 0 };
    dowMap[dow].pnl += data.pnl;
    dowMap[dow].count++;
  });

  // Losing streak distribution (for Monte Carlo)
  const losingStreaks = [];
  let curStreak = 0;
  trades.forEach((t) => {
    if (t.netProfit < 0) {
      curStreak++;
    } else {
      if (curStreak > 0) losingStreaks.push(curStreak);
      curStreak = 0;
    }
  });
  if (curStreak > 0) losingStreaks.push(curStreak);

  const winningStreaks = [];
  curStreak = 0;
  trades.forEach((t) => {
    if (t.netProfit > 0) {
      curStreak++;
    } else {
      if (curStreak > 0) winningStreaks.push(curStreak);
      curStreak = 0;
    }
  });
  if (curStreak > 0) winningStreaks.push(curStreak);

  return {
    // Basic
    totalTrades: trades.length,
    winRate,
    wins: wins.length,
    losses: losses.length,
    breakeven: breakeven.length,
    avgRR: avgRR === Infinity ? 999 : avgRR,
    avgProfit,
    avgLoss,
    expectancy,
    totalProfit,
    grossProfit,
    grossLoss,
    profitFactor: profitFactor === 999 ? 999 : profitFactor,

    // Risk
    maxDrawdown: maxDD,
    recoveryFactor,
    avgRisk,
    avgReward,
    avgHoldingTime,
    maxDailyDD,

    // Daily
    tradingDays,
    tradesPerDay,
    avgDailyReturn,
    avgDailyGain,
    largestWinDay,
    largestLossDay,

    // Streaks
    maxConsWins,
    maxConsLosses,
    losingStreaks,
    winningStreaks,

    // Scores
    consistencyScore,
    disciplineScore,

    // Symbols
    bestSymbol,
    worstSymbol,
    symbolBreakdown: symbolEntries,

    // Sessions
    bestSession,
    worstSession,
    sessionBreakdown: sessionEntries,

    // Time analysis
    weeklyPerformance,
    monthlyPerformance,
    calendarData,
    dayOfWeekPerformance: dowMap,

    // Chart data
    equityCurve,
    drawdownCurve,
    rrDistribution,
    winLossDistribution,
    dailyReturns,
    dailyMap,
  };
}

/* ── Statistical helpers ───────────────────────────────────── */

function mean(arr) {
  if (arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function stdDev(arr) {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  const variance = arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length;
  return Math.sqrt(variance);
}
