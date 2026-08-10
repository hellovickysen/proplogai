'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { num } from '@/lib/stats';

const ShareCalendarModal = dynamic(
  () => import('@/components/share/ShareCalendarModal'),
  { ssr: false }
);

const DOW_ALL = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const DOW_WEEKDAY = ['Mo', 'Tu', 'We', 'Th', 'Fr'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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
  const [showShareCalendar, setShowShareCalendar] = useState(false);
  const [pendingDate, setPendingDate] = useState(null);

  useEffect(() => {
    setPendingDate(null);
  }, [selected]);

  const now = new Date();
  const todayDay =
    now.getUTCFullYear() === year && now.getUTCMonth() === month ? now.getUTCDate() : null;
  const jDays = journalDays || {};

  /* ── aggregate visible calendar trades by ISO date ── */
  const byDay = {};
  (trades || []).forEach((t) => {
    const dateStr = t.trade_date ? t.trade_date.slice(0, 10) : null;
    if (!dateStr) return;
    const e = byDay[dateStr] || { net: 0, count: 0 };
    e.net += num(t.pnl);
    e.count += 1;
    byDay[dateStr] = e;
  });

  /* ── build six complete weeks, including adjacent months ── */
  const firstDay = new Date(Date.UTC(year, month, 1));
  const calendarStart = new Date(firstDay);
  calendarStart.setUTCDate(calendarStart.getUTCDate() - firstDay.getUTCDay());
  const weeks = [];
  for (let wi = 0; wi < 6; wi++) {
    const week = [];
    for (let dow = 0; dow < 7; dow++) {
      const date = new Date(calendarStart);
      date.setUTCDate(calendarStart.getUTCDate() + wi * 7 + dow);
      week.push({
        day: date.getUTCDate(),
        overflow: date.getUTCFullYear() !== year || date.getUTCMonth() !== month,
        dow,
        dateStr: date.getUTCFullYear() + '-' + pad2(date.getUTCMonth() + 1) + '-' + pad2(date.getUTCDate()),
        dateMonth: date.getUTCMonth(),
        dateYear: date.getUTCFullYear(),
      });
    }
    weeks.push(week);
  }

  /* ── week summaries ── */
  function weekSummary(week) {
    let net = 0;
    let count = 0;
    let days = 0;
    week.forEach((cell) => {
      const e = byDay[cell.dateStr];
      if (e) {
        net += e.net;
        count += e.count;
        days += 1;
      }
    });
    const allAdjacent = week.every((cell) => cell.overflow);
    const anchor = week[0];
    const firstDayOfAnchorMonth = new Date(Date.UTC(anchor.dateYear, anchor.dateMonth, 1));
    const weekOfMonth = Math.floor((firstDayOfAnchorMonth.getUTCDay() + anchor.day - 1) / 7) + 1;
    return {
      net,
      count,
      days,
      label: allAdjacent ? MONTHS_SHORT[anchor.dateMonth] + ' Week ' + weekOfMonth : 'Week ' + (weeks.indexOf(week) + 1),
    };
  }

  const weekSummaries = weeks.map((week, wi) => ({ weekNum: wi + 1, ...weekSummary(week) }));

  /* ── helpers ── */
  const cols = showWeekends ? 7 : 5;
  const dowLabels = showWeekends ? DOW_ALL : DOW_WEEKDAY;
  const isWeekend = (dow) => dow === 0 || dow === 6;

  function dayNumClass(isToday, isOverflow) {
    if (isToday) return 'grid h-6 w-6 place-items-center rounded-full bg-cyan-500 text-xs font-bold text-white';
    if (isOverflow) return 'text-xs text-white/30';
    return 'text-xs text-white/50';
  }

  function handleDaySelect(event, dateStr) {
    if (selected === dateStr) {
      event.preventDefault();
      return;
    }
    setPendingDate(dateStr);
  }

  return (
    <div>
      {/* ── monthly P/L + share button ── */}
      <div className="flex items-center justify-center gap-3 py-4">
        <div className="text-center">
          <span className="text-sm text-white/55">Monthly P/L: </span>
          <span className={'text-xl font-bold ' + (monthlyPnl >= 0 ? 'text-emerald-400' : 'text-red-400')}>
            {fmtPnl(monthlyPnl || 0)}
          </span>
        </div>
        <button
          onClick={() => setShowShareCalendar(true)}
          className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-white/50 transition-colors hover:border-white/20 hover:bg-white/[0.08] hover:text-white/80"
          title="Share calendar"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════
          DESKTOP — original table layout with Saturday weekly summary
          ══════════════════════════════════════════════════════════ */}
      <div className="hidden sm:block">
        <div className="overflow-x-auto">
          <table className="w-full border-separate" style={{ tableLayout: 'fixed', borderSpacing: '4px' }}>
            <thead>
              <tr>
                {DOW_ALL.map((d) => (
                  <th key={d} className="px-1 py-2 text-center text-xs font-normal text-white/45">
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weeks.map((week, wi) => {
                const ws = weekSummary(week);
                return (
                  <tr key={'week-' + wi}>
                    {week.map((cell, di) => {
                      const d = cell.day;
                      const isOverflow = cell.overflow;
                      const dateStr = cell.dateStr;
                      const e = byDay[dateStr] || null;
                      const isToday = cell.dateYear === now.getUTCFullYear() && cell.dateMonth === now.getUTCMonth() && d === todayDay;
                      const hasJournal = jDays[dateStr];
                      const isSel = dateStr && selected === dateStr;
                      const isPending = dateStr && pendingDate === dateStr;
                      const isSaturday = di === 6;
                      const currentMonthCells = week.filter((weekCell) => !weekCell.overflow);
                      const openingCarryover = currentMonthCells.length === 1 && !byDay[currentMonthCells[0].dateStr];
                      const useAdjacentStyle = isOverflow || openingCarryover;

                      let bgStyle = {};
                      if (e) {
                        bgStyle = { backgroundColor: e.net >= 0 ? (useAdjacentStyle ? 'rgba(34, 197, 94, 0.02)' : 'rgba(34, 197, 94, 0.15)') : (useAdjacentStyle ? 'rgba(239, 68, 68, 0.025)' : 'rgba(239, 68, 68, 0.18)') };
                      }
                      if (useAdjacentStyle) {
                        bgStyle.backgroundImage = 'repeating-linear-gradient(-45deg, rgba(255,255,255,0.15) 0, rgba(255,255,255,0.15) 1px, transparent 1px, transparent 7px)';
                      }

                      const todayBorder = isToday ? 'border-2 border-cyan-400/50' : 'border border-white/[0.08]';

                      /* Saturday cell — weekly summary */
                      if (isSaturday) {
                        const satContent = (
                          <div
                            className={'relative flex h-28 flex-col rounded-lg overflow-hidden transition-all duration-200 ' + todayBorder + ' ' + (ws.count === 0 ? 'opacity-25' : '') + (useAdjacentStyle ? ' opacity-35' : '') + (isSel ? ' ring-1 ring-inset ring-cyan-400/50' : '') + (e ? ' group-hover:-translate-y-0.5 group-hover:border-cyan-400/60 group-hover:shadow-lg group-hover:shadow-cyan-500/10' : '')}
                            style={bgStyle}
                          >
                            <div className="flex items-center gap-1 px-2 pt-1.5">
                              <span className={dayNumClass(isToday, isOverflow)}>{d}</span>
                            </div>
                            <div className="flex flex-1 flex-col items-center justify-center overflow-hidden px-0.5">
                              <span className="text-xs font-semibold text-white/50">{ws.label}</span>
                              <span className={'truncate max-w-full font-mono text-lg font-extrabold ' + (ws.count === 0 ? 'text-white/40' : ws.net >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                                {fmtPnl(ws.net)}
                              </span>
                              <span className="text-[10px] text-white/45">{ws.count} trades</span>
                            </div>
                            {isPending && (
                              <div className="absolute inset-0 grid place-items-center bg-[#12121a]/70 backdrop-blur-[1px]" aria-live="polite">
                                <span className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-300 border-t-transparent" />
                              </div>
                            )}
                          </div>
                        );

                        return (
                          <td key={di} className="p-0 align-top">
                            {e && dateStr ? (
                              <Link href={'/dashboard/calendar?month=' + monthParam + '&date=' + dateStr} scroll={false} onClick={(event) => handleDaySelect(event, dateStr)} className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60">
                                {satContent}
                              </Link>
                            ) : satContent}
                          </td>
                        );
                      }

                      /* Regular day cell */
                      const cellContent = (
                        <div
                          className={'relative flex h-28 flex-col rounded-lg overflow-hidden transition-all duration-200 ' + todayBorder + ' ' + (useAdjacentStyle ? 'opacity-35' : '') + (isSel ? ' ring-1 ring-inset ring-cyan-400/50' : '') + (e ? ' cursor-pointer group-hover:-translate-y-0.5 group-hover:border-cyan-400/60 group-hover:shadow-lg group-hover:shadow-cyan-500/10' : '')}
                          style={bgStyle}
                        >
                          <div className="flex items-center gap-1 px-2 pt-1.5">
                            <span className={dayNumClass(isToday, isOverflow)}>{d}</span>
                          </div>
                          {e ? (
                            <div className="flex flex-1 flex-col items-center justify-center overflow-hidden px-0.5">
                              <span className={'truncate max-w-full font-mono text-xl font-extrabold ' + (e.net >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                                {fmtPnl(e.net)}
                              </span>
                              <span className="mt-0.5 flex items-center gap-1 text-xs text-white/45">
                                {e.count} trade{e.count !== 1 ? 's' : ''}
                                {hasJournal && <span title="Has journal entry">&#128221;</span>}
                              </span>
                            </div>
                          ) : (
                            <div className="flex-1" />
                          )}
                          {isPending && (
                            <div className="absolute inset-0 grid place-items-center bg-[#12121a]/70 backdrop-blur-[1px]" aria-live="polite">
                              <span className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-300 border-t-transparent" />
                            </div>
                          )}
                        </div>
                      );

                      return (
                        <td key={di} className="p-0 align-top">
                          {e && dateStr ? (
                            <Link href={'/dashboard/calendar?month=' + monthParam + '&date=' + dateStr} scroll={false} onClick={(event) => handleDaySelect(event, dateStr)} className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60">
                              {cellContent}
                            </Link>
                          ) : (
                            cellContent
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          MOBILE — grid layout with weekends toggle + weekly below
          ══════════════════════════════════════════════════════════ */}
      <div className="sm:hidden">
        {/* weekends toggle */}
        <div className="flex items-center px-4 pb-3">
          <button
            onClick={() => setShowWeekends((p) => !p)}
            className="flex items-center gap-2 text-xs text-white/45 transition-colors hover:text-white/65"
          >
            <span
              className={'inline-flex h-4 w-4 items-center justify-center rounded border transition-colors ' +
                (showWeekends ? 'border-cyan-400/50 bg-cyan-500/20' : 'border-white/20 bg-transparent')}
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

        {/* DOW header */}
        <div className="px-2">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(' + cols + ', 1fr)', gap: '4px' }}>
            {dowLabels.map((d, i) => (
              <div key={d + '-' + i} className="py-2 text-center text-xs font-medium text-white/45">{d}</div>
            ))}
          </div>

          {/* Day rows */}
          {weeks.map((week, wi) => {
            const filtered = showWeekends ? week : week.filter((c) => !isWeekend(c.dow));
            return (
              <div
                key={'week-' + wi}
                style={{ display: 'grid', gridTemplateColumns: 'repeat(' + cols + ', 1fr)', gap: '4px', marginBottom: '4px' }}
              >
                {filtered.map((cell, di) => {
                  const d = cell.day;
                  const isOverflow = cell.overflow;
                  const dateStr = cell.dateStr;
                  const e = byDay[dateStr] || null;
                  const isToday = cell.dateYear === now.getUTCFullYear() && cell.dateMonth === now.getUTCMonth() && d === todayDay;
                  const hasJournal = jDays[dateStr];
                  const isSel = dateStr && selected === dateStr;
                  const isPending = dateStr && pendingDate === dateStr;
                  const currentMonthCells = week.filter((weekCell) => !weekCell.overflow);
                  const openingCarryover = currentMonthCells.length === 1 && !byDay[currentMonthCells[0].dateStr];
                  const useAdjacentStyle = isOverflow || openingCarryover;

                  let bgStyle = {};
                  if (e) {
                    bgStyle = { backgroundColor: e.net >= 0 ? (useAdjacentStyle ? 'rgba(34, 197, 94, 0.02)' : 'rgba(34, 197, 94, 0.15)') : (useAdjacentStyle ? 'rgba(239, 68, 68, 0.025)' : 'rgba(239, 68, 68, 0.18)') };
                  }
                  if (useAdjacentStyle) {
                    bgStyle.backgroundImage = 'repeating-linear-gradient(-45deg, rgba(255,255,255,0.15) 0, rgba(255,255,255,0.15) 1px, transparent 1px, transparent 7px)';
                  }

                  const cellContent = (
                    <div
                      className={'relative flex h-[72px] flex-col transition-all duration-200 ' + (useAdjacentStyle ? 'opacity-35' : '') + (isSel ? ' ring-2 ring-inset ring-cyan-400/50' : '') + (e ? ' cursor-pointer group-hover:-translate-y-0.5 group-hover:ring-1 group-hover:ring-cyan-400/60 group-hover:shadow-lg group-hover:shadow-cyan-500/10' : '')}
                      style={bgStyle}
                    >
                      <div className="flex items-center gap-1 px-1.5 pt-1.5">
                        <span className={isToday ? 'grid h-6 w-6 place-items-center rounded-full bg-cyan-500 text-xs font-bold text-white' : isOverflow ? 'text-xs text-white/30' : 'text-xs text-white/55'}>
                          {d}
                        </span>
                      </div>
                      {e ? (
                        <div className="mt-auto flex flex-col items-center overflow-hidden px-1 pb-1.5">
                          <span className={'max-w-full truncate font-mono text-sm font-extrabold ' + (e.net >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                            {fmtPnlShort(e.net)}
                          </span>
                          <span className="mt-0.5 max-w-full truncate text-[10px] text-white/45">
                            {e.count} trade{e.count !== 1 ? 's' : ''}
                          </span>
                        </div>
                      ) : (
                        <div className="flex-1" />
                      )}
                      {isPending && (
                        <div className="absolute inset-0 grid place-items-center bg-[#12121a]/70 backdrop-blur-[1px]" aria-live="polite">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-300 border-t-transparent" />
                        </div>
                      )}
                    </div>
                  );

                  return (
                    <div key={cell.overflow ? 'overflow-' + di : 'day-' + cell.day} className={'overflow-hidden rounded-lg border bg-white/[0.02] ' + (isToday ? 'border-2 border-cyan-400/50' : 'border-white/[0.08]')}>
                      {e && dateStr ? (
                        <Link href={'/dashboard/calendar?month=' + monthParam + '&date=' + dateStr} scroll={false} onClick={(event) => handleDaySelect(event, dateStr)} className="group block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60">
                          {cellContent}
                        </Link>
                      ) : cellContent}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* weekly summary below */}
        <div className="mt-4 px-4 pb-4">
          <div className="mb-3 text-center font-mono text-xs font-semibold uppercase tracking-wider text-white/35">Weekly</div>
          <div className="grid grid-cols-3 gap-2">
            {weekSummaries.map((ws) => (
              <div key={ws.weekNum} className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-2 py-2.5 text-center">
                <div className="text-[10px] font-medium text-white/40">{ws.label}</div>
                <div className={'mt-1 font-mono text-sm font-bold ' + (ws.count === 0 ? 'text-white/35' : ws.net >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                  {ws.count === 0 ? '$0' : fmtPnlShort(ws.net)}
                </div>
                <div className="text-[10px] text-white/35">{ws.days} day{ws.days !== 1 ? 's' : ''}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Share Calendar Modal ── */}
      {showShareCalendar && (
        <ShareCalendarModal
          trades={trades}
          year={year}
          month={month}
          monthlyPnl={monthlyPnl || 0}
          onClose={() => setShowShareCalendar(false)}
        />
      )}
    </div>
  );
}
