"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { generateCoachReport } from '@/app/dashboard/coach/actions';

export default function GenerateReportButton({ label }) {
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
      <button
        onClick={go}
        disabled={busy}
        className="rounded-xl px-5 py-2.5 text-sm font-semibold text-[#08080f] disabled:opacity-60"
        style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}
      >
        {busy ? 'Generating…' : label || '✦ Generate report'}
      </button>
      {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
    </div>
  );
}
