'use client';

import { useState } from 'react';
import Link from 'next/link';
import { num } from '@/lib/stats';

const DOW_ALL = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const DOW_WEEKDAY = ['Mo', 'Tu', 'We', 'Th', 'Fr'];

function pad2(n) {
  return String(n).padStart(2, '0');
}

function fmtPnl(v) {
  if (v === 0) return '$0.00';
  const sign = v < 0 ? '-' : '';
  const abs = Math.abs(v);
  return sign + '$' + abs.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function fmtPnlShort(v) {
  if (v === 0) return '$0';
  const sign = v < 0 ? '-' : '';
  const abs = Math.abs(v);
  if (abs >= 1000) return sign + '$' + (abs / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return sign + '$' + Math.round(abs);
}

export default function CalendarMonth({ trades, year, month, selected, monthParam, monthlyPnl, journalDays }) {
  const [showWeekends, setShowWeekends] = useState(false);

  const now = new Date();
  const todayDay =
    now.getUTCFullYear() === year && now.getUTCMonth() === month ? now.getUTCDate() : null;
  const jDays = journalDays || {};

  /* ── aggregate by day ── */
  const byDay = {};
  (trades || []).forEach((t) => {
    const raw = t.trade_date || t.closed_at || t.created_at;
    if (!raw) return;
    const d = new Date(raw);
    if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month) return;
    const day = d.getUTCDate();
    const e = byDay[day] || { net: 0, count: 0 };
    e.net += num(t.pnl);
    e.count += 1;
    byDay[day] = e;
  });

  /* ── build weeks (7 cells each, with dow) ── */
  const firstDow = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const prevMonthDays = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const weeks = [];
  let currentWeek = [];
  for (let i = 0; i < firstDow; i++) {
    currentWeek.push({ day: prevMonthDays - firstDow + 1 + i, overflow: true, dow: i });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push({ day: d, overflow: false, dow: currentWeek.length });
  }
  let nextDay = 1;
  while (currentWeek.length < 7) {
    currentWeek.push({ day: nextDay++, overflow: true, dow: currentWeek.length });
  }
  weeks.push(currentWeek);
  while (weeks.length < 6) {
    const extraWeek = [];
    for (let i = 0; i < 7; i++) {
      extraWeek.push({ day: nextDay++, overflow: true, dow: i });
    }
    weeks.push(extraWeek);
  }

  /* ── week summaries ── */
  const weekSummaries = weeks.map((week, wi) => {
    let net = 0;
    let count = 0;
    let days = 0;
    week.forEach((cell) => {
      if (!cell.overflow && byDay[cell.day]) {
        net += byDay[cell.day].net;
        count += byDay[cell.day].count;
        days += 1;
      }
    });
    return { weekNum: wi + 1, net, count, days };
  });

  const cols = showWeekends ? 7 : 5;
  const dowLabels = showWeekends ? DOW_ALL : DOW_WEEKDAY;
  const isWeekend = (dow) => dow === 0 || dow === 6;

  return (
    <div>
      {/* ── monthly P/L ── */}
      <div className="py-4 text-center">
        <span className="text-sm text-white/55">Monthly P/L: </span>
        <span
          className={
            'text-xl font-bold ' + (monthlyPnl >= 0 ? 'text-emerald-400' : 'text-red-400')
          }
        >
          {fmtPnl(monthlyPnl || 0)}
        </span>
      </div>

      {/* ── weekends toggle ── */}
      <div className="flex items-center px-4 pb-3 sm:px-5">
        <button
          onClick={() => setShowWeekends((p) => !p)}
          className="flex items-center gap-2 text-xs text-white/45 transition-colors hover:text-white/65"
        >
          <span
            className={
              'inline-flex h-4 w-4 items-center justify-center rounded border transition-colors ' +
              (showWeekends
                ? 'border-cyan-400/50 bg-cyan-500/20'
                : 'border-white/20 bg-transparent')
            }
          >
            {showWeekends && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400" />
              </svg>
            )}
          </span>
          Show Weekends
        </button>
      </div>

      {/* ── calendar grid ── */}
      <div className="px-2 sm:px-4">
        {/* DOW header */}
        <div
          style={{ display: 'grid', gridTemplateColumns: 'repeat(' + cols + ', 1fr)', gap: '2px' }}
        >
          {dowLabels.map((d, i) => (
            <div key={i} className="py-2 text-center text-xs font-medium text-white/45">
              {d}
            </div>
          ))}
        </div>

        {/* Day rows */}
        {weeks.map((week, wi) => {
          const filtered = showWeekends ? week : week.filter((c) => !isWeekend(c.dow));

          return (
            <div
              key={wi}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(' + cols + ', 1fr)',
                gap: '2px',
                marginBottom: '2px',
              }}
            >
              {filtered.map((cell, di) => {
                const d = cell.day;
                const isOverflow = cell.overflow;
                const e = !isOverflow ? byDay[d] : null;
                const isToday = !isOverflow && d === todayDay;
                const hasJournal = !isOverflow && jDays[d];
                const dateStr = !isOverflow
                  ? year + '-' + pad2(month + 1) + '-' + pad2(d)
                  : null;
                const isSel = dateStr && selected === dateStr;

                let bgStyle = {};
                if (e) {
                  bgStyle = {
                    background:
                      e.net >= 0 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.18)',
                  };
                }

                const cellContent = (
                  <div
                    className={
                      'flex h-[72px] flex-col sm:h-28 ' +
                      (isOverflow ? 'opacity-25' : '') +
                      (isSel ? ' ring-2 ring-inset ring-cyan-400/50' : '') +
                      (e ? ' cursor-pointer' : '')
                    }
                    style={bgStyle}
                  >
                    {/* day number */}
                    <div className="flex items-center gap-1 px-1.5 pt-1.5 sm:px-2">
                      <span
                        className={
                          isToday
                            ? 'grid h-6 w-6 place-items-center rounded-full bg-cyan-500 text-xs font-bold text-white'
                            : isOverflow
                            ? 'text-xs text-white/30'
                            : 'text-xs text-white/55'
                        }
                      >
                        {d}
                      </span>
                    </div>

                    {/* P&L + trade count — bottom-aligned to avoid overlapping day number */}
                    {e ? (
                      <div className="mt-auto flex flex-col items-center overflow-hidden px-1 pb-1.5">
                        <span
                          className={
                            'max-w-full truncate font-mono text-sm font-extrabold sm:text-xl ' +
                            (e.net >= 0 ? 'text-emerald-400' : 'text-red-400')
                          }
                        >
                          <span className="sm:hidden">{fmtPnlShort(e.net)}</span>
                          <span className="hidden sm:inline">{fmtPnl(e.net)}</span>
                        </span>
                        <span className="mt-0.5 max-w-full truncate text-[10px] text-white/45 sm:text-xs">
                          {e.count} trade{e.count !== 1 ? 's' : ''}
                          {hasJournal && <span className="hidden sm:inline" title="Has journal entry">&#128221;</span>}
                        </span>
                      </div>
                    ) : (
                      <div className="flex-1" />
                    )}
                  </div>
                );

                return (
                  <div
                    key={di}
                    className={
                      'overflow-hidden border bg-white/[0.02] ' +
                      (isToday
                        ? 'border-2 border-cyan-400/50'
                        : 'border-white/[0.08]')
                    }
                  >
                    {e && dateStr ? (
                      <Link href={'/dashboard/calendar?month=' + monthParam + '&date=' + dateStr}>
                        {cellContent}
                      </Link>
                    ) : (
                      cellContent
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* ── weekly summary ── */}
      <div className="mt-4 px-4 pb-4 sm:px-5">
        <div className="mb-3 text-center font-mono text-xs font-semibold uppercase tracking-wider text-white/35">
          Weekly
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {weekSummaries.map((ws) => (
            <div
              key={ws.weekNum}
              className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-2 py-2.5 text-center"
            >
              <div className="text-[10px] font-medium text-white/40 sm:text-xs">
                Week {ws.weekNum}
              </div>
              <div
                className={
                  'mt-1 font-mono text-sm font-bold sm:text-base ' +
                  (ws.count === 0
                    ? 'text-white/20'
                    : ws.net >= 0
                    ? 'text-emerald-400'
                    : 'text-red-400')
                }
              >
                <span className="sm:hidden">{ws.count === 0 ? '$0' : fmtPnlShort(ws.net)}</span>
                <span className="hidden sm:inline">
                  {ws.count === 0 ? '$0.00' : fmtPnl(ws.net)}
                </span>
              </div>
              <div className="text-[10px] text-white/35 sm:text-xs">
                {ws.days} day{ws.days !== 1 ? 's' : ''}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
