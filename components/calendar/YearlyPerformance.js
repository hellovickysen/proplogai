import { num, fmtMoneyCompact } from '@/lib/stats';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Yearly Performance table — shows monthly P&L and trade count per year.
 * Server component, no client JS. Hidden on mobile.
 *
 * Props:
 *   trades — array of trade objects with { pnl, trade_date, closed_at, created_at }
 */
export default function YearlyPerformance({ trades }) {
  if (!trades || trades.length === 0) return null;

  /* ── Group trades by year → month ── */
  const grid = {}; // { year: { 0..11: { pnl, count } } }
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

  const sortedYears = [...years].sort((a, b) => b - a); // newest first

  /* ── Format helpers ── */
  function pnlColor(v) {
    if (v > 0) return 'text-emerald-400';
    if (v < 0) return 'text-red-400';
    return 'text-white/30';
  }

  function fmtPnl(v) {
    if (v === 0) return '-';
    const sign = v > 0 ? '+' : '';
    const abs = Math.abs(v);
    if (abs >= 1000) return sign + (v / 1000).toFixed(1).replace('.0', '') + 'K';
    return sign + Math.round(v).toLocaleString('en-US');
  }

  return (
    <div className="hidden sm:block mt-6">
      <div className="rounded-2xl border border-white/10 bg-[#12121a] overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <h2 className="font-semibold text-white">Yearly Performance</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-t border-white/5">
                <th className="px-3 py-2.5 text-left font-mono text-[10px] uppercase tracking-wider text-white/30 w-14" />
                {MONTHS.map((m) => (
                  <th key={m} className="px-1.5 py-2.5 text-center font-mono text-[10px] uppercase tracking-wider text-white/30 min-w-[72px]">
                    {m}
                  </th>
                ))}
                <th className="px-3 py-2.5 text-center font-mono text-[10px] uppercase tracking-wider text-cyan-400/50 min-w-[80px]">
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
                    <td className="px-3 py-3 font-mono text-xs font-semibold text-white/50">
                      {year}
                    </td>
                    {Array.from({ length: 12 }, (_, m) => {
                      const cell = row[m];
                      if (!cell) {
                        return (
                          <td key={m} className="px-1.5 py-3 text-center">
                            <span className="text-white/15">-</span>
                          </td>
                        );
                      }
                      return (
                        <td key={m} className="px-1.5 py-3 text-center">
                          <div className="inline-flex flex-col items-center rounded-lg border border-white/5 bg-white/[0.02] px-2.5 py-1.5 min-w-[62px]">
                            <span className={`font-mono text-xs font-bold ${pnlColor(cell.pnl)}`}>
                              {fmtPnl(cell.pnl)}
                            </span>
                            <span className="font-mono text-[9px] text-white/25 mt-0.5">
                              {cell.count} trade{cell.count !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </td>
                      );
                    })}
                    <td className="px-3 py-3 text-center">
                      <div className="inline-flex flex-col items-center rounded-lg border border-cyan-400/10 bg-cyan-400/[0.04] px-3 py-1.5 min-w-[70px]">
                        <span className={`font-mono text-xs font-bold ${pnlColor(ytdPnl)}`}>
                          {fmtPnl(ytdPnl)}
                        </span>
                        <span className="font-mono text-[9px] text-white/25 mt-0.5">
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
