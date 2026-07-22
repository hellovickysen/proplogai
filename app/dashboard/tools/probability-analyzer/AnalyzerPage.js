'use client';

import { useState, useCallback, useEffect } from 'react';
import UploadZone from '@/components/probability-analyzer/UploadZone';
import Report from '@/components/probability-analyzer/Report';

/* ── Monte Carlo Animation ─────────────────────────────────── */

function SimulationReveal({ onComplete, report }) {
  const [simCount, setSimCount] = useState(0);
  const [checks, setChecks] = useState({ drawdown: false, target: false, consistency: false, days: false });
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    // Animate simulation count from 0 to 10000
    const duration = 3000;
    const start = performance.now();
    let raf;

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 2);
      setSimCount(Math.round(eased * 10000));

      // Trigger checkmarks at intervals
      if (progress > 0.25) setChecks(c => ({ ...c, drawdown: true }));
      if (progress > 0.45) setChecks(c => ({ ...c, target: true }));
      if (progress > 0.65) setChecks(c => ({ ...c, consistency: true }));
      if (progress > 0.85) setChecks(c => ({ ...c, days: true }));

      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        // Brief pause then reveal
        setTimeout(() => setRevealed(true), 600);
        setTimeout(() => onComplete(), 1200);
      }
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onComplete]);

  const pct = (simCount / 10000) * 100;

  if (revealed && report) {
    // Big reveal
    const prob = report.overallProbability;
    const color = prob >= 65 ? '#34d399' : prob >= 40 ? '#fbbf24' : '#f87171';
    return (
      <div className="flex flex-col items-center py-16 animate-[fadeIn_0.6s_ease-out]">
        <div className="text-6xl font-bold mb-2" style={{ color }}>{prob}%</div>
        <div className="text-sm text-white/50">Pass Probability</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm py-16">
      <div className="text-center mb-6">
        <p className="text-sm font-medium text-white/80">Running Monte Carlo Simulation</p>
        <p className="mt-1 font-mono text-xs text-white/40">
          Simulation {simCount.toLocaleString()} / 10,000
        </p>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden mb-8">
        <div
          className="h-full rounded-full transition-all duration-100"
          style={{
            width: `${pct}%`,
            background: 'linear-gradient(90deg, #a78bfa, #22d3ee)',
          }}
        />
      </div>

      {/* Checkmarks */}
      <div className="space-y-3">
        <Check label="Checking drawdown limits" done={checks.drawdown} />
        <Check label="Checking profit targets" done={checks.target} />
        <Check label="Checking consistency rules" done={checks.consistency} />
        <Check label="Checking minimum trading days" done={checks.days} />
      </div>
    </div>
  );
}

function Check({ label, done }) {
  return (
    <div className={`flex items-center gap-3 text-sm transition-all duration-300 ${done ? 'text-emerald-400' : 'text-white/25'}`}>
      <span className="w-5 text-center">
        {done ? '✓' : '○'}
      </span>
      <span>{label}</span>
    </div>
  );
}

/* ── Main Page ─────────────────────────────────────────────── */

export default function AnalyzerPage() {
  const [state, setState] = useState('idle'); // idle | processing | simulating | done | error
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  const handleFile = useCallback(async ({ content, fileName }) => {
    setState('processing');
    setError('');

    try {
      const { analyzeStatement } = await import('@/lib/probability-engine');
      const result = await analyzeStatement(content, fileName);
      setReport(result);
      setState('simulating'); // show animation before revealing results
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.message || 'An unexpected error occurred.');
      setState('error');
    }
  }, []);

  const reset = () => {
    setState('idle');
    setReport(null);
    setError('');
  };

  /* ── Simulation reveal ──────────────────────────────────── */
  if (state === 'simulating' && report) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="mx-auto max-w-3xl">
          <SimulationReveal
            report={report}
            onComplete={() => setState('done')}
          />
        </div>
      </div>
    );
  }

  /* ── Results ─────────────────────────────────────────────── */
  if (state === 'done' && report) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <Report report={report} onReset={reset} />
      </div>
    );
  }

  /* ── Upload / Landing ────────────────────────────────────── */
  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-xl">
        {/* Hero */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-3xl">
            🎯
          </div>
          <h1 className="text-2xl font-bold text-white md:text-3xl">
            Prop Test Pass Probability
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-white/45">
            Upload your MT4 or MT5 trading statement and find out your realistic
            probability of passing a prop firm challenge.
          </p>
        </div>

        {/* Processing state */}
        {state === 'processing' && (
          <div className="flex flex-col items-center py-16">
            <div className="mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-cyan-400" />
            <p className="text-sm text-white/50">Parsing your trading statement...</p>
          </div>
        )}

        {/* Upload */}
        {state !== 'processing' && (
          <>
            <UploadZone onFileLoaded={handleFile} disabled={state === 'processing'} />

            {state === 'error' && error && (
              <div className="mt-4 rounded-xl border border-red-400/20 bg-red-400/5 p-4">
                <p className="text-sm font-medium text-red-400">Analysis Failed</p>
                <p className="mt-1 text-xs text-red-400/70">{error}</p>
                <button onClick={reset} className="mt-2 text-xs text-white/40 underline hover:text-white">
                  Try again
                </button>
              </div>
            )}

            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <h3 className="mb-3 font-mono text-xs uppercase tracking-wider text-white/35">How It Works</h3>
              <div className="space-y-2 text-sm text-white/45">
                <p>1. Upload your MT4 or MT5 trade history (CSV or Excel)</p>
                <p>2. We calculate your key performance statistics</p>
                <p>3. 10,000 Monte Carlo simulations run against industry-standard challenge rules</p>
                <p>4. Get your probability, best challenge type, and improvement suggestions</p>
              </div>
            </div>

            <div className="mt-4 text-center text-xs text-white/30">
              Minimum 10 closed trades required · Completely free · No login needed
            </div>
          </>
        )}
      </div>
    </div>
  );
}
