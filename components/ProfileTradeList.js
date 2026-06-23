"use client";

import { useState } from 'react';

function fmtMoney(v) {
  const n = Number(v) || 0;
  const sign = n >= 0 ? '+' : '-';
  return sign + '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(d) {
  if (!d) return '—';
  try { return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
  catch { return '—'; }
}

export default function ProfileTradeList({ trades }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? trades : trades.slice(0, 10);
  const hasMore = trades.length > 10;

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[500px] border-collapse text-sm">
          <thead>
            <tr className="text-left font-mono text-[10px] uppercase tracking-wider text-white/40">
              <th className="px-3 pb-3">Pair</th>
              <th className="px-3 pb-3">Direction</th>
              <th className="px-3 pb-3">Entry</th>
              <th className="px-3 pb-3">Exit</th>
              <th className="px-3 pb-3">P&L</th>
              <th className="px-3 pb-3">Date</th>
              <th className="px-3 pb-3">Session</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((t) => {
              const win = (Number(t.pnl) || 0) >= 0;
              return (
                <tr key={t.id} className="border-t border-white/5">
                  <td className="px-3 py-2.5 font-display font-semibold">{t.pair}</td>
                  <td className="px-3 py-2.5">
                    <span className={'rounded px-2 py-0.5 font-mono text-xs ' + (t.direction === 'long' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300')}>
                      {(t.direction || '').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 font-mono text-white/50">{t.entry_price != null ? t.entry_price : '—'}</td>
                  <td className="px-3 py-2.5 font-mono text-white/50">{t.exit_price != null ? t.exit_price : '—'}</td>
                  <td className={'px-3 py-2.5 font-mono font-bold ' + (win ? 'text-emerald-400' : 'text-red-400')}>
                    {fmtMoney(t.pnl)}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-white/50">{fmtDate(t.trade_date)}</td>
                  <td className="px-3 py-2.5 font-mono text-xs text-white/40">{t.session || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {hasMore && !showAll && (
        <div className="mt-4 text-center">
          <button
            onClick={() => setShowAll(true)}
            className="rounded-lg border border-white/10 bg-white/5 px-5 py-2 text-xs font-semibold text-white/60 hover:text-white"
          >
            View all {trades.length} trades
          </button>
        </div>
      )}

      {showAll && hasMore && (
        <div className="mt-4 text-center">
          <button
            onClick={() => setShowAll(false)}
            className="rounded-lg border border-white/10 bg-white/5 px-5 py-2 text-xs font-semibold text-white/60 hover:text-white"
          >
            Show less
          </button>
        </div>
      )}
    </div>
  );
}
