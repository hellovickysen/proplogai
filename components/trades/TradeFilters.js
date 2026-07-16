"use client";

import { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import TradeTable from '@/components/trades/TradeTable';
import { num } from '@/lib/stats';

const field = 'w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-cyan-400/60 sm:w-auto';

/* ─── Custom themed dropdown (single-select) ──────────────── */
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

/* ─── Multi-select dropdown (toggle tags on/off) ──────────── */
function MultiFilterDropdown({ label, selected, onChange, placeholder, options }) {
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

  const toggle = (opt) => {
    if (selected.includes(opt)) {
      onChange(selected.filter((s) => s !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };

  return (
    <div ref={ref} className="relative">
      <label className="mb-1 block font-mono text-xs uppercase tracking-wider text-white/50">{label}</label>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={field + ' flex w-full cursor-pointer items-center justify-between gap-2 text-left sm:w-auto sm:min-w-[130px]'}
      >
        {selected.length > 0 ? (
          <span className="flex items-center gap-1 text-white">
            <span className="truncate max-w-[80px]">{selected[0]}</span>
            {selected.length > 1 && (
              <span className="rounded-full bg-cyan-500/20 px-1.5 text-[10px] font-bold text-cyan-300">+{selected.length - 1}</span>
            )}
          </span>
        ) : (
          <span className="text-white/50">{placeholder}</span>
        )}
        <span className={'text-white/30 text-[10px] transition-transform ' + (open ? 'rotate-180' : '')}>&#9660;</span>
      </button>
      {/* Selected pills below the button */}
      {selected.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {selected.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2 py-0.5 text-[11px] text-cyan-200"
            >
              {tag}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); toggle(tag); }}
                className="ml-0.5 text-cyan-300/60 hover:text-cyan-200 text-xs leading-none"
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      )}
      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 min-w-full rounded-xl border border-white/10 bg-[#12121a] py-1 shadow-xl max-h-52 overflow-y-auto">
          {selected.length > 0 && (
            <button
              type="button"
              onClick={() => { onChange([]); setOpen(false); }}
              className="flex w-full items-center px-3.5 py-2 text-sm text-white/40 hover:bg-white/[0.06] hover:text-white/70 border-b border-white/5"
            >
              Clear all
            </button>
          )}
          {options.map((opt) => {
            const isSelected = selected.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                onClick={() => toggle(opt)}
                className={'flex w-full items-center gap-2 px-3.5 py-2 text-sm transition-colors ' +
                  (isSelected ? 'bg-cyan-500/15 text-cyan-300 font-semibold' : 'text-white/70 hover:bg-white/[0.06] hover:text-white')}
              >
                <span className={'flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border transition-all ' +
                  (isSelected ? 'border-cyan-400 bg-cyan-400' : 'border-white/30 bg-transparent')}>
                  {isSelected && (
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#08080f" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                  )}
                </span>
                {opt}
              </button>
            );
          })}
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
  const [tagFilter, setTagFilter] = useState([]); // multi-select: array of tag strings
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [hasLesson, setHasLesson] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  /* Refs to ensure URL params are only applied once (not re-applied after clear) */
  const emotionUrlApplied = useRef(false);
  const tagUrlApplied = useRef(false);

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

  /* Resolve URL params to actual stored values — only once per mount */
  useEffect(() => {
    if (urlEmotion && emotionOptions.length > 0 && !emotionUrlApplied.current) {
      const match = emotionOptions.find(e => e.toLowerCase() === urlEmotion.toLowerCase());
      if (match) {
        setEmotionFilter(match);
        emotionUrlApplied.current = true;
      }
    }
  }, [urlEmotion, emotionOptions]);

  /* Backward compat: single ?tag= URL param seeds the multi-tag array — only once */
  useEffect(() => {
    if (urlTag && tagOptions.length > 0 && !tagUrlApplied.current) {
      const match = tagOptions.find(t => t.toLowerCase() === urlTag.toLowerCase());
      if (match) {
        setTagFilter([match]);
        tagUrlApplied.current = true;
      }
    }
  }, [urlTag, tagOptions]);

  /* Stamp absolute trade number BEFORE filtering so it survives filters */
  const numberedTrades = useMemo(() =>
    trades.map((t, i) => ({ ...t, _tradeNum: trades.length - i })),
    [trades]
  );

  const filtered = useMemo(() => {
    return numberedTrades.filter((t) => {
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

      // Tag filter — multi-select, match ANY selected tag
      if (tagFilter.length > 0) {
        const tags = (t._journal && t._journal.tags) || [];
        if (!tagFilter.some((tf) => tags.includes(tf))) return false;
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
  }, [numberedTrades, result, setupFilter, emotionFilter, sessionFilter, tagFilter, hasLesson, dateFrom, dateTo]);

  const hasFilters = result !== 'all' || setupFilter || emotionFilter || sessionFilter || tagFilter.length > 0 || hasLesson || dateFrom || dateTo;
  const activeFilterCount = [setupFilter, emotionFilter, sessionFilter, tagFilter.length > 0, hasLesson, dateFrom, dateTo].filter(Boolean).length;

  const resultButtons = [
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
  ));

  return (
    <div>
      {/* ── Desktop: single-row flex-wrap with all filters inline ── */}
      <div className="mb-4 hidden sm:flex sm:flex-wrap sm:items-end sm:gap-3">
        {/* Result */}
        <div>
          <label className="mb-1 block font-mono text-xs uppercase tracking-wider text-white/50">Result</label>
          <div className="flex gap-1">{resultButtons}</div>
        </div>
        <FilterDropdown label="Setup" value={setupFilter} onChange={setSetupFilter} placeholder="All setups" options={setupOptions} />
        <FilterDropdown label="Emotion" value={emotionFilter} onChange={setEmotionFilter} placeholder="All emotions" options={emotionOptions} />
        <FilterDropdown label="Session" value={sessionFilter} onChange={setSessionFilter} placeholder="All sessions" options={sessionOptions} />
        {tagOptions.length > 0 && (
          <MultiFilterDropdown label="Tags" selected={tagFilter} onChange={setTagFilter} placeholder="All tags" options={tagOptions} />
        )}
        <div className="flex items-end pb-0.5">
          <button type="button" onClick={() => setHasLesson(v => !v)} className={'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 transition-all ' + (hasLesson ? 'border-violet-400/30 bg-violet-400/[0.08]' : 'border-white/10 bg-black/30 hover:border-white/20')}>
            <span className={'flex h-4 w-4 items-center justify-center rounded border transition-all ' + (hasLesson ? 'border-violet-400 bg-violet-400' : 'border-white/30 bg-transparent')}>
              {hasLesson && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#08080f" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>}
            </span>
            <span className={'text-xs font-semibold ' + (hasLesson ? 'text-violet-300' : 'text-white/55')}>Has lesson</span>
          </button>
        </div>
        <div>
          <label className="mb-1 block font-mono text-xs uppercase tracking-wider text-white/50">From</label>
          <input type="date" className={field} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block font-mono text-xs uppercase tracking-wider text-white/50">To</label>
          <input type="date" className={field} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
        {hasFilters && (
          <button onClick={() => { setResult('all'); setSetupFilter(''); setEmotionFilter(''); setSessionFilter(''); setTagFilter([]); setHasLesson(false); setDateFrom(''); setDateTo(''); }} className="rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-3 py-2.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition-colors">Clear filters</button>
        )}
      </div>

      {/* ── Mobile: tabs + collapsible filters ── */}
      <div className="sm:hidden">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex gap-1">{resultButtons}</div>
          <button
            onClick={() => setFiltersOpen(o => !o)}
            className={'flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-all ' +
              (activeFilterCount > 0 || filtersOpen ? 'border-violet-400/30 bg-violet-400/[0.08] text-violet-300' : 'border-white/10 bg-black/30 text-white/55')}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" /></svg>
            Filters
            {activeFilterCount > 0 && <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-violet-400 px-1 text-[10px] font-bold text-[#08080f]">{activeFilterCount}</span>}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={'transition-transform ' + (filtersOpen ? 'rotate-180' : '')}><path d="M6 9l6 6 6-6" /></svg>
          </button>
        </div>
        {filtersOpen && (
          <div className="mb-4 grid grid-cols-2 gap-2">
            <FilterDropdown label="Setup" value={setupFilter} onChange={setSetupFilter} placeholder="All setups" options={setupOptions} />
            <FilterDropdown label="Emotion" value={emotionFilter} onChange={setEmotionFilter} placeholder="All emotions" options={emotionOptions} />
            <FilterDropdown label="Session" value={sessionFilter} onChange={setSessionFilter} placeholder="All sessions" options={sessionOptions} />
            {tagOptions.length > 0 && <MultiFilterDropdown label="Tags" selected={tagFilter} onChange={setTagFilter} placeholder="All tags" options={tagOptions} />}
            <div className="flex items-end pb-0.5">
              <button type="button" onClick={() => setHasLesson(v => !v)} className={'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 transition-all ' + (hasLesson ? 'border-violet-400/30 bg-violet-400/[0.08]' : 'border-white/10 bg-black/30 hover:border-white/20')}>
                <span className={'flex h-4 w-4 items-center justify-center rounded border transition-all ' + (hasLesson ? 'border-violet-400 bg-violet-400' : 'border-white/30 bg-transparent')}>
                  {hasLesson && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#08080f" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>}
                </span>
                <span className={'text-xs font-semibold ' + (hasLesson ? 'text-violet-300' : 'text-white/55')}>Has lesson</span>
              </button>
            </div>
            <div>
              <label className="mb-1 block font-mono text-xs uppercase tracking-wider text-white/50">From</label>
              <input type="date" className={field} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block font-mono text-xs uppercase tracking-wider text-white/50">To</label>
              <input type="date" className={field} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
            {hasFilters && (
              <button onClick={() => { setResult('all'); setSetupFilter(''); setEmotionFilter(''); setSessionFilter(''); setTagFilter([]); setHasLesson(false); setDateFrom(''); setDateTo(''); setFiltersOpen(false); }} className="col-span-2 rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-3 py-2.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition-colors">Clear filters</button>
            )}
          </div>
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
