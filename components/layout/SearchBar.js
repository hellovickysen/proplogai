"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'trades', label: 'Trades' },
  { key: 'journal', label: 'Journal' },
  { key: 'coach', label: 'Coach' },
  { key: 'setups', label: 'Setups' },
  { key: 'expenses', label: 'Expenses' },
  { key: 'trophies', label: 'Trophies' },
];

const TYPE_CONFIG = {
  trade: { emoji: '📈', lossEmoji: '📉', color: 'text-emerald-400', lossColor: 'text-red-400', bg: 'bg-emerald-400/10', lossBg: 'bg-red-400/10' },
  journal: { emoji: '📝', color: 'text-violet-400', bg: 'bg-violet-400/10' },
  coach: { emoji: '🤖', color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
  setup: { emoji: '⚡', color: 'text-amber-400', bg: 'bg-amber-400/10' },
  expense: { emoji: '💳', color: 'text-red-400', bg: 'bg-red-400/10' },
  trophy: { emoji: '🏆', color: 'text-amber-400', bg: 'bg-amber-400/10' },
};

const GROUP_LABELS = {
  trades: 'Trades',
  journal: 'Journal Notes',
  coach: 'Coach Reports',
  setups: 'Setups',
  expenses: 'Expenses',
  trophies: 'Trophies',
};

const GROUP_HREFS = {
  trades: '/dashboard/trades',
  journal: '/dashboard/trades',
  coach: '/dashboard/coach',
  setups: '/dashboard/rulebook',
  expenses: '/dashboard/expenses',
  trophies: '/dashboard/trophies',
};

/** Detect if query is natural language (should use AI parse) */
function isNaturalLanguage(q) {
  if (!q || q.length < 4) return false;
  const nlWords = /\b(my|show|find|when|where|why|what|how|losing|winning|worst|best|trades?\s+where|trades?\s+when|felt|emotion|broke|followed|didnt|didn't)\b/i;
  return nlWords.test(q) || q.split(/\s+/).length >= 4;
}

export default function SearchBar({ planAccess }) {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [aiFilters, setAiFilters] = useState(null);
  const [elapsed, setElapsed] = useState(0);

  const inputRef = useRef(null);
  const wrapRef = useRef(null);
  const debounceRef = useRef(null);
  const router = useRouter();

  const isElite = planAccess?.plan === 'elite' || planAccess?.isAdmin || planAccess?.isBeta;

  // Flatten results for keyboard nav
  const flatResults = results
    ? Object.values(results.grouped || {}).flat()
    : [];

  // Close on click outside
  useEffect(() => {
    function handleClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Cmd+K shortcut
  useEffect(() => {
    function handleKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  // Search function
  const doSearch = useCallback(async (q, filter) => {
    if (!q.trim()) {
      setResults(null);
      setAiFilters(null);
      return;
    }

    setLoading(true);
    setSelectedIndex(0);

    let searchFilters = {};
    let usedAI = false;

    // Try AI parse for natural language queries (Elite only)
    if (isElite && isNaturalLanguage(q)) {
      try {
        const aiRes = await fetch('/api/search/ai-parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: q }),
        });
        if (aiRes.ok) {
          const aiData = await aiRes.json();
          if (aiData.isAI && Object.keys(aiData.filters).length > 0) {
            searchFilters = aiData.filters;
            usedAI = true;
            setAiFilters(aiData.filters);
          }
        }
      } catch (e) {
        // Fallback to keyword search
      }
    }

    if (!usedAI) {
      setAiFilters(null);
    }

    // Build search URL
    const params = new URLSearchParams({ q: searchFilters.keyword || q, filter });
    Object.entries(searchFilters).forEach(([k, v]) => {
      if (k !== 'keyword' && v) params.set(k, v);
    });

    try {
      const res = await fetch(`/api/search?${params}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
        setElapsed(data.elapsed || 0);
      }
    } catch (e) {
      console.error('Search failed:', e);
    }

    setLoading(false);
  }, [isElite]);

  // Debounced search on query change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doSearch(query, activeFilter);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, activeFilter, doSearch]);

  // Keyboard navigation
  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, flatResults.length - 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    }
    if (e.key === 'Enter' && flatResults[selectedIndex]) {
      e.preventDefault();
      navigateToResult(flatResults[selectedIndex]);
    }
  }

  function navigateToResult(item) {
    setOpen(false);
    setQuery('');
    if (item.href) router.push(item.href);
  }

  function formatPnl(pnl) {
    if (pnl == null) return null;
    const val = Number(pnl);
    const sign = val >= 0 ? '+' : '-';
    return `${sign}$${Math.abs(val).toFixed(0)}`;
  }

  const hasResults = results && results.total > 0;
  const showDropdown = open && query.trim().length > 0;

  return (
    <div ref={wrapRef} className="relative flex-1 max-w-[600px] mx-auto hidden sm:block">
      {/* Search input */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => { if (query.trim()) setOpen(true); }}
          onKeyDown={handleKeyDown}
          placeholder="Search trades, journal, setups… or ask a question"
          className="w-full h-9 bg-white/[0.04] border border-white/[0.08] rounded-[10px] pl-9 pr-14 font-[Poppins] text-[13px] text-white placeholder:text-white/25 outline-none transition-all focus:border-violet-400/40 focus:bg-white/[0.06] focus:shadow-[0_0_0_3px_rgba(167,139,250,0.08)]"
        />
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex gap-1">
          <kbd className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] text-white/25">⌘K</kbd>
        </div>
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute top-[44px] left-0 right-0 bg-[#0e0e18] border border-white/10 rounded-xl shadow-[0_16px_48px_rgba(0,0,0,0.5)] z-50 overflow-hidden">
          {/* Filter chips */}
          <div className="flex gap-1 px-3 py-2 border-b border-white/[0.05] overflow-x-auto">
            {FILTERS.map(f => {
              const count = f.key === 'all'
                ? (results?.total || 0)
                : (results?.grouped?.[f.key]?.length || 0);
              const isActive = activeFilter === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => setActiveFilter(f.key)}
                  className={`font-[Poppins] text-[10px] font-medium px-2.5 py-1 rounded-md border whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-violet-400/[0.12] border-violet-400/30 text-violet-300'
                      : 'bg-white/[0.03] border-white/[0.08] text-white/45 hover:border-white/15 hover:text-white/60'
                  }`}
                >
                  {f.label}
                  {count > 0 && <span className="font-mono text-[8px] ml-1 opacity-60">{count}</span>}
                </button>
              );
            })}
          </div>

          {/* AI filter badges */}
          {aiFilters && Object.keys(aiFilters).length > 0 && (
            <>
              <div className="flex items-center gap-1.5 mx-3 mt-2 mb-1">
                <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider px-2 py-1 rounded-md bg-gradient-to-r from-violet-400/[0.12] to-cyan-400/[0.12] border border-violet-400/20 text-violet-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                  Propol parsed your query
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 px-3 pb-2">
                {Object.entries(aiFilters).filter(([k]) => k !== 'keyword').map(([key, val]) => (
                  <span key={key} className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md bg-cyan-400/[0.08] border border-cyan-400/20 text-cyan-300">
                    <span className="font-mono text-[9px] uppercase text-cyan-400/60">{key}</span>
                    {val}
                  </span>
                ))}
              </div>
            </>
          )}

          {/* Results */}
          <div className="max-h-[320px] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
            {loading && (
              <div className="flex items-center justify-center py-8 text-white/30 text-sm">
                <span className="animate-spin mr-2">⟳</span> Searching…
              </div>
            )}

            {!loading && !hasResults && query.trim() && (
              <div className="text-center py-8">
                <div className="text-2xl mb-2 opacity-30">🔍</div>
                <div className="text-sm text-white/40">No results for "{query}"</div>
                <div className="text-xs text-white/25 mt-1">Try a different search term</div>
              </div>
            )}

            {!loading && hasResults && (
              <>
                {Object.entries(results.grouped).map(([group, items]) => {
                  if (!items || items.length === 0) return null;
                  return (
                    <div key={group}>
                      <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-white/25 px-3 pt-2 pb-1">
                        {GROUP_LABELS[group] || group} · {items.length}
                      </div>
                      {items.map((item, idx) => {
                        const globalIdx = flatResults.indexOf(item);
                        const isLoss = item.pnl != null && Number(item.pnl) < 0;
                        const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.trade;
                        const isSelected = globalIdx === selectedIndex;

                        return (
                          <div
                            key={`${item.type}-${item.id}`}
                            onClick={() => navigateToResult(item)}
                            className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer transition-colors ${
                              isSelected ? 'bg-white/[0.04] border-l-2 border-violet-400 pl-2.5' : 'hover:bg-white/[0.03]'
                            }`}
                          >
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs flex-shrink-0 ${isLoss ? cfg.lossBg || cfg.bg : cfg.bg}`}>
                              {isLoss && cfg.lossEmoji ? cfg.lossEmoji : cfg.emoji}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium text-white/80 truncate">
                                {highlightMatch(item.title, query)}
                              </div>
                              <div className="text-[10px] text-white/30 mt-0.5 flex items-center gap-1.5">
                                <span>{item.subtitle}</span>
                                {item.direction && (
                                  <span className={`font-mono text-[8px] px-1.5 py-0.5 rounded uppercase ${
                                    item.direction === 'long' ? 'bg-blue-400/[0.12] text-blue-400' : 'bg-red-400/[0.12] text-red-400'
                                  }`}>{item.direction}</span>
                                )}
                                {item.emotions?.length > 0 && (
                                  <span className="font-mono text-[8px] px-1.5 py-0.5 rounded bg-violet-400/[0.12] text-violet-300">
                                    {item.emotions[0]}
                                  </span>
                                )}
                                {item.emotion && !item.emotions?.length && (
                                  <span className="font-mono text-[8px] px-1.5 py-0.5 rounded bg-violet-400/[0.12] text-violet-300">
                                    {item.emotion}
                                  </span>
                                )}
                                {item.tag && (
                                  <span className="font-mono text-[8px] px-1.5 py-0.5 rounded bg-cyan-400/[0.1] text-cyan-300">
                                    #{item.tag}
                                  </span>
                                )}
                                {item.pair && item.type === 'journal' && (
                                  <span className="font-mono text-[8px] px-1.5 py-0.5 rounded bg-white/[0.06] text-white/40">
                                    {item.pair}
                                  </span>
                                )}
                              </div>
                            </div>
                            {item.pnl != null && (
                              <span className={`flex-shrink-0 font-mono text-[11px] font-medium ${
                                Number(item.pnl) >= 0 ? 'text-emerald-400' : 'text-red-400'
                              }`}>
                                {formatPnl(item.pnl)}
                              </span>
                            )}
                          </div>
                        );
                      })}
                      {items.length >= 2 && GROUP_HREFS[group] && (
                        <div
                          onClick={() => {
                            setOpen(false); setQuery('');
                            // Smart param: use emotion/tag filter if detected, otherwise search text
                            const firstItem = items[0] || {};
                            let params = '';
                            if (firstItem.emotion) params = `?emotion=${encodeURIComponent(firstItem.emotion)}`;
                            else if (firstItem.tag) params = `?tag=${encodeURIComponent(firstItem.tag)}`;
                            else if (query) params = `?search=${encodeURIComponent(query)}`;
                            router.push(GROUP_HREFS[group] + params);
                          }}
                          className="px-3 py-1.5 text-[11px] text-violet-400/60 hover:text-violet-400 cursor-pointer transition-colors"
                        >
                          View all {GROUP_LABELS[group]?.toLowerCase() || group} →
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-3 py-1.5 border-t border-white/[0.05] bg-white/[0.02]">
            <div className="flex gap-2.5">
              <span className="text-[10px] text-white/25 flex items-center gap-1">
                <kbd className="font-mono text-[8px] px-1 py-0.5 rounded bg-white/[0.05] border border-white/[0.08] text-white/25">↑↓</kbd>
                nav
              </span>
              <span className="text-[10px] text-white/25 flex items-center gap-1">
                <kbd className="font-mono text-[8px] px-1 py-0.5 rounded bg-white/[0.05] border border-white/[0.08] text-white/25">↵</kbd>
                open
              </span>
              <span className="text-[10px] text-white/25 flex items-center gap-1">
                <kbd className="font-mono text-[8px] px-1 py-0.5 rounded bg-white/[0.05] border border-white/[0.08] text-white/25">esc</kbd>
                close
              </span>
            </div>
            <div className="text-[10px] text-white/20">
              {hasResults && !aiFilters && <>{results.total} results · {elapsed}ms</>}
              {hasResults && aiFilters && <><span className="text-violet-400">✦</span> AI · {results.total} results</>}
              {!hasResults && !loading && query.trim() && <>No results</>}
              {!isElite && (
                <span className="ml-2 font-mono text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-gradient-to-r from-violet-400/20 to-cyan-400/20 text-violet-300">
                  Elite: AI search
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Highlight matching text */
function highlightMatch(text, query) {
  if (!query || !text) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.substring(0, idx)}
      <mark className="bg-violet-400/25 text-violet-100 rounded px-0.5">{text.substring(idx, idx + query.length)}</mark>
      {text.substring(idx + query.length)}
    </>
  );
}
