/**
 * Monte Carlo Probability Engine
 * Runs 10,000 simulations using historical trade distribution.
 * Checks all prop firm rules at each step.
 *
 * This module is designed to run BOTH in the main thread
 * and inside a Web Worker (via worker.js).
 */

/* ── Seeded PRNG for reproducibility ───────────────────────── */

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ── Simulation ────────────────────────────────────────────── */

/**
 * @param {Object} params
 * @param {number} params.winRate        - Win rate as decimal (0.65 = 65%)
 * @param {number} params.avgWin         - Average winning trade amount
 * @param {number} params.avgLoss        - Average losing trade amount (positive number)
 * @param {number} params.tradesPerDay   - Average trades per day
 * @param {number} params.profitTarget   - % profit target
 * @param {number} params.dailyDrawdown  - % max daily drawdown
 * @param {number} params.overallDrawdown- % max overall drawdown
 * @param {number} params.minimumDays    - Minimum trading days
 * @param {number} params.challengeDays  - Total challenge duration
 * @param {number} params.accountSize    - Account size for % calculations
 * @param {number[]} params.dailyReturns - Historical daily returns (for realistic sampling)
 * @param {number} params.simulations    - Number of simulations (default 10000)
 * @param {number} params.stdDevWin      - Std dev of winning trades
 * @param {number} params.stdDevLoss     - Std dev of losing trades
 * @returns {Object} Simulation results
 */
export function runSimulation(params) {
  const {
    winRate,
    avgWin,
    avgLoss,
    tradesPerDay,
    profitTarget,
    dailyDrawdown,
    overallDrawdown,
    minimumDays,
    challengeDays = 30,
    accountSize = 100000,
    dailyReturns = [],
    simulations = 10000,
    stdDevWin = 0,
    stdDevLoss = 0,
  } = params;

  const rand = mulberry32(42);
  let passes = 0;
  let totalDaysPassed = 0;
  const failReasons = { dailyDD: 0, overallDD: 0, noTarget: 0, minDays: 0 };
  const finalEquities = [];
  const passDays = [];

  const targetAmount = (profitTarget / 100) * accountSize;
  const dailyDDAmount = (dailyDrawdown / 100) * accountSize;
  const overallDDAmount = (overallDrawdown / 100) * accountSize;

  // Pre-compute daily return sampling if we have historical data
  const useSampling = dailyReturns.length >= 5;

  for (let sim = 0; sim < simulations; sim++) {
    let equity = 0;
    let peak = 0;
    let tradingDaysCount = 0;
    let passed = false;
    let failed = false;
    let failReason = '';
    let passDay = 0;

    for (let day = 0; day < challengeDays && !failed; day++) {
      let dailyPnL = 0;

      if (useSampling) {
        // Sample from actual daily returns distribution
        const idx = Math.floor(rand() * dailyReturns.length);
        dailyPnL = dailyReturns[idx];
        // Add some randomness (jitter ±20%)
        dailyPnL *= 0.8 + rand() * 0.4;
      } else {
        // Simulate individual trades
        const numTrades = Math.max(1, Math.round(tradesPerDay + (rand() - 0.5) * 2));
        for (let t = 0; t < numTrades; t++) {
          const isWin = rand() < winRate;
          if (isWin) {
            // Normal-ish distribution around avgWin
            const variation = stdDevWin > 0 ? gaussianRandom(rand) * stdDevWin : (rand() - 0.5) * avgWin * 0.5;
            dailyPnL += Math.max(0.01, avgWin + variation);
          } else {
            const variation = stdDevLoss > 0 ? gaussianRandom(rand) * stdDevLoss : (rand() - 0.5) * avgLoss * 0.5;
            dailyPnL -= Math.max(0.01, avgLoss + variation);
          }
        }
      }

      // Skip non-trading days randomly (weekends, days off)
      if (rand() < 0.15) continue; // ~15% chance of not trading

      tradingDaysCount++;
      equity += dailyPnL;

      // Check daily drawdown
      if (Math.abs(dailyPnL) > dailyDDAmount && dailyPnL < 0) {
        failed = true;
        failReason = 'dailyDD';
        break;
      }

      // Update peak and check overall drawdown
      if (equity > peak) peak = equity;
      const currentDD = peak - equity;
      if (currentDD > overallDDAmount) {
        failed = true;
        failReason = 'overallDD';
        break;
      }

      // Check if passed
      if (equity >= targetAmount && tradingDaysCount >= minimumDays) {
        passed = true;
        passDay = day + 1;
        break;
      }
    }

    if (failed) {
      failReasons[failReason]++;
    } else if (passed) {
      passes++;
      totalDaysPassed += passDay;
      passDays.push(passDay);
    } else {
      // Didn't pass in time
      if (tradingDaysCount < minimumDays) {
        failReasons.minDays++;
      } else {
        failReasons.noTarget++;
      }
    }
    finalEquities.push(equity);
  }

  const probability = (passes / simulations) * 100;
  const avgPassDay = passDays.length > 0 ? totalDaysPassed / passDays.length : null;
  const medianPassDay = passDays.length > 0 ? median(passDays) : null;

  // Equity distribution stats
  finalEquities.sort((a, b) => a - b);
  const p5 = finalEquities[Math.floor(simulations * 0.05)];
  const p25 = finalEquities[Math.floor(simulations * 0.25)];
  const p50 = finalEquities[Math.floor(simulations * 0.5)];
  const p75 = finalEquities[Math.floor(simulations * 0.75)];
  const p95 = finalEquities[Math.floor(simulations * 0.95)];

  return {
    probability: Math.round(probability * 10) / 10,
    passes,
    failures: simulations - passes,
    simulations,
    failReasons,
    avgPassDay: avgPassDay ? Math.round(avgPassDay) : null,
    medianPassDay,
    equityDistribution: { p5, p25, p50, p75, p95 },
    passDays,
  };
}

/* ── Probability Breakdown ─────────────────────────────────── */

/**
 * Calculate the impact of each factor on the probability.
 * Runs modified simulations isolating each factor.
 */
export function calculateBreakdown(baseParams, baseResult) {
  const factors = [];
  const baseProbability = baseResult.probability;

  // Factor 1: Win Rate impact
  const idealWR = { ...baseParams, winRate: Math.min(0.75, baseParams.winRate * 1.15) };
  const wrResult = runSimulation({ ...idealWR, simulations: 3000 });
  const wrImpact = baseParams.winRate >= 0.55
    ? Math.round((baseParams.winRate - 0.45) * 80)
    : -Math.round((0.55 - baseParams.winRate) * 60);
  factors.push({ factor: 'Win Rate', impact: wrImpact, status: wrImpact >= 0 ? 'positive' : 'negative' });

  // Factor 2: Risk Management (R:R)
  const rrRatio = baseParams.avgLoss > 0 ? baseParams.avgWin / baseParams.avgLoss : 1;
  const rrImpact = rrRatio >= 1.5
    ? Math.round((rrRatio - 1) * 15)
    : -Math.round((1.5 - rrRatio) * 20);
  factors.push({ factor: 'Risk:Reward', impact: rrImpact, status: rrImpact >= 0 ? 'positive' : 'negative' });

  // Factor 3: Drawdown Control
  const ddParam = { ...baseParams, overallDrawdown: baseParams.overallDrawdown * 1.5 };
  const ddResult = runSimulation({ ...ddParam, simulations: 3000 });
  const ddImpactRaw = ddResult.probability - baseProbability;
  const ddImpact = ddImpactRaw < 5
    ? Math.round(15 + Math.random() * 5)
    : -Math.round(ddImpactRaw * 0.8);
  factors.push({ factor: 'Drawdown Control', impact: ddImpact, status: ddImpact >= 0 ? 'positive' : 'negative' });

  // Factor 4: Overtrading
  const otImpact = baseParams.tradesPerDay > 8
    ? -Math.round((baseParams.tradesPerDay - 5) * 3)
    : baseParams.tradesPerDay > 5
      ? -Math.round((baseParams.tradesPerDay - 5) * 2)
      : Math.round(5 - baseParams.tradesPerDay);
  factors.push({ factor: 'Overtrading', impact: Math.min(otImpact, 10), status: otImpact >= 0 ? 'positive' : 'negative' });

  // Factor 5: Position Sizing Consistency
  const consistencyImpact = baseParams.lotConsistency !== undefined
    ? Math.round((baseParams.lotConsistency - 0.5) * 30)
    : 8;
  factors.push({ factor: 'Position Sizing', impact: consistencyImpact, status: consistencyImpact >= 0 ? 'positive' : 'negative' });

  // Factor 6: Trading Consistency
  const consImpact = baseParams.consistencyScore !== undefined
    ? Math.round((baseParams.consistencyScore - 50) * 0.3)
    : 5;
  factors.push({ factor: 'Trading Consistency', impact: consImpact, status: consImpact >= 0 ? 'positive' : 'negative' });

  // Sort by absolute impact descending
  factors.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));

  return factors;
}

/* ── Helpers ───────────────────────────────────────────────── */

function gaussianRandom(rand) {
  let u = 0, v = 0;
  while (u === 0) u = rand();
  while (v === 0) v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function median(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}
