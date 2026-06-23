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

export default function CalendarMonth({ trades, year, month, selected, monthParam, monthlyPnl }) {
  const now = new Date();
  const todayDay = (now.getUTCFullYear() === year && now.getUTCMonth() === month) ? now.getUTCDate() : null;

  // Index trades by day
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

  // Build week rows (Sunday-first) with overflow days
  const firstDow = new Date(Date.UTC(year, month, 1)).getUTCDay(); // 0=Sun
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const prevMonthDays = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const weeks = [];
  let currentWeek = [];

  // Fill overflow from previous month
  for (let i = 0; i < firstDow; i++) {
    currentWeek.push({ day: prevMonthDays - firstDow + 1 + i, overflow: true });
  }

  // Fill current month days
  for (let d = 1; d <= daysInMonth; d++) {
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push({ day: d, overflow: false });
  }

  // Fill overflow from next month
  let nextDay = 1;
  while (currentWeek.length < 7) {
    currentWeek.push({ day: nextDay++, overflow: true });
  }
  weeks.push(currentWeek);

  // Add one more overflow week if fewer than 6 rows (for consistent height)
  while (weeks.length < 6) {
    const extraWeek = [];
    for (let i = 0; i < 7; i++) {
      extraWeek.push({ day: nextDay++, overflow: true });
    }
    weeks.push(extraWeek);
  }

  // Weekly summary
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

  return (
    <div>
      {/* Monthly P&L header */}
      <div className="py-4 text-center">
        <span className="text-sm text-white/55">Monthly P/L: </span>
        <span className={'text-lg font-bold ' + (monthlyPnl >= 0 ? 'text-emerald-400' : 'text-red-400')}>
          {fmtPnl(monthlyPnl || 0)}
        </span>
      </div>

      {/* Calendar table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
          <thead>
            <tr>
              {DOW.map((d) => (
                <th key={d} className="border border-white/[0.08] px-1 py-2 text-center text-xs font-normal text-white/45">
                  {d}
                </th>
              ))}
              <th className="hidden w-28 border border-white/[0.08] px-1 py-2 text-center text-xs font-normal text-white/45 sm:table-cell">
              </th>
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
                    const dateStr = !isOverflow
                      ? year + '-' + pad2(month + 1) + '-' + pad2(d)
                      : null;
                    const isSel = dateStr && selected === dateStr;

                    // Cell background
                    let cellBg = '';
                    if (e) {
                      cellBg = e.net >= 0
                        ? 'background: rgba(34, 197, 94, 0.15);'
                        : 'background: rgba(239, 68, 68, 0.18);';
                    }

                    const cellContent = (
                      <div
                        className={
                          'flex h-20 flex-col items-center justify-center sm:h-24 ' +
                          (isOverflow ? 'opacity-25' : '') +
                          (isSel ? ' ring-1 ring-inset ring-cyan-400/50' : '') +
                          (e ? ' cursor-pointer' : '')
                        }
                        style={cellBg ? { background: cellBg.split(': ')[1].replace(';', '') } : {}}
                      >
                        {/* Day number */}
                        <span
                          className={
                            'mb-1 text-xs ' +
                            (isToday
                              ? 'grid h-6 w-6 place-items-center rounded-full bg-cyan-500 font-bold text-white'
                              : isOverflow
                              ? 'text-white/30'
                              : 'text-white/50')
                          }
                        >
                          {d}
                        </span>

                        {/* P&L */}
                        {e && (
                          <>
                            <span className={'font-mono text-sm font-bold sm:text-base ' + (e.net >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                              {fmtPnl(e.net)}
                            </span>
                            <span className="mt-0.5 text-[10px] text-white/45 sm:text-xs">
                              {e.count} trade{e.count !== 1 ? 's' : ''}
                            </span>
                          </>
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

                  {/* Weekly summary */}
                  <td className="hidden border border-white/[0.08] p-0 sm:table-cell">
                    <div className="flex h-20 flex-col items-center justify-center sm:h-24">
                      <span className="text-[10px] font-medium text-white/45">
                        Week {wi + 1}
                      </span>
                      <span className={'mt-0.5 font-mono text-sm font-bold ' + (ws.count === 0 ? 'text-white/25' : ws.net >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                        {fmtPnl(ws.net)}
                      </span>
                      <span className="text-[10px] text-white/40">
                        {ws.count} trade{ws.count !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
