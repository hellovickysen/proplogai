import Link from 'next/link';
import { num } from '@/lib/stats';

const DOW = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function pad2(n) {
  return String(n).padStart(2, '0');
}

function fmtPnl(v) {
  if (v === 0) return '$0.00';
  const sign = v < 0 ? '-' : '';
  const abs = Math.abs(v);
  return sign + '$' + abs.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export default function CalendarMonth({ trades, year, month, selected, monthParam, monthlyPnl, journalDays }) {
  const now = new Date();
  const todayDay = (now.getUTCFullYear() === year && now.getUTCMonth() === month) ? now.getUTCDate() : null;
  const jDays = journalDays || {};

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

  const firstDow = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const prevMonthDays = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const weeks = [];
  let currentWeek = [];
  for (let i = 0; i < firstDow; i++) {
    currentWeek.push({ day: prevMonthDays - firstDow + 1 + i, overflow: true });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push({ day: d, overflow: false });
  }
  let nextDay = 1;
  while (currentWeek.length < 7) {
    currentWeek.push({ day: nextDay++, overflow: true });
  }
  weeks.push(currentWeek);
  while (weeks.length < 6) {
    const extraWeek = [];
    for (let i = 0; i < 7; i++) {
      extraWeek.push({ day: nextDay++, overflow: true });
    }
    weeks.push(extraWeek);
  }

  function weekSummary(week) {
    let net = 0;
    let count = 0;
    week.forEach((cell) => {
      if (!cell.overflow && byDay[cell.day]) {
        net += byDay[cell.day].net;
        count += byDay[cell.day].count;
      }
    });
    return { net, count };
  }

  // Shared day number style (same size for all cells including Saturday)
  function dayNumClass(isToday, isOverflow) {
    if (isToday) return 'grid h-6 w-6 place-items-center rounded-full bg-cyan-500 text-xs font-bold text-white';
    if (isOverflow) return 'text-xs text-white/30';
    return 'text-xs text-white/50';
  }

  return (
    <div>
      {/* Monthly P&L header */}
      <div className="py-4 text-center">
        <span className="text-sm text-white/55">Monthly P/L: </span>
        <span className={'text-xl font-bold ' + (monthlyPnl >= 0 ? 'text-emerald-400' : 'text-red-400')}>
          {fmtPnl(monthlyPnl || 0)}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
          <thead>
            <tr>
              {DOW.map((d) => (
                <th key={d} className="border border-white/[0.08] px-1 py-2 text-center text-xs font-normal text-white/45">
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((week, wi) => {
              const ws = weekSummary(week);
              return (
                <tr key={wi}>
                  {week.map((cell, di) => {
                    const d = cell.day;
                    const isOverflow = cell.overflow;
                    const e = !isOverflow ? byDay[d] : null;
                    const isToday = !isOverflow && d === todayDay;
                    const isSaturday = di === 6;
                    const hasJournal = !isOverflow && jDays[d];
                    const dateStr = !isOverflow
                      ? year + '-' + pad2(month + 1) + '-' + pad2(d)
                      : null;
                    const isSel = dateStr && selected === dateStr;

                    let bgStyle = {};
                    if (e) {
                      bgStyle = { background: e.net >= 0 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.18)' };
                    }

                    // Saturday cell = day number (top) + weekly summary (center/bottom)
                    if (isSaturday) {
                      const satContent = (
                        <div
                          className={
                            'flex h-24 flex-col sm:h-28 ' +
                            (isOverflow ? 'opacity-25' : '') +
                            (isSel ? ' ring-1 ring-inset ring-cyan-400/50' : '')
                          }
                          style={bgStyle}
                        >
                          {/* Day number — top aligned */}
                          <div className="flex items-center gap-1 px-2 pt-1.5">
                            <span className={dayNumClass(isToday, isOverflow)}>{d}</span>
                          </div>

                          {/* Weekly summary — centered */}
                          <div className="flex flex-1 flex-col items-center justify-center">
                            <span className="text-[10px] font-semibold text-white/50 sm:text-xs">Week {wi + 1}</span>
                            <span className={'font-mono text-base font-extrabold sm:text-lg ' + (ws.count === 0 ? 'text-white/25' : ws.net >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                              {fmtPnl(ws.net)}
                            </span>
                            <span className="text-[10px] text-white/45">{ws.count} trades</span>
                          </div>
                        </div>
                      );

                      return (
                        <td key={di} className="border border-white/[0.08] p-0">
                          {e && dateStr ? (
                            <Link href={'/dashboard/calendar?month=' + monthParam + '&date=' + dateStr}>{satContent}</Link>
                          ) : satContent}
                        </td>
                      );
                    }

                    // Regular day cell — day number top-aligned, P&L centered
                    const cellContent = (
                      <div
                        className={
                          'flex h-24 flex-col sm:h-28 ' +
                          (isOverflow ? 'opacity-25' : '') +
                          (isSel ? ' ring-1 ring-inset ring-cyan-400/50' : '') +
                          (e ? ' cursor-pointer' : '')
                        }
                        style={bgStyle}
                      >
                        {/* Day number — top aligned */}
                        <div className="flex items-center gap-1 px-2 pt-1.5">
                          <span className={dayNumClass(isToday, isOverflow)}>{d}</span>
                          {hasJournal && (
                            <span className="text-[10px]" title="Has journal entry">📝</span>
                          )}
                        </div>

                        {/* P&L — centered in remaining space */}
                        {e ? (
                          <div className="flex flex-1 flex-col items-center justify-center">
                            <span className={'font-mono text-base font-extrabold sm:text-xl ' + (e.net >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                              {fmtPnl(e.net)}
                            </span>
                            <span className="mt-0.5 text-[10px] text-white/45 sm:text-xs">
                              {e.count} trade{e.count !== 1 ? 's' : ''}
                            </span>
                          </div>
                        ) : (
                          <div className="flex-1" />
                        )}
                      </div>
                    );

                    return (
                      <td key={di} className="border border-white/[0.08] p-0">
                        {e && dateStr ? (
                          <Link href={'/dashboard/calendar?month=' + monthParam + '&date=' + dateStr}>
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
  );
}
