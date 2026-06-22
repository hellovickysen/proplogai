"use client";

import { useState, useMemo } from 'react';
import TradeTable from '@/components/TradeTable';
import { num } from '@/lib/stats';

const field = 'rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-cyan-400/60';

export default function TradeFilters({ trades, prefs }) {
  const [result, setResult] = useState('all'); // all | win | loss
  const [setupFilter, setSetupFilter] = useState('');
  const [emotionFilter, setEmotionFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const setupOptions = useMemo(() => {
    const fromPrefs = (prefs && prefs.custom_setups) || [];
    const fromTrades = trades.map((t) => t.setup).filter(Boolean);
    return [...new Set([...fromPrefs, ...fromTrades])].sort();
  }, [trades, prefs]);

  const emotionOptions = useMemo(() => {
    const fromPrefs = (prefs && prefs.custom_emotions) || [];
    const fromTrades = trades.flatMap((t) => (t._journal && t._journal.emotions) || []);
    return [...new Set([...fromPrefs, ...fromTrades])].sort();
  }, [trades, prefs]);

  const filtered = useMemo(() => {
    return trades.filter((t) => {
      // Result filter
      if (result === 'win' && num(t.pnl) < 0) return false;
      if (result === 'loss' && num(t.pnl) >= 0) return false;

      // Setup filter
      if (setupFilter && t.setup !== setupFilter) return false;

      // Emotion filter
      if (emotionFilter) {
        const emotions = (t._journal && t._journal.emotions) || [];
        if (!emotions.includes(emotionFilter)) return false;
      }

      // Date range
      const tDate = t.trade_date || (t.closed_at || t.created_at || '').slice(0, 10);
      if (dateFrom && tDate < dateFrom) return false;
      if (dateTo && tDate > dateTo) return false;

      return true;
    });
  }, [trades, result, setupFilter, emotionFilter, dateFrom, dateTo]);

  const hasFilters = result !== 'all' || setupFilter || emotionFilter || dateFrom || dateTo;

  return (
    <div>
      {/* Filter bar */}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        {/* Result */}
        <div>
          <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-white/30">Result</label>
          <div className="flex gap-1">
            {[
              { v: 'all', l: 'All' },
              { v: 'win', l: 'Wins' },
              { v: 'loss', l: 'Losses' },
            ].map((o) => (
              <button
                key={o.v}
                onClick={() => setResult(o.v)}
                className={'rounded-lg border px-3 py-2 text-xs font-semibold ' + (result === o.v ? 'border-cyan-400/50 bg-cyan-500/10 text-cyan-300' : 'border-white/10 bg-black/30 text-white/40')}
              >
                {o.l}
              </button>
            ))}
          </div>
        </div>

        {/* Setup */}
        <div>
          <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-white/30">Setup</label>
          <select className={field} value={setupFilter} onChange={(e) => setSetupFilter(e.target.value)}>
            <option value="">All setups</option>
            {setupOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Emotion */}
        <div>
          <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-white/30">Emotion</label>
          <select className={field} value={emotionFilter} onChange={(e) => setEmotionFilter(e.target.value)}>
            <option value="">All emotions</option>
            {emotionOptions.map((em) => (
              <option key={em} value={em}>{em}</option>
            ))}
          </select>
        </div>

        {/* Date from */}
        <div>
          <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-white/30">From</label>
          <input type="date" className={field} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>

        {/* Date to */}
        <div>
          <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-white/30">To</label>
          <input type="date" className={field} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>

        {/* Clear */}
        {hasFilters && (
          <button
            onClick={() => { setResult('all'); setSetupFilter(''); setEmotionFilter(''); setDateFrom(''); setDateTo(''); }}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/40 hover:text-white"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Count */}
      {hasFilters && (
        <p className="mb-3 font-mono text-xs text-white/40">
          Showing {filtered.length} of {trades.length} trades
        </p>
      )}

      <TradeTable rows={filtered} />
    </div>
  );
}
