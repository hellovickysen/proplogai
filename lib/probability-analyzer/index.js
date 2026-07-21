/**
 * Probability Analyzer — Public API
 * Single entry point for the full analysis pipeline.
 */

export { parseAndNormalize, detectFormat } from './parsers';
export { computeMetrics } from './metrics';
export { PROP_FIRMS, getFirmRules, getFirmList } from './firms';
export { runSimulation, calculateBreakdown } from './monteCarlo';
export { computeScore, GRADE_COLORS, RISK_COLORS, CONFIDENCE_COLORS } from './scoring';

/**
 * Run the full pipeline: parse → metrics → simulate → score → breakdown
 */
export async function analyzeStatement(fileContent, fileName, firmKey, accountSize = 100000) {
  const { parseAndNormalize } = await import('./parsers');
  const { computeMetrics } = await import('./metrics');
  const { getFirmRules } = await import('./firms');
  const { runSimulation, calculateBreakdown } = await import('./monteCarlo');
  const { computeScore } = await import('./scoring');

  // 1. Parse
  const parsed = await parseAndNormalize(fileContent, fileName);

  // 2. Metrics
  const metrics = computeMetrics(parsed.trades);
  if (!metrics) throw new Error('Could not compute metrics — no valid trades found.');

  // 3. Firm rules
  const firm = getFirmRules(firmKey);

  // 4. Monte Carlo
  const simParams = {
    winRate: metrics.winRate / 100,
    avgWin: metrics.avgProfit,
    avgLoss: metrics.avgLoss,
    tradesPerDay: metrics.tradesPerDay,
    profitTarget: firm.profitTarget,
    dailyDrawdown: firm.dailyDrawdown,
    overallDrawdown: firm.overallDrawdown,
    minimumDays: firm.minimumTradingDays,
    challengeDays: firm.challengeDays,
    accountSize,
    dailyReturns: metrics.dailyReturns,
    simulations: 10000,
    consistencyScore: metrics.consistencyScore,
  };

  const simResult = runSimulation(simParams);

  // 5. Score
  const score = computeScore(simResult.probability, metrics, simResult);

  // 6. Breakdown
  const breakdown = calculateBreakdown(simParams, simResult);

  return {
    broker: parsed.broker,
    tradeCount: parsed.tradeCount,
    trades: parsed.trades,
    metrics,
    simResult,
    score,
    breakdown,
    firm,
    accountSize,
    simParams,
  };
}
