'use client';

import { useState } from 'react';
import { num } from '@/lib/stats';

const DOW_ALL = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DOW_WEEKDAY = ['M', 'T', 'W', 'T', 'F'];

export default function PnlCalendar({ trades, monthPnl }) {
  const [showWeekends, setShowWeekends] = useState(false);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();
  const monthName = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  /* ── aggregate trades by day ── */
  const byDay = {};
  (trades || []).forEach((t) => {
    const raw = t.trade_date || t.closed_at || t.created_at;
    if (!raw) return;
    const d = new Date(raw);
    if (d.getFullYear() !== year || d.getMonth() !== month) return;
    const day = d.getDate();
    const e = byDay[day] || { net: 0, count: 0 };
    e.net += num(t.pnl);
    e.count += 1;
    byDay[day] = e;
  });

  /* ── build cells ── */
  const firstDow = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const allCells = [];
  for (let i = 0; i < firstDow; i++) {
    allCells.push({ day: prevMonthDays - firstDow + 1 + i, overflow: true, dow: i });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dow = (firstDow + d - 1) % 7;
    allCells.push({ day: d, overflow: false, dow });
  }
  let nextDay = 1;
  while (allCells.length % 7 !== 0) {
    allCells.push({ day: nextDay++, overflow: true, dow: allCells.length % 7 });
  }

  const cells = showWeekends
    ? allCells
    : allCells.filter((c) => c.dow !== 0 && c.dow !== 6);
  const cols = showWeekends ? 7 : 5;
  const dowLabels = showWeekends ? DOW_ALL : DOW_WEEKDAY;

  function cellBg(pnl) {
    if (pnl === undefined) return {};
    const a = Math.min(0.4, 0.12 + Math.abs(pnl) / 1500);
    const c = pnl >= 0 ? '52,211,153' : '248,113,113';
    return { background: 'rgba(' + c + ',' + a + ')' };
  }

  return (
    <div>
      {/* ── header ── */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="font-display text-base font-semibold">P&L calendar</div>
          {monthPnl !== undefined && monthPnl !== null && (
            <span
              className={
                'rounded-lg border px-2.5 py-1 font-mono text-xs font-bold ' +
                (monthPnl >= 0
                  ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-400'
                  : 'border-red-400/20 bg-red-500/10 text-red-400')
              }
            >
              {(monthPnl >= 0 ? '+' : '-') +
                '$' +
                Math.abs(monthPnl).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
            </span>
          )}
        </div>
        <div className="font-mono text-xs text-white/45">{monthName}</div>
      </div>

      {/* ── weekends toggle ── */}
      <div className="mb-2 flex justify-end">
        <button
          onClick={() => setShowWeekends((p) => !p)}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-medium text-white/40 transition-colors hover:text-white/60"
        >
          <span
            className={
              'inline-flex h-3.5 w-3.5 items-center justify-center rounded border transition-colors ' +
              (showWeekends
                ? 'border-cyan-400/50 bg-cyan-500/20'
                : 'border-white/20 bg-transparent')
            }
          >
            {showWeekends && (
              <svg width="8" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400" />
              </svg>
            )}
          </span>
          Show Weekends
        </button>
      </div>

      {/* ── DOW header ── */}
      <div
        className="mb-1"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(' + cols + ', 1fr)', gap: '4px' }}
      >
        {dowLabels.map((d, i) => (
          <div key={i} className="text-center font-mono text-[10px] text-white/40">
            {d}
          </div>
        ))}
      </div>

      {/* ── day grid ── */}
      <div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(' + cols + ', 1fr)', gap: '4px' }}
      >
        {cells.map((cell, i) => {
          const d = cell.day;
          const isOverflow = cell.overflow;
          const isToday = !isOverflow && d === today;
          const entry = !isOverflow ? byDay[d] : undefined;
          const has = entry !== undefined;
          const pnl = has ? entry.net : undefined;
          const win = has && pnl >= 0;

          return (
            <div
              key={i}
              className={
                'flex min-h-[52px] flex-col justify-between overflow-hidden rounded-lg border p-1.5 ' +
                (isOverflow
                  ? 'border-white/[0.04] bg-white/[0.01]'
                  : isToday
                  ? 'border-cyan-400/40 bg-white/[0.02]'
                  : 'border-white/[0.06] bg-white/[0.02]')
              }
              style={!isOverflow ? cellBg(pnl) : {}}
            >
              <div>
                <span
                  className={
                    isToday
                      ? 'grid h-5 w-5 place-items-center rounded-full bg-cyan-500 font-mono text-[10px] font-bold text-white'
                      : isOverflow
                      ? 'font-mono text-[11px] text-white/20'
                      : 'font-mono text-[11px] text-white/50'
                  }
                >
                  {d}
                </span>
              </div>
              {has && (
                <div className="mt-auto">
                  <div
                    className={
                      'truncate font-mono text-xs font-bold leading-tight ' +
                      (win ? 'text-emerald-300' : 'text-red-300')
                    }
                  >
                    {(pnl >= 0 ? '+' : '-') + '$' + Math.abs(Math.round(pnl))}
                  </div>
                  <div className="font-mono text-[9px] leading-tight text-white/35">
                    {entry.count} trade{entry.count !== 1 ? 's' : ''}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
