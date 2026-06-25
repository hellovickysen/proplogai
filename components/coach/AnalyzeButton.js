"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { analyzeTrade } from '@/app/dashboard/trades/actions';
import { useToast } from '@/components/ui/Toast';

const FREE_LIMIT = 3;

export default function AnalyzeButton({ tradeId, label, usedThisMonth = 0 }) {
  const toast = useToast();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function go() {
    setBusy(true);
    setError(null);
    const res = await analyzeTrade(tradeId);
    if (res && res.error) {
      setError(res.error);
      if (toast) toast.error(res.error);
      setBusy(false);
    } else {
      if (toast) toast.success('AI analysis complete!');
      if (typeof window !== 'undefined' && window.posthog) {
        window.posthog.capture('ai_analysis_run', { trade_id: tradeId });
      }
      router.refresh();
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        onClick={go}
        disabled={busy}
        className="rounded-xl px-5 py-3 text-sm font-semibold text-[#08080f] disabled:opacity-60"
        style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}
      >
        {busy ? 'Analyzing…' : label || '✦ Analyze this trade'}
      </button>
      <div className="mt-2 flex items-center gap-2">
        <div className="h-1.5 flex-1 rounded-full bg-white/10">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: Math.min(100, (usedThisMonth / FREE_LIMIT) * 100) + '%',
              background: usedThisMonth >= FREE_LIMIT
                ? 'linear-gradient(120deg, #f87171, #ef4444)'
                : 'linear-gradient(120deg, #a78bfa, #22d3ee)',
            }}
          />
        </div>
        <span className="font-mono text-[11px] text-white/50">{usedThisMonth}/{FREE_LIMIT} this month</span>
      </div>
      {usedThisMonth >= FREE_LIMIT && (
        <p className="mt-1.5 text-xs text-amber-300/70">
          ✦ Free limit reached — unlimited with Pro (coming soon)
        </p>
      )}
      {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
    </div>
  );
}
