import Link from 'next/link';
import { num } from '@/lib/stats';

const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function pad2(n) {
  return String(n).padStart(2, '0');
}

export default function CalendarMonth({ trades, year, month, selected, monthParam }) {
  const byDay = {};
  (trades || []).forEach((t) => {
    const raw = t.closed_at || t.created_at;
    if (!raw) return;
    const d = new Date(raw);
    if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month) return;
    const day = d.getUTCDate();
    const e = byDay[day] || { net: 0, count: 0 };
    e.net += num(t.pnl);
    e.count += 1;
    byDay[day] = e;
  });

  const firstDow = (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);

  function cellStyle(net) {
    const a = Math.min(0.4, 0.12 + Math.abs(net) / 1500);
    const c = net >= 0 ? '52,211,153' : '248,113,113';
    return { background: 'rgba(' + c + ',' + a + ')', borderColor: 'rgba(' + c + ',0.3)' };
  }

  return (
    <div>
      <div className="mb-1.5 grid grid-cols-7 gap-1.5">
        {DOW.map((d, i) => (
          <div key={i} className="text-center font-mono text-[10px] text-white/30">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((d, i) => {
          if (d === null) return <div key={'b' + i} />;
          const e = byDay[d];
          const dateStr = year + '-' + pad2(month + 1) + '-' + pad2(d);
          const isSel = selected === dateStr;
          const inner = (
            <div
              className={
                'flex aspect-square flex-col justify-between rounded-lg border p-1.5 bg-white/[0.02] ' +
                (isSel ? 'border-cyan-400/70 ring-1 ring-cyan-400/40' : 'border-white/10')
              }
              style={e ? cellStyle(e.net) : {}}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-white/45">{d}</span>
                {e ? <span className="rounded bg-black/30 px-1 font-mono text-[9px] text-white/60">{e.count}</span> : null}
              </div>
              {e ? (
                <span className={'font-mono text-[10px] font-semibold ' + (e.net >= 0 ? 'text-emerald-300' : 'text-red-300')}>
                  {(e.net >= 0 ? '+' : '-') + '$' + Math.abs(Math.round(e.net))}
                </span>
              ) : null}
            </div>
          );
          return e ? (
            <Link key={d} href={'/dashboard/calendar?month=' + monthParam + '&date=' + dateStr}>{inner}</Link>
          ) : (
            <div key={d}>{inner}</div>
          );
        })}
      </div>
    </div>
  );
}
