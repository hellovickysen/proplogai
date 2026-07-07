"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const TYPE_CONFIG = {
  trade: { emoji: '📈', lossEmoji: '📉', bg: 'bg-emerald-400/10', lossBg: 'bg-red-400/10' },
  journal: { emoji: '📝', bg: 'bg-violet-400/10' },
  coach: { emoji: '🤖', bg: 'bg-cyan-400/10' },
  setup: { emoji: '⚡', bg: 'bg-amber-400/10' },
  expense: { emoji: '💳', bg: 'bg-red-400/10' },
  trophy: { emoji: '🏆', bg: 'bg-amber-400/10' },
};

const GROUP_LABELS = {
  trades: 'Trades',
  journal: 'Journal',
  coach: 'Coach',
  setups: 'Setups',
  expenses: 'Expenses',
  trophies: 'Trophies',
};

export default function MobileSearchBar() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const doSearch = useCallback(async (q) => {
    if (!q.trim()) { setResults(null); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&filter=all`);
      if (res.ok) setResults(await res.json());
    } catch (e) {}
    setLoading(false);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, doSearch]);

  function close() { setOpen(false); setQuery(''); setResults(null); }

  function navigateTo(item) {
    close();
    if (item.href) router.push(item.href);
  }

  const flatResults = results ? Object.values(results.grouped || {}).flat() : [];

  return (
    <>
      {/* Search icon button */}
      <button
        onClick={() => setOpen(true)}
        className="grid h-11 w-11 place-items-center rounded-lg border border-white/10 bg-white/5 text-white/60"
        aria-label="Search"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
        </svg>
      </button>

      {/* Fullscreen overlay */}
      {open && (
        <div className="fixed inset-0 z-[999] bg-[#07070b] flex flex-col">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.07]">
            <svg className="text-white/25 flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search trades, journal…"
              className="flex-1 bg-transparent border-none outline-none font-[Poppins] text-[15px] text-white placeholder:text-white/25"
            />
            <button onClick={close} className="text-sm text-white/40 px-2 py-1 rounded-lg hover:bg-white/[0.05]">
              Cancel
            </button>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center py-12 text-white/30 text-sm">
                <span className="animate-spin mr-2">⟳</span> Searching…
              </div>
            )}

            {!loading && !query.trim() && (
              <div className="text-center py-12">
                <div className="text-3xl mb-3 opacity-30">🔍</div>
                <div className="text-sm text-white/35">Search your trading journal</div>
              </div>
            )}

            {!loading && query.trim() && flatResults.length === 0 && (
              <div className="text-center py-12">
                <div className="text-2xl mb-2 opacity-30">🔍</div>
                <div className="text-sm text-white/40">No results</div>
              </div>
            )}

            {!loading && flatResults.length > 0 && (
              <>
                {Object.entries(results.grouped).map(([group, items]) => {
                  if (!items || items.length === 0) return null;
                  return (
                    <div key={group}>
                      <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-white/25 px-4 pt-3 pb-1.5">
                        {GROUP_LABELS[group] || group} · {items.length}
                      </div>
                      {items.map(item => {
                        const isLoss = item.pnl != null && Number(item.pnl) < 0;
                        const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.trade;
                        return (
                          <div
                            key={`${item.type}-${item.id}`}
                            onClick={() => navigateTo(item)}
                            className="flex items-center gap-3 px-4 py-2.5 active:bg-white/[0.04]"
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${isLoss ? cfg.lossBg || cfg.bg : cfg.bg}`}>
                              {isLoss && cfg.lossEmoji ? cfg.lossEmoji : cfg.emoji}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[13px] font-medium text-white/80 truncate">{item.title}</div>
                              <div className="text-[10px] text-white/30 mt-0.5 flex items-center gap-1.5">
                                <span>{item.subtitle}</span>
                                {item.direction && (
                                  <span className={`font-mono text-[8px] px-1.5 py-0.5 rounded uppercase ${
                                    item.direction === 'long' ? 'bg-blue-400/[0.12] text-blue-400' : 'bg-red-400/[0.12] text-red-400'
                                  }`}>{item.direction}</span>
                                )}
                              </div>
                            </div>
                            {item.pnl != null && (
                              <span className={`flex-shrink-0 font-mono text-[12px] font-medium ${
                                Number(item.pnl) >= 0 ? 'text-emerald-400' : 'text-red-400'
                              }`}>
                                {Number(item.pnl) >= 0 ? '+' : '-'}${Math.abs(Number(item.pnl)).toFixed(0)}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
