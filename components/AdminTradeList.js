"use client";

import { useState, useMemo } from 'react';
import { num } from '@/lib/stats';

function fmtMoney(v) {
  const n = Number(v) || 0;
  const sign = n >= 0 ? '+' : '-';
  return sign + '$' + Math.abs(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function Pill({ children, color = 'violet' }) {
  const colors = {
    violet: 'border-violet-400/25 bg-violet-500/10 text-violet-200',
    cyan: 'border-cyan-400/25 bg-cyan-500/10 text-cyan-200',
  };
  return <span className={'rounded-full border px-2 py-0.5 text-[10px] ' + (colors[color] || colors.violet)}>{children}</span>;
}

export default function AdminTradeList({ trades, jmap }) {
  const [filter, setFilter] = useState('all'); // all | win | loss | journaled

  const filtered = useMemo(() => {
    return trades.filter((t) => {
      if (filter === 'win' && num(t.pnl) < 0) return false;
      if (filter === 'loss' && num(t.pnl) >= 0) return false;
      if (filter === 'journaled' && !jmap[t.id]) return false;
      return true;
    });
  }, [trades, filter, jmap]);

  return (
    <div>
      {/* Filter bar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {[
          { v: 'all', l: 'All (' + trades.length + ')' },
          { v: 'win', l: 'Wins' },
          { v: 'loss', l: 'Losses' },
          { v: 'journaled', l: 'With Journal' },
        ].map((o) => (
          <button
            key={o.v}
            onClick={() => setFilter(o.v)}
            className={'rounded-lg border px-3 py-1.5 text-xs font-semibold ' + (filter === o.v ? 'border-cyan-400/50 bg-cyan-500/10 text-cyan-300' : 'border-white/10 bg-black/30 text-white/50')}
          >
            {o.l}
          </button>
        ))}
        {filter !== 'all' && (
          <span className="ml-2 font-mono text-xs text-white/40">{filtered.length} shown</span>
        )}
      </div>

      {/* Trade cards */}
      <div className="space-y-3">
        {filtered.map((t) => {
          const win = num(t.pnl) >= 0;
          const j = jmap[t.id];
          const screenshots = j ? (
            Array.isArray(j.screenshot_urls) && j.screenshot_urls.filter(Boolean).length > 0
              ? j.screenshot_urls.filter(Boolean)
              : j.screenshot_url ? [j.screenshot_url] : []
          ) : [];

          return (
            <div key={t.id} className={'rounded-xl border p-4 ' + (win ? 'border-emerald-400/15 bg-emerald-500/[0.03]' : 'border-red-400/15 bg-red-500/[0.03]')}>
              {/* Trade header */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-display font-semibold">{t.pair}</span>
                  <span className={'rounded px-2 py-0.5 font-mono text-[10px] ' + (t.direction === 'long' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300')}>
                    {(t.direction || '').toUpperCase()}
                  </span>
                  {t.setup && <Pill color="cyan">{t.setup}</Pill>}
                  {t.session && <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-white/45">{t.session}</span>}
                </div>
                <div className="flex items-center gap-3">
                  <span className={'font-mono text-base font-bold ' + (win ? 'text-emerald-400' : 'text-red-400')}>{fmtMoney(t.pnl)}</span>
                  <span className="font-mono text-xs text-white/40">{t.trade_date || '—'}</span>
                </div>
              </div>

              {/* Price details grid */}
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                {t.entry_price != null && <span className="text-white/45">Entry: <span className="font-mono text-white/65">{t.entry_price}</span></span>}
                {t.exit_price != null && <span className="text-white/45">Exit: <span className="font-mono text-white/65">{t.exit_price}</span></span>}
                {t.stop_loss != null && <span className="text-white/45">SL: <span className="font-mono text-white/65">{t.stop_loss}</span></span>}
                {t.take_profit != null && <span className="text-white/45">TP: <span className="font-mono text-white/65">{t.take_profit}</span></span>}
                {t.lot_size != null && <span className="text-white/45">Lot: <span className="font-mono text-white/65">{t.lot_size}</span></span>}
                {t.timeframe && <span className="text-white/45">TF: <span className="font-mono text-white/65">{t.timeframe}</span></span>}
                {t.r_multiple != null && <span className="text-white/45">R: <span className="font-mono text-white/65">{t.r_multiple}</span></span>}
              </div>

              {/* Journal details */}
              {j ? (
                <div className="mt-3 border-t border-white/[0.06] pt-3">
                  {j.emotions?.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1">
                      {j.emotions.map((em, i) => <Pill key={i} color="violet">{em}</Pill>)}
                    </div>
                  )}
                  {j.confidence > 0 && (
                    <div className="mb-2 flex gap-0.5 text-sm">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <span key={i} className={i <= j.confidence ? 'text-amber-400' : 'text-white/20'}>★</span>
                      ))}
                    </div>
                  )}
                  {j.note && (
                    <p className="mb-2 whitespace-pre-wrap rounded-lg bg-black/20 p-3 text-sm leading-relaxed text-white/65">{j.note}</p>
                  )}
                  {screenshots.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {screenshots.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block">
                          <img src={url} alt={`Screenshot ${i + 1}`} className="h-32 max-w-xs rounded-lg border border-white/10 object-contain transition-opacity hover:opacity-80" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-2 text-[10px] text-white/25">No journal</div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="py-6 text-center text-white/40">No trades match this filter.</div>
        )}
      </div>
    </div>
  );
}
