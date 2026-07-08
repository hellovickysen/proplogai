"use client";

import { useState } from 'react';

const gradientBtn = { background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' };

export default function AnalyzeButton({ tradeId }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleAnalyze() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/analyze-trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tradeId }),
      });
      let data;
      try { data = await res.json(); } catch { data = {}; }
      if (!res.ok || data.error) {
        setError(data.error || 'Failed (' + res.status + ')');
        setLoading(false);
      } else {
        window.location.reload();
      }
    } catch (e) {
      setError('Network error: ' + (e.message || 'Please try again'));
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleAnalyze}
        disabled={loading}
        className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold text-[#08080f] disabled:opacity-60 transition-transform hover:scale-[1.02] active:scale-[0.98]"
        style={gradientBtn}
      >
        {loading ? (
          <>
            <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#08080f]/30 border-t-[#08080f]" />
            Analyzing...
          </>
        ) : (
          <>&#10022; Analyze this trade</>
        )}
      </button>
      {error && (
        <p className="mt-2 text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}
