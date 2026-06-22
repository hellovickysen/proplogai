import Link from 'next/link';
import { num } from '@/lib/stats';

const DOW = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

function pad2(n) {
  return String(n).padStart(2, '0');
}

function fmtPnl(v) {
  if (v === 0) return '$0.00';
  const sign = v >= 0 ? '' : '-';
  const abs = Math.abs(v);
  if (abs >= 1000) return sign + '$' + abs.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return sign + '$' + abs.toFixed(abs < 10 ? 2 : 1);
}

export default function CalendarMonth({ trades, year, month, selected, monthParam }) {
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
  const weeks = [];
  let currentWeek = new Array(7).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dow = (firstDow + d - 1) % 7;
    if (dow === 0 && d > 1) {
      weeks.push(currentWeek);
      currentWeek = new Array(7).fill(null);
    }
    currentWeek[dow] = d;
  }
  weeks.push(currentWeek);

  function weekSummary(week) {
    let net = 0;
    let days = 0;
    week.forEach((d) => {
      if (d && byDay[d]) {
        net += byDay[d].net;
        days += 1;
      }
    });
    return { net, days };
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
        <thead>
          <tr>
            {DOW.map((d) => (
              <th key={d} className="border-b border-white/[0.08] px-2 py-3 text-center font-mono text-xs font-medium uppercase tracking-widest text-white/50">
                {d}
              </th>
            ))}
            <th className="w-36 border-b border-l border-white/[0.08] px-4 py-3 text-right font-mono text-xs font-medium uppercase tracking-widest text-white/50">
              WEEKLY
            </th>
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, wi) => {
            const ws = weekSummary(week);
            return (
              <tr key={wi}>
                {week.map((d, di) => {
                  const isLast = wi === weeks.length - 1;
                  const borderB = isLast ? '' : 'border-b';
                  const borderR = di < 6 ? 'border-r' : '';
                  const e = byDay[d];

                  // Color the cell border based on P&L
                  let cellBorderColor = 'border-white/[0.06]';
                  if (d !== null && e) {
                    cellBorderColor = e.net >= 0
                      ? 'border-emerald-400/30'
                      : 'border-red-400/30';
                  }

                  if (d === null) {
                    return (
                      <td key={di} className={borderB + ' ' + borderR + ' border-white/[0.06] p-0'}>
                        <div className="h-28 bg-white/[0.01]" />
                      </td>
                    );
                  }

                  const dateStr = year + '-' + pad2(month + 1) + '-' + pad2(d);
                  const isSel = selected === dateStr;

                  const cellContent = (
                    <div
                      className={
                        'relative flex h-28 flex-col justify-between p-2.5 transition-colors ' +
                        (e ? 'cursor-pointer hover:bg-white/[0.04]' : 'bg-white/[0.015]') +
                        (isSel ? ' bg-white/[0.06]' : '')
                      }
                    >
                      <span className={'text-sm font-medium ' + (e ? 'text-white/60' : 'text-white/25')}>
                        {d}
                      </span>

                      {e && (
                        <div
                          className="mt-auto rounded px-2.5 py-2"
                          style={{
                            background: e.net >= 0
                              ? 'rgba(52,211,153,0.12)'
                              : 'rgba(248,113,113,0.12)',
                            borderLeft: e.net >= 0
                              ? '3px solid rgba(52,211,153,0.6)'
                              : '3px solid rgba(248,113,113,0.6)',
                          }}
                        >
                          <div className={'font-mono text-sm font-bold ' + (e.net >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                            {fmtPnl(e.net)}
                          </div>
                          <div className="font-mono text-xs text-white/50">
                            {e.count} trade{e.count !== 1 ? 's' : ''}
                          </div>
                        </div>
                      )}
                    </div>
                  );

                  return (
                    <td key={di} className={borderB + ' ' + borderR + ' ' + cellBorderColor + ' p-0'}>
                      {e ? (
                        <Link href={'/dashboard/calendar?month=' + monthParam + '&date=' + dateStr}>
                          {cellContent}
                        </Link>
                      ) : (
                        cellContent
                      )}
                    </td>
                  );
                })}

                {/* Weekly summary — wider, larger text */}
                <td className={(wi === weeks.length - 1 ? '' : 'border-b') + ' border-l border-white/[0.06] p-0'}>
                  <div className="flex h-28 flex-col items-end justify-center px-4">
                    <span className="font-mono text-xs font-medium text-white/50">
                      Week {wi + 1}
                    </span>
                    <span
                      className={
                        'mt-1.5 font-mono text-base font-bold ' +
                        (ws.days === 0 ? 'text-white/20' : ws.net >= 0 ? 'text-emerald-400' : 'text-red-400')
                      }
                    >
                      {ws.days > 0 ? fmtPnl(ws.net) : '$0.00'}
                    </span>
                    <span className="mt-0.5 font-mono text-xs text-white/50">
                      {ws.days > 0 ? ws.days + ' day' + (ws.days !== 1 ? 's' : '') : '0 days'}
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
