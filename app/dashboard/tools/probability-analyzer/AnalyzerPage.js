'use client';

import { useState, useCallback } from 'react';
import UploadZone from '@/components/probability-analyzer/UploadZone';
import Report from '@/components/probability-analyzer/Report';
import { fetchJournalTrades } from './actions';

/* ── Monte Carlo Animation ─────────────────────────────────── */

function SimulationReveal({ onComplete, report }) {
  const [simCount, setSimCount] = useState(0);
  const [checks, setChecks] = useState({ drawdown: false, target: false, consistency: false, days: false });
  const [revealed, setRevealed] = useState(false);

  useState(() => {
    const duration = 3000;
    const start = performance.now();
    let raf;
    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 2);
      setSimCount(Math.round(eased * 10000));
      if (progress > 0.25) setChecks(c => ({ ...c, drawdown: true }));
      if (progress > 0.45) setChecks(c => ({ ...c, target: true }));
      if (progress > 0.65) setChecks(c => ({ ...c, consistency: true }));
      if (progress > 0.85) setChecks(c => ({ ...c, days: true }));
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setTimeout(() => setRevealed(true), 600);
        setTimeout(() => onComplete(), 1200);
      }
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  });

  const pct = (simCount / 10000) * 100;

  if (revealed && report) {
    const prob = report.overallProbability;
    const color = prob >= 65 ? '#34d399' : prob >= 40 ? '#fbbf24' : '#f87171';
    return (
      <div className="flex flex-col items-center py-16">
        <div className="text-6xl font-bold mb-2" style={{ color }}>{prob}%</div>
        <div className="text-sm text-white/50">Pass Probability</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm py-16">
      <div className="text-center mb-6">
        <p className="text-sm font-medium text-white/80">Running Monte Carlo Simulation</p>
        <p className="mt-1 font-mono text-xs text-white/40">Simulation {simCount.toLocaleString()} / 10,000</p>
      </div>
      <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden mb-8">
        <div className="h-full rounded-full transition-all duration-100" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #a78bfa, #22d3ee)' }} />
      </div>
      <div className="space-y-3">
        {[{ label: 'Checking drawdown limits', done: checks.drawdown },
          { label: 'Checking profit targets', done: checks.target },
          { label: 'Checking consistency rules', done: checks.consistency },
          { label: 'Checking minimum trading days', done: checks.days }].map(c => (
          <div key={c.label} className={`flex items-center gap-3 text-sm transition-all duration-300 ${c.done ? 'text-emerald-400' : 'text-white/25'}`}>
            <span className="w-5 text-center">{c.done ? '✓' : '○'}</span>
            <span>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main Page ─────────────────────────────────────────────── */

export default function AnalyzerPage({ isLoggedIn = false, tradeCount = 0, userId = null }) {
  const [state, setState] = useState('idle');
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [processingMsg, setProcessingMsg] = useState('');

  const canAnalyzeJournal = isLoggedIn && tradeCount >= 10;

  /* ── Analyze from journal ────────────────────────────────── */
  const handleJournalAnalysis = useCallback(async () => {
    setState('processing');
    setProcessingMsg('Fetching your journal trades...');
    setError('');

    try {
      const result = await fetchJournalTrades(userId);
      if (result.error) throw new Error(result.error);

      setProcessingMsg('Running analysis...');
      const { analyzeStatement } = await import('@/lib/probability-engine');
      const analysisResult = await analyzeStatement(result.csv, 'journal.csv');
      setReport(analysisResult);
      setState('simulating');
    } catch (err) {
      console.error('Journal analysis error:', err);
      setError(err.message || 'Failed to analyze journal.');
      setState('error');
    }
  }, [userId]);

  /* ── Handle CSV/Excel upload ─────────────────────────────── */
  const handleFile = useCallback(async ({ content, fileName }) => {
    setState('processing');
    setProcessingMsg('Parsing your trading statement...');
    setError('');
    try {
      const { analyzeStatement } = await import('@/lib/probability-engine');
      const result = await analyzeStatement(content, fileName);
      setReport(result);
      setState('simulating');
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.message || 'An unexpected error occurred.');
      setState('error');
    }
  }, []);

  /* ── Handle screenshot upload ────────────────────────────── */
  const handleImages = useCallback(async (dataUrls) => {
    setState('reading');
    setProcessingMsg('Reading your screenshots with AI...');
    setError('');
    try {
      const res = await fetch('/api/parse-screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: dataUrls }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to parse screenshots.');
      if (!data.trades || data.trades.length < 10) {
        throw new Error(`Found ${data.trades?.length || 0} trades. Minimum 10 required. Try uploading more screenshots.`);
      }

      setProcessingMsg('Running analysis...');
      setState('processing');

      const trades = data.trades.sort((a, b) => new Date(a.date) - new Date(b.date));
      const csvLines = ['Ticket,Open Time,Close Time,Type,Volume,Symbol,Open Price,Close Price,S/L,T/P,Commission,Swap,Profit'];
      trades.forEach((t, i) => {
        csvLines.push([t.id || i + 1, t.openDate || t.date || '', t.closeDate || t.date || '', t.direction, t.lotSize, t.symbol, t.entry, t.exit, t.stopLoss || 0, t.takeProfit || 0, t.commission || 0, t.swap || 0, t.profit].join(','));
      });

      const { analyzeStatement } = await import('@/lib/probability-engine/analyzer');
      const result = await analyzeStatement(csvLines.join('\n'), 'screenshot.csv');
      setReport(result);
      setState('simulating');
    } catch (err) {
      console.error('Screenshot analysis error:', err);
      setError(err.message || 'Failed to analyze screenshots.');
      setState('error');
    }
  }, []);

  const reset = () => { setState('idle'); setReport(null); setError(''); setProcessingMsg(''); };

  /* ── Simulation reveal ──────────────────────────────────── */
  if (state === 'simulating' && report) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="mx-auto max-w-3xl">
          <SimulationReveal report={report} onComplete={() => setState('done')} />
        </div>
      </div>
    );
  }

  /* ── Results ─────────────────────────────────────────────── */
  if (state === 'done' && report) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <Report report={report} onReset={reset} isLoggedIn={isLoggedIn} />
      </div>
    );
  }

  /* ── Upload / Landing ────────────────────────────────────── */
  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-xl">
        {/* Hero */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-3xl">🎯</div>
          <h1 className="text-2xl font-bold text-white md:text-3xl">Prop Test Pass Probability</h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-white/45">
            {isLoggedIn
              ? 'Analyze your PropLogAI journal or upload a statement to find out your probability of passing.'
              : 'Upload your MT4 or MT5 trading statement and find out your realistic probability of passing a prop firm challenge.'}
          </p>
        </div>

        {/* Journal Analysis Card (logged-in users) */}
        {isLoggedIn && (
          <div className="mb-6 rounded-2xl border border-white/10 bg-gradient-to-r from-violet-500/[0.06] to-cyan-500/[0.04] p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">📊</span>
                  <h3 className="text-sm font-semibold text-white">Your PropLogAI Journal</h3>
                </div>
                <p className="mt-1 text-xs text-white/40">
                  {canAnalyzeJournal
                    ? `You have ${tradeCount} trades ready for analysis`
                    : `You have ${tradeCount} trade${tradeCount !== 1 ? 's' : ''} — need at least 10 to analyze`}
                </p>
              </div>
              <button
                onClick={handleJournalAnalysis}
                disabled={!canAnalyzeJournal || state === 'processing'}
                className="rounded-xl px-5 py-2.5 text-sm font-semibold text-[#08080f] disabled:opacity-40 transition-transform hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: canAnalyzeJournal ? 'linear-gradient(120deg, #a78bfa, #22d3ee)' : 'rgba(255,255,255,0.1)' }}
              >
                {state === 'processing' ? 'Analyzing...' : 'Analyze My Journal'}
              </button>
            </div>
          </div>
        )}

        {/* Divider for logged-in users */}
        {isLoggedIn && (
          <div className="mb-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-white/25">or upload a statement</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>
        )}

        {/* Processing state */}
        {(state === 'processing' || state === 'reading') && (
          <div className="flex flex-col items-center py-16">
            <div className="mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-cyan-400" />
            <p className="text-sm text-white/50">{processingMsg}</p>
            {state === 'reading' && <p className="mt-2 text-xs text-white/30">This may take 10-15 seconds for screenshots</p>}
          </div>
        )}

        {/* Upload zone */}
        {state !== 'processing' && state !== 'reading' && (
          <>
            <UploadZone onFileLoaded={handleFile} onImagesLoaded={handleImages} disabled={state === 'processing' || state === 'reading'} />

            {state === 'error' && error && (
              <div className="mt-4 rounded-xl border border-red-400/20 bg-red-400/5 p-4">
                <p className="text-sm font-medium text-red-400">Analysis Failed</p>
                <p className="mt-1 text-xs text-red-400/70">{error}</p>
                <button onClick={reset} className="mt-2 text-xs text-white/40 underline hover:text-white">Try again</button>
              </div>
            )}

            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <h3 className="mb-3 font-mono text-xs uppercase tracking-wider text-white/35">How It Works</h3>
              <div className="space-y-2 text-sm text-white/45">
                <p>1. Upload your trade history (CSV, Excel, or screenshots)</p>
                <p>2. We calculate your key performance statistics</p>
                <p>3. 10,000 Monte Carlo simulations run against industry-standard challenge rules</p>
                <p>4. Get your probability, best challenge type, and improvement suggestions</p>
              </div>
            </div>

            <div className="mt-4 text-center text-xs text-white/30">
              Minimum 10 closed trades required · Completely free{!isLoggedIn ? ' · No login needed' : ''}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
