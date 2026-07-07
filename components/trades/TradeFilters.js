"use client";

import { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import TradeTable from '@/components/trades/TradeTable';
import { num } from '@/lib/stats';

const field = 'w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-cyan-400/60 sm:w-auto';

/* ─── Custom themed dropdown ───────────────────────────────── */
function FilterDropdown({ label, value, onChange, placeholder, options }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [open]);

  const displayValue = value || placeholder;

  return (
    <div ref={ref} className="relative">
      <label className="mb-1 block font-mono text-xs uppercase tracking-wider text-white/50">{label}</label>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={field + ' flex w-full cursor-pointer items-center justify-between gap-2 text-left sm:w-auto sm:min-w-[130px]'}
      >
        <span className={value ? 'text-white' : 'text-white/50'}>{displayValue}</span>
        <span className={'text-white/30 text-[10px] transition-transform ' + (open ? 'rotate-180' : '')}>&#9660;</span>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 min-w-full rounded-xl border border-white/10 bg-[#12121a] py-1 shadow-xl">
          <button
            type="button"
            onClick={() => { onChange(''); setOpen(false); }}
            className={'flex w-full items-center px-3.5 py-2 text-sm transition-colors ' +
              (!value ? 'bg-cyan-500/15 text-cyan-300 font-semibold' : 'text-white/70 hover:bg-white/[0.06] hover:text-white')}
          >
            {placeholder}
          </button>
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => { onChange(opt); setOpen(false); }}
              className={'flex w-full items-center px-3.5 py-2 text-sm transition-colors ' +
                (opt === value ? 'bg-cyan-500/15 text-cyan-300 font-semibold' : 'text-white/70 hover:bg-white/[0.06] hover:text-white')}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TradeFilters({ trades, prefs }) {
  const searchParams = useSearchParams();
  const urlEmotion = searchParams.get('emotion') || '';
  const urlSetup = searchParams.get('setup') || '';
  const urlSession = searchParams.get('session') || '';
  const urlTag = searchParams.get('tag') || '';
  const urlResult = searchParams.get('result') || '';
  const highlightTradeId = searchParams.get('tradeId') || '';

  const [result, setResult] = useState(urlResult || 'all'); // all | win | loss
  const [setupFilter, setSetupFilter] = useState(urlSetup);
  const [emotionFilter, setEmotionFilter] = useState(''); // resolved below after options computed
  const [sessionFilter, setSessionFilter] = useState(urlSession);
  const [tagFilter, setTagFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [hasLesson, setHasLesson] = useState(false);

  /* Scroll to highlighted trade on mount */
  useEffect(() => {
    if (highlightTradeId) {
      setTimeout(() => {
        const el = document.querySelector(`[data-trade-id="${highlightTradeId}"]`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('ring-2', 'ring-violet-400/50', 'bg-violet-400/[0.06]');
          setTimeout(() => {
            el.classList.remove('ring-2', 'ring-violet-400/50', 'bg-violet-400/[0.06]');
          }, 3000);
        }
      }, 300);
    }
  }, [highlightTradeId]);

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

  /* Resolve URL params to actual stored values (case-insensitive match) */
  useEffect(() => {
    if (urlEmotion && emotionOptions.length > 0 && !emotionFilter) {
      const match = emotionOptions.find(e => e.toLowerCase() === urlEmotion.toLowerCase());
      if (match) setEmotionFilter(match);
    }
  }, [urlEmotion, emotionOptions, emotionFilter]);

  useEffect(() => {
    if (urlTag && tagOptions.length > 0 && !tagFilter) {
      const match = tagOptions.find(t => t.toLowerCase() === urlTag.toLowerCase());
      if (match) setTagFilter(match);
    }
  }, [urlTag, tagOptions, tagFilter]);

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

      // Has lesson filter
      if (hasLesson) {
        if (!t._journal || !t._journal.hasLesson) return false;
      }

      // Date range
      const tDate = t.trade_date || (t.closed_at || t.created_at || '').slice(0, 10);
      if (dateFrom && tDate < dateFrom) return false;
      if (dateTo && tDate > dateTo) return false;

      return true;
    });
  }, [trades, result, setupFilter, emotionFilter, sessionFilter, tagFilter, hasLesson, dateFrom, dateTo]);

  const hasFilters = result !== 'all' || setupFilter || emotionFilter || sessionFilter || tagFilter || hasLesson || dateFrom || dateTo;

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
        <FilterDropdown label="Setup" value={setupFilter} onChange={setSetupFilter} placeholder="All setups" options={setupOptions} />

        {/* Emotion */}
        <FilterDropdown label="Emotion" value={emotionFilter} onChange={setEmotionFilter} placeholder="All emotions" options={emotionOptions} />

        {/* Session */}
        <FilterDropdown label="Session" value={sessionFilter} onChange={setSessionFilter} placeholder="All sessions" options={sessionOptions} />

        {/* Tag */}
        {tagOptions.length > 0 && (
          <FilterDropdown label="Tag" value={tagFilter} onChange={setTagFilter} placeholder="All tags" options={tagOptions} />
        )}

        {/* Has Lesson checkbox */}
        <div className="flex items-end pb-0.5">
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2.5">
            <input
              type="checkbox"
              checked={hasLesson}
              onChange={(e) => setHasLesson(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-white/30 bg-transparent accent-cyan-400"
            />
            <span className={'text-xs font-semibold ' + (hasLesson ? 'text-cyan-300' : 'text-white/55')}>Has lesson</span>
          </label>
        </div>

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
            onClick={() => { setResult('all'); setSetupFilter(''); setEmotionFilter(''); setSessionFilter(''); setTagFilter(''); setHasLesson(false); setDateFrom(''); setDateTo(''); }}
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

      <TradeTable rows={filtered} totalCount={trades ? trades.length : 0} />
    </div>
  );
}
