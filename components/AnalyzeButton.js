"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { analyzeTrade } from '@/app/dashboard/trades/actions';
import { useToast } from '@/components/Toast';

export default function AnalyzeButton({ tradeId, label }) {
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
        className="rounded-xl px-5 py-2.5 text-sm font-semibold text-[#08080f] disabled:opacity-60"
        style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}
      >
        {busy ? 'Analyzing…' : label || '✦ Analyze this trade'}
      </button>
      {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
    </div>
  );
}
