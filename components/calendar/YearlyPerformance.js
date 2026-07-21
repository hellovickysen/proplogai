import { num } from '@/lib/stats';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Yearly Performance table — shows monthly P&L and trade count per year.
 * Server component, no client JS. Hidden on mobile.
 */
export default function YearlyPerformance({ trades }) {
  if (!trades || trades.length === 0) return null;

  /* ── Group trades by year → month ── */
  const grid = {};
  const years = new Set();

  for (const t of trades) {
    const raw = t.trade_date || (t.closed_at || t.created_at || '').slice(0, 10);
    if (!raw) continue;
    const d = new Date(raw + 'T00:00:00Z');
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth();
    years.add(y);
    if (!grid[y]) grid[y] = {};
    if (!grid[y][m]) grid[y][m] = { pnl: 0, count: 0 };
    grid[y][m].pnl += num(t.pnl);
    grid[y][m].count += 1;
  }

  const sortedYears = [...years].sort((a, b) => b - a);

  function pnlColor(v) {
    if (v > 0) return 'text-emerald-400';
    if (v < 0) return 'text-red-400';
    return 'text-white/30';
  }

  function fmtPnl(v) {
    if (v === 0) return '-';
    const sign = v > 0 ? '+' : '';
    const abs = Math.abs(v);
    if (abs >= 10000) return sign + '$' + (v / 1000).toFixed(1).replace('.0', '') + 'K';
    if (abs >= 1000) return sign + '$' + (v / 1000).toFixed(1) + 'K';
    return sign + '$' + Math.round(v).toLocaleString('en-US');
  }

  return (
    <div className="hidden sm:block mt-8">
      <div className="rounded-2xl border border-white/10 bg-[#12121a] overflow-hidden">
        <div className="px-6 pt-5 pb-4">
          <h2 className="text-lg font-semibold text-white">Yearly Performance</h2>
        </div>

        <div className="overflow-x-auto px-4 pb-5">
          <table className="w-full border-collapse table-fixed">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-white/30 w-16" />
                {MONTHS.map((m) => (
                  <th key={m} className="px-2 py-3 text-center font-mono text-xs uppercase tracking-wider text-white/35">
                    {m}
                  </th>
                ))}
                <th className="px-4 py-3 text-center font-mono text-xs uppercase tracking-wider text-cyan-400/60">
                  YTD
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedYears.map((year) => {
                const row = grid[year] || {};
                let ytdPnl = 0;
                let ytdCount = 0;
                for (let m = 0; m < 12; m++) {
                  if (row[m]) {
                    ytdPnl += row[m].pnl;
                    ytdCount += row[m].count;
                  }
                }

                return (
                  <tr key={year} className="border-t border-white/5">
                    <td className="px-4 py-4 font-mono text-sm font-bold text-white/50">
                      {year}
                    </td>
                    {Array.from({ length: 12 }, (_, m) => {
                      const cell = row[m];
                      return (
                        <td key={m} className="py-4 text-center">
                          <div className={`flex flex-col items-center rounded-xl px-3 py-2.5 ${cell ? 'border border-white/8 bg-white/[0.03]' : ''}`}>
                            <span className={`font-mono text-sm font-bold ${cell ? pnlColor(cell.pnl) : 'text-white/15'}`}>
                              {cell ? fmtPnl(cell.pnl) : '-'}
                            </span>
                            <span className="font-mono text-[11px] text-white/30 mt-1">
                              {cell ? `${cell.count} trade${cell.count !== 1 ? 's' : ''}` : ' '}
                            </span>
                          </div>
                        </td>
                      );
                    })}
                    <td className="px-4 py-4 text-center">
                      <div className="inline-flex flex-col items-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.05] px-4 py-2.5 min-w-[84px]">
                        <span className={`font-mono text-sm font-bold ${pnlColor(ytdPnl)}`}>
                          {fmtPnl(ytdPnl)}
                        </span>
                        <span className="font-mono text-[11px] text-white/30 mt-1">
                          {ytdCount} trade{ytdCount !== 1 ? 's' : ''}
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
    </div>
  );
}
