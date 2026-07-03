"use client";

import { useState, useMemo } from 'react';
import TradeTable from '@/components/trades/TradeTable';
import { num } from '@/lib/stats';

const field = 'w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-cyan-400/60 sm:w-auto';

export default function TradeFilters({ trades, prefs }) {
  const [result, setResult] = useState('all'); // all | win | loss
  const [setupFilter, setSetupFilter] = useState('');
  const [emotionFilter, setEmotionFilter] = useState('');
  const [sessionFilter, setSessionFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const setupOptions = useMemo(() => {
    const fromPrefs = (prefs && prefs.custom_setups) || [];
    // Multi-setup: split comma-joined setup names from trades
    const fromTrades = trades.flatMap((t) => {
      if (!t.setup) return [];
      return t.setup.split(', ').filter(Boolean);
    });
    return [...new Set([...fromPrefs, ...fromTrades])].sort();
  }, [trades, prefs]);

  const emotionOptions = useMemo(() => {
    const fromPrefs = (prefs && prefs.custom_emotions) || [];
    const fromTrades = trades.flatMap((t) => (t._journal && t._journal.emotions) || []);
    return [...new Set([...fromPrefs, ...fromTrades])].sort();
  }, [trades, prefs]);

  const sessionOptions = useMemo(() => {
    const sessions = trades.map((t) => t.session).filter(Boolean);
    return [...new Set(sessions)].sort();
  }, [trades]);

  const tagOptions = useMemo(() => {
    const fromTrades = trades.flatMap((t) => (t._journal && t._journal.tags) || []);
    return [...new Set(fromTrades)].sort();
  }, [trades]);

  const filtered = useMemo(() => {
    return trades.filter((t) => {
      // Result filter
      if (result === 'win' && num(t.pnl) < 0) return false;
      if (result === 'loss' && num(t.pnl) >= 0) return false;

      // Setup filter — match any of the trade's setups
      if (setupFilter) {
        const tradeSetups = t.setup ? t.setup.split(', ') : [];
        if (!tradeSetups.includes(setupFilter)) return false;
      }

      // Emotion filter
      if (emotionFilter) {
        const emotions = (t._journal && t._journal.emotions) || [];
        if (!emotions.includes(emotionFilter)) return false;
      }

      // Session filter
      if (sessionFilter) {
        if (t.session !== sessionFilter) return false;
      }

      // Tag filter
      if (tagFilter) {
        const tags = (t._journal && t._journal.tags) || [];
        if (!tags.includes(tagFilter)) return false;
      }

      // Date range
      const tDate = t.trade_date || (t.closed_at || t.created_at || '').slice(0, 10);
      if (dateFrom && tDate < dateFrom) return false;
      if (dateTo && tDate > dateTo) return false;

      return true;
    });
  }, [trades, result, setupFilter, emotionFilter, sessionFilter, tagFilter, dateFrom, dateTo]);

  const hasFilters = result !== 'all' || setupFilter || emotionFilter || sessionFilter || tagFilter || dateFrom || dateTo;

  return (
    <div>
      {/* Filter bar */}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-end sm:gap-3">
        {/* Result — full width on mobile so buttons don't overlap Setup */}
        <div className="col-span-2 sm:col-span-1">
          <label className="mb-1 block font-mono text-xs uppercase tracking-wider text-white/50">Result</label>
          <div className="flex gap-1">
            {[
              { v: 'all', l: 'All' },
              { v: 'win', l: 'Wins' },
              { v: 'loss', l: 'Losses' },
            ].map((o) => (
              <button
                key={o.v}
                onClick={() => setResult(o.v)}
                className={'rounded-lg border px-3 py-2.5 text-xs font-semibold ' + (result === o.v ? 'border-cyan-400/50 bg-cyan-500/10 text-cyan-300' : 'border-white/10 bg-black/30 text-white/55')}
              >
                {o.l}
              </button>
            ))}
          </div>
        </div>

        {/* Setup */}
        <div>
          <label className="mb-1 block font-mono text-xs uppercase tracking-wider text-white/50">Setup</label>
          <select className={field} value={setupFilter} onChange={(e) => setSetupFilter(e.target.value)}>
            <option value="">All setups</option>
            {setupOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Emotion */}
        <div>
          <label className="mb-1 block font-mono text-xs uppercase tracking-wider text-white/50">Emotion</label>
          <select className={field} value={emotionFilter} onChange={(e) => setEmotionFilter(e.target.value)}>
            <option value="">All emotions</option>
            {emotionOptions.map((em) => (
              <option key={em} value={em}>{em}</option>
            ))}
          </select>
        </div>

        {/* Session */}
        <div>
          <label className="mb-1 block font-mono text-xs uppercase tracking-wider text-white/50">Session</label>
          <select className={field} value={sessionFilter} onChange={(e) => setSessionFilter(e.target.value)}>
            <option value="">All sessions</option>
            {sessionOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Tag */}
        {tagOptions.length > 0 && (
          <div>
            <label className="mb-1 block font-mono text-xs uppercase tracking-wider text-white/50">Tag</label>
            <select className={field} value={tagFilter} onChange={(e) => setTagFilter(e.target.value)}>
              <option value="">All tags</option>
              {tagOptions.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        )}

        {/* Date from */}
        <div>
          <label className="mb-1 block font-mono text-xs uppercase tracking-wider text-white/50">From</label>
          <input type="date" className={field} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>

        {/* Date to */}
        <div>
          <label className="mb-1 block font-mono text-xs uppercase tracking-wider text-white/50">To</label>
          <input type="date" className={field} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>

        {/* Clear */}
        {hasFilters && (
          <button
            onClick={() => { setResult('all'); setSetupFilter(''); setEmotionFilter(''); setSessionFilter(''); setTagFilter(''); setDateFrom(''); setDateTo(''); }}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-white/55 hover:text-white"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Count */}
      {hasFilters && (
        <p className="mb-3 font-mono text-xs text-white/55">
          Showing {filtered.length} of {trades.length} trades
        </p>
      )}

      <TradeTable rows={filtered} />
    </div>
  );
}
