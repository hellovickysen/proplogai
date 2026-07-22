/* ── Monte Carlo Simulator ──────────────────────────────────── */

import type { SimulatorInput, SimulatorOutput } from './types';

/* ── Seeded PRNG (Mulberry32) ──────────────────────────────── */

function mulberry32(seed: number): () => number {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussRand(rand: () => number): number {
  let u = 0, v = 0;
  while (!u) u = rand();
  while (!v) v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function median(arr: number[]): number {
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/* ── Core simulation ───────────────────────────────────────── */

export function simulate(input: SimulatorInput): SimulatorOutput {
  const {
    winRate, avgWin, avgLoss, tradesPerDay,
    dailyReturns, profitTarget, dailyDrawdown,
    overallDrawdown, minimumProfitableDays,
    challengeDays, accountSize, simulations,
  } = input;

  const rand = mulberry32(42);

  let passes = 0;
  const failReasons = { dailyDrawdown: 0, overallDrawdown: 0, targetNotReached: 0, minDaysNotMet: 0 };
  const passDaysList: number[] = [];

  const targetAmt   = (profitTarget / 100) * accountSize;
  const dailyDDAmt  = (dailyDrawdown / 100) * accountSize;
  const overallDDAmt = (overallDrawdown / 100) * accountSize;
  const useSampling  = dailyReturns.length >= 5;

  // For instant funding (profitTarget === 0), pass = survive all days
  const isInstant = profitTarget === 0;

  for (let sim = 0; sim < simulations; sim++) {
    let equity = 0;
    let peak = 0;
    let tradingDaysCount = 0;
    let profitableDays = 0;
    let failed = false;
    let failReason = '';
    let passDay = 0;

    for (let day = 0; day < challengeDays && !failed; day++) {
      // ~15% chance of not trading (weekends / days off)
      if (rand() < 0.15) continue;

      let dailyPnL = 0;

      if (useSampling) {
        const idx = Math.floor(rand() * dailyReturns.length);
        dailyPnL = dailyReturns[idx] * (0.8 + rand() * 0.4);
      } else {
        const n = Math.max(1, Math.round(tradesPerDay + (rand() - 0.5) * 2));
        for (let t = 0; t < n; t++) {
          if (rand() < winRate) {
            dailyPnL += Math.max(0.01, avgWin + gaussRand(rand) * avgWin * 0.25);
          } else {
            dailyPnL -= Math.max(0.01, avgLoss + gaussRand(rand) * avgLoss * 0.25);
          }
        }
      }

      tradingDaysCount++;
      if (dailyPnL > 0) profitableDays++;
      equity += dailyPnL;

      // Daily drawdown check
      if (dailyPnL < 0 && Math.abs(dailyPnL) > dailyDDAmt) {
        failed = true; failReason = 'dailyDrawdown'; break;
      }

      // Overall drawdown check
      if (equity > peak) peak = equity;
      if (peak - equity > overallDDAmt) {
        failed = true; failReason = 'overallDrawdown'; break;
      }

      // Pass check
      if (!isInstant && equity >= targetAmt && profitableDays >= minimumProfitableDays) {
        passDay = day + 1;
        break;
      }
    }

    if (failed) {
      failReasons[failReason as keyof typeof failReasons]++;
    } else if (isInstant) {
      // Instant funding: pass if survived all days + met minimum profitable days
      if (profitableDays >= minimumProfitableDays && equity >= 0) {
        passes++;
        passDaysList.push(challengeDays);
      } else if (profitableDays < minimumProfitableDays) {
        failReasons.minDaysNotMet++;
      } else {
        failReasons.targetNotReached++;
      }
    } else if (passDay > 0) {
      passes++;
      passDaysList.push(passDay);
    } else {
      if (tradingDaysCount < minimumProfitableDays) {
        failReasons.minDaysNotMet++;
      } else {
        failReasons.targetNotReached++;
      }
    }
  }

  const passRate = Math.round((passes / simulations) * 1000) / 10;

  return {
    passRate,
    passes,
    failures: simulations - passes,
    avgDaysToPass:    passDaysList.length ? Math.round(passDaysList.reduce((s, v) => s + v, 0) / passDaysList.length) : null,
    medianDaysToPass: passDaysList.length ? Math.round(median(passDaysList)) : null,
    failReasons,
  };
}
