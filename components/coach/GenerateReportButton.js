"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { generateCoachReport } from '@/app/dashboard/coach/actions';

const FREE_LIMIT = 1;

export default function GenerateReportButton({ label, usedThisMonth = 0 }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function go() {
    setBusy(true);
    setError(null);
    const res = await generateCoachReport();
    if (res && res.error) {
      setError(res.error);
      setBusy(false);
    } else {
      router.refresh();
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <button
          onClick={go}
          disabled={busy}
          className="rounded-xl px-5 py-2.5 text-sm font-semibold text-[#08080f] disabled:opacity-60"
          style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}
        >
          {busy ? 'Generating…' : label || '✦ Generate report'}
        </button>
        <span className="font-mono text-[10px] text-white/40">{usedThisMonth}/{FREE_LIMIT} this month</span>
      </div>
      {usedThisMonth >= FREE_LIMIT && (
        <p className="mt-1.5 text-[11px] text-amber-300/70">
          ✦ Free limit reached — unlimited with Pro (coming soon)
        </p>
      )}
      {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
    </div>
  );
}
