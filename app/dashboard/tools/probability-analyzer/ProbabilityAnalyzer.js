'use client';

import { useState, useCallback } from 'react';
import UploadZone from '@/components/probability-analyzer/UploadZone';
import FirmSelector from '@/components/probability-analyzer/FirmSelector';
import ProcessingAnimation from '@/components/probability-analyzer/ProcessingAnimation';
import Dashboard from '@/components/probability-analyzer/Dashboard';
import { getFirmRules } from '@/lib/probability-analyzer/firms';

const STATES = {
  IDLE: 'idle',
  PROCESSING: 'processing',
  DONE: 'done',
  ERROR: 'error',
};

export default function ProbabilityAnalyzer() {
  const [state, setState] = useState(STATES.IDLE);
  const [step, setStep] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [firmKey, setFirmKey] = useState('FTMO');
  const [accountSize, setAccountSize] = useState(100000);
  const [customRules, setCustomRules] = useState({
    profitTarget: 10,
    dailyDrawdown: 5,
    overallDrawdown: 10,
    minimumTradingDays: 4,
    challengeDays: 30,
  });

  const handleFileLoaded = useCallback(
    async ({ content, fileName }) => {
      setState(STATES.PROCESSING);
      setStep(0);
      setError('');

      try {
        // Dynamic import to code-split the heavy libs
        setStep(1);
        const { parseAndNormalize } = await import('@/lib/probability-analyzer/parsers');

        setStep(2);
        const parsed = await parseAndNormalize(content, fileName);

        setStep(3);
        const { computeMetrics } = await import('@/lib/probability-analyzer/metrics');
        const metrics = computeMetrics(parsed.trades);
        if (!metrics) throw new Error('Could not compute metrics from trades.');

        setStep(4);

        // Get firm rules (custom or preset)
        let firm;
        if (firmKey === 'Custom') {
          firm = { ...customRules, name: 'Custom', phase: 'Challenge' };
        } else {
          firm = getFirmRules(firmKey);
        }

        // Run Monte Carlo — try Web Worker first, fallback to main thread
        const { runSimulation, calculateBreakdown } = await import(
          '@/lib/probability-analyzer/monteCarlo'
        );

        const simParams = {
          winRate: metrics.winRate / 100,
          avgWin: metrics.avgProfit,
          avgLoss: metrics.avgLoss,
          tradesPerDay: metrics.tradesPerDay,
          profitTarget: firm.profitTarget,
          dailyDrawdown: firm.dailyDrawdown,
          overallDrawdown: firm.overallDrawdown,
          minimumDays: firm.minimumTradingDays,
          challengeDays: firm.challengeDays || 30,
          accountSize,
          dailyReturns: metrics.dailyReturns,
          simulations: 10000,
          consistencyScore: metrics.consistencyScore,
        };

        let simResult;
        try {
          simResult = await runInWorker(simParams);
        } catch {
          // Fallback to main thread
          simResult = runSimulation(simParams);
        }

        setStep(5);
        const { computeScore } = await import('@/lib/probability-analyzer/scoring');
        const score = computeScore(simResult.probability, metrics, simResult);

        const breakdown = calculateBreakdown(simParams, simResult);

        setResult({
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
        });

        setState(STATES.DONE);
      } catch (err) {
        console.error('Analysis error:', err);
        setError(err.message || 'An unexpected error occurred.');
        setState(STATES.ERROR);
      }
    },
    [firmKey, accountSize, customRules],
  );

  const handleReset = () => {
    setState(STATES.IDLE);
    setResult(null);
    setError('');
    setStep(0);
  };

  if (state === STATES.DONE && result) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="mx-auto max-w-6xl">
          <Dashboard result={result} onReset={handleReset} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        {/* Hero */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-3xl">
            🎯
          </div>
          <h1 className="text-2xl font-bold text-white md:text-3xl">
            Prop Test Pass Probability
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm text-white/50">
            Upload your trading statement and get a realistic probability of passing
            your prop firm challenge — powered by Monte Carlo simulation on your actual
            trading history.
          </p>
        </div>

        {state === STATES.PROCESSING ? (
          <ProcessingAnimation step={step} />
        ) : (
          <div className="mx-auto max-w-xl space-y-6">
            {/* Firm Selector */}
            <FirmSelector
              value={firmKey}
              onChange={setFirmKey}
              customRules={customRules}
              onCustomChange={setCustomRules}
            />

            {/* Account Size */}
            <div className="space-y-2">
              <label className="font-mono text-xs uppercase tracking-wider text-white/55">
                Account Size
              </label>
              <select
                value={accountSize}
                onChange={(e) => setAccountSize(Number(e.target.value))}
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5
                  text-sm text-white outline-none transition-colors
                  focus:border-white/25 focus:bg-white/[0.05]"
              >
                {[5000, 10000, 25000, 50000, 100000, 200000].map((s) => (
                  <option key={s} value={s} className="bg-[#0b0b14] text-white">
                    ${s.toLocaleString()}
                  </option>
                ))}
              </select>
            </div>

            {/* Upload */}
            <UploadZone onFileLoaded={handleFileLoaded} disabled={state === STATES.PROCESSING} />

            {/* Error */}
            {state === STATES.ERROR && error && (
              <div className="rounded-xl border border-red-400/20 bg-red-400/5 p-4">
                <p className="text-sm font-medium text-red-400">Analysis Failed</p>
                <p className="mt-1 text-xs text-red-400/70">{error}</p>
                <button
                  onClick={handleReset}
                  className="mt-3 text-xs text-white/50 underline hover:text-white"
                >
                  Try again
                </button>
              </div>
            )}

            {/* How it works */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <h3 className="mb-3 font-mono text-xs uppercase tracking-wider text-white/40">
                How It Works
              </h3>
              <div className="space-y-2 text-sm text-white/50">
                <p>1. Upload your MT4, MT5, cTrader, or DXTrade trade history</p>
                <p>2. We auto-detect your broker and parse all closed trades</p>
                <p>3. 10,000 Monte Carlo simulations run against your chosen prop firm rules</p>
                <p>4. Get your probability, breakdown, and improvement suggestions</p>
              </div>
            </div>

            {/* Free badge */}
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-1 text-xs font-medium text-emerald-400">
                ✓ Completely Free · No Login Required
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Web Worker helper ─────────────────────────────────────── */

function runInWorker(params) {
  return new Promise((resolve, reject) => {
    try {
      const worker = new Worker('/probability-worker.js');
      const timeout = setTimeout(() => {
        worker.terminate();
        reject(new Error('Worker timeout'));
      }, 30000);

      worker.onmessage = (e) => {
        clearTimeout(timeout);
        worker.terminate();
        if (e.data.type === 'result') {
          resolve(e.data.result);
        } else {
          reject(new Error(e.data.error || 'Worker error'));
        }
      };

      worker.onerror = (err) => {
        clearTimeout(timeout);
        worker.terminate();
        reject(err);
      };

      worker.postMessage({ type: 'simulate', params });
    } catch (err) {
      reject(err);
    }
  });
}
