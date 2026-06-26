import { num } from '@/lib/stats';

const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function PnlCalendar({ trades, monthPnl }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();
  const monthName = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const byDay = {};
  (trades || []).forEach((t) => {
    const raw = t.trade_date || t.closed_at || t.created_at;
    if (!raw) return;
    const d = new Date(raw);
    if (d.getFullYear() !== year || d.getMonth() !== month) return;
    const day = d.getDate();
    byDay[day] = (byDay[day] || 0) + num(t.pnl);
  });

  // Sunday-first to match the calendar page
  const firstDow = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  // Build cells with overflow
  const cells = [];

  // Previous month overflow
  for (let i = 0; i < firstDow; i++) {
    cells.push({ day: prevMonthDays - firstDow + 1 + i, overflow: true });
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, overflow: false });
  }

  // Next month overflow to fill remaining row
  let nextDay = 1;
  while (cells.length % 7 !== 0) {
    cells.push({ day: nextDay++, overflow: true });
  }

  function cellStyle(pnl) {
    if (pnl === undefined) return {};
    const a = Math.min(0.4, 0.12 + Math.abs(pnl) / 1500);
    const c = pnl >= 0 ? '52,211,153' : '248,113,113';
    return { background: 'rgba(' + c + ',' + a + ')' };
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="font-display text-base font-semibold">P&amp;L calendar</div>
          {monthPnl !== undefined && monthPnl !== null && (
            <span className={'rounded-lg border px-2.5 py-1 font-mono text-xs font-bold ' + (monthPnl >= 0 ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-400' : 'border-red-400/20 bg-red-500/10 text-red-400')}>
              {(monthPnl >= 0 ? '+' : '-') + '$' + Math.abs(monthPnl).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          )}
        </div>
        <div className="font-mono text-xs text-white/45">{monthName}</div>
      </div>
      <div className="mb-1.5 grid grid-cols-7 gap-1">
        {DOW.map((d, i) => (
          <div key={i} className="text-center font-mono text-[10px] text-white/40">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) => {
          const d = cell.day;
          const isOverflow = cell.overflow;
          const isToday = !isOverflow && d === today;
          const pnl = !isOverflow ? byDay[d] : undefined;
          const has = pnl !== undefined;
          const win = has && pnl >= 0;

          return (
            <div
              key={i}
              className={
                'flex aspect-square flex-col justify-between overflow-hidden rounded-lg border p-1.5 ' +
                (isOverflow
                  ? 'border-white/[0.04] bg-white/[0.01]'
                  : isToday
                  ? 'border-cyan-400/40 bg-white/[0.02]'
                  : 'border-white/[0.06] bg-white/[0.02]')
              }
              style={!isOverflow ? cellStyle(pnl) : {}}
            >
              <div className="flex items-center">
                <span
                  className={
                    isToday
                      ? 'grid h-5 w-5 place-items-center rounded-full bg-cyan-500 font-mono text-[9px] font-bold text-white'
                      : isOverflow
                      ? 'font-mono text-[10px] text-white/20'
                      : 'font-mono text-[10px] text-white/45'
                  }
                >
                  {d}
                </span>
              </div>
              {has ? (
                <div className={'truncate font-mono text-[10px] font-semibold ' + (win ? 'text-emerald-300' : 'text-red-300')}>
                  {(pnl >= 0 ? '+' : '-') + '$' + Math.abs(Math.round(pnl))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
