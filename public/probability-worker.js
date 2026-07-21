/**
 * Web Worker for Monte Carlo Simulation
 * Runs heavy computation off the main thread.
 */

/* ── Seeded PRNG ───────────────────────────────────────────── */

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

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

/* ── Simulation (duplicated from monteCarlo.js for worker isolation) ── */

function runSimulation(params) {
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
        const idx = Math.floor(rand() * dailyReturns.length);
        dailyPnL = dailyReturns[idx];
        dailyPnL *= 0.8 + rand() * 0.4;
      } else {
        const numTrades = Math.max(1, Math.round(tradesPerDay + (rand() - 0.5) * 2));
        for (let t = 0; t < numTrades; t++) {
          const isWin = rand() < winRate;
          if (isWin) {
            const variation = stdDevWin > 0 ? gaussianRandom(rand) * stdDevWin : (rand() - 0.5) * avgWin * 0.5;
            dailyPnL += Math.max(0.01, avgWin + variation);
          } else {
            const variation = stdDevLoss > 0 ? gaussianRandom(rand) * stdDevLoss : (rand() - 0.5) * avgLoss * 0.5;
            dailyPnL -= Math.max(0.01, avgLoss + variation);
          }
        }
      }

      if (rand() < 0.15) continue;

      tradingDaysCount++;
      equity += dailyPnL;

      if (Math.abs(dailyPnL) > dailyDDAmount && dailyPnL < 0) {
        failed = true;
        failReason = 'dailyDD';
        break;
      }

      if (equity > peak) peak = equity;
      const currentDD = peak - equity;
      if (currentDD > overallDDAmount) {
        failed = true;
        failReason = 'overallDD';
        break;
      }

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

  finalEquities.sort((a, b) => a - b);

  return {
    probability: Math.round(probability * 10) / 10,
    passes,
    failures: simulations - passes,
    simulations,
    failReasons,
    avgPassDay: avgPassDay ? Math.round(avgPassDay) : null,
    medianPassDay,
    equityDistribution: {
      p5: finalEquities[Math.floor(simulations * 0.05)],
      p25: finalEquities[Math.floor(simulations * 0.25)],
      p50: finalEquities[Math.floor(simulations * 0.5)],
      p75: finalEquities[Math.floor(simulations * 0.75)],
      p95: finalEquities[Math.floor(simulations * 0.95)],
    },
    passDays,
  };
}

/* ── Worker message handler ────────────────────────────────── */

self.onmessage = function (e) {
  const { type, params } = e.data;

  if (type === 'simulate') {
    try {
      const result = runSimulation(params);
      self.postMessage({ type: 'result', result });
    } catch (err) {
      self.postMessage({ type: 'error', error: err.message });
    }
  }
};
