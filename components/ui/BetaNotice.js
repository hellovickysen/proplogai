"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

const STORAGE_KEY = 'pj_beta_dismissed';

export default function BetaNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setVisible(true);
      }
    } catch (e) {}
  }, []);

  function handleDismiss() {
    setVisible(false);
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch (e) {}
  }

  if (!visible) return null;

  return (
    <div className="mb-5 animate-fadeIn rounded-2xl border border-amber-400/20 p-4 sm:p-5" style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.06), rgba(139,92,246,0.04))' }}>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-xl flex-shrink-0">&#x1F9EA;</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display text-sm font-bold text-amber-300">You're an early adopter!</h3>
            <button
              onClick={handleDismiss}
              className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg border border-white/10 bg-white/5 text-xs text-white/50 hover:text-white"
              aria-label="Dismiss"
            >
              &#10005;
            </button>
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-white/55">
            PropLogAI is currently in <span className="font-semibold text-amber-300/80">beta</span> — we're actively building and improving every day.
            You may encounter occasional bugs or rough edges.
            If something feels off, let us know in the{' '}
            <Link href="/dashboard/support" className="font-semibold text-cyan-400 hover:underline">Feedback</Link>{' '}
            section — it genuinely helps us make this better for every trader.
          </p>
          <button
            onClick={handleDismiss}
            className="mt-3 rounded-lg border border-amber-400/20 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-300 transition-colors hover:bg-amber-500/20"
          >
            Let's journal
          </button>
        </div>
      </div>
    </div>
  );
}
