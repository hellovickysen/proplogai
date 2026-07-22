'use client';

import { useState, useCallback } from 'react';
import UploadZone from '@/components/probability-analyzer/UploadZone';
import Report from '@/components/probability-analyzer/Report';

export default function AnalyzerPage() {
  const [state, setState] = useState('idle'); // idle | processing | done | error
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [step, setStep] = useState('');

  const handleFile = useCallback(async ({ content, fileName }) => {
    setState('processing');
    setError('');

    try {
      setStep('Parsing statement...');
      const { analyzeStatement } = await import('@/lib/probability-engine');

      setStep('Running analysis...');
      const result = await analyzeStatement(content, fileName);

      setReport(result);
      setState('done');
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
    setStep('');
  };

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
            <p className="text-sm text-white/50">{step}</p>
          </div>
        )}

        {/* Upload */}
        {state !== 'processing' && (
          <>
            <UploadZone onFileLoaded={handleFile} disabled={state === 'processing'} />

            {/* Error */}
            {state === 'error' && error && (
              <div className="mt-4 rounded-xl border border-red-400/20 bg-red-400/5 p-4">
                <p className="text-sm font-medium text-red-400">Analysis Failed</p>
                <p className="mt-1 text-xs text-red-400/70">{error}</p>
                <button onClick={reset} className="mt-2 text-xs text-white/40 underline hover:text-white">
                  Try again
                </button>
              </div>
            )}

            {/* How it works */}
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <h3 className="mb-3 font-mono text-xs uppercase tracking-wider text-white/35">How It Works</h3>
              <div className="space-y-2 text-sm text-white/45">
                <p>1. Upload your MT4 or MT5 trade history (CSV or Excel)</p>
                <p>2. We calculate your key performance statistics</p>
                <p>3. 10,000 Monte Carlo simulations run against industry-standard challenge rules</p>
                <p>4. Get your probability, best challenge type, and improvement suggestions</p>
              </div>
            </div>

            {/* Requirements */}
            <div className="mt-4 text-center text-xs text-white/30">
              Minimum 10 closed trades required · Completely free · No login needed
            </div>
          </>
        )}
      </div>
    </div>
  );
}
