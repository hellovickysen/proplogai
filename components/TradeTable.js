import Link from 'next/link';
import { fmtMoney, fmtR, num } from '@/lib/stats';

function fmtDate(d) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch (e) {
    return '—';
  }
}

export default function TradeTable({ rows }) {
  if (!rows || rows.length === 0) {
    return <div className="py-6 text-center text-sm text-white/40">No trades to show yet.</div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px] border-collapse text-sm">
        <thead>
          <tr className="text-left font-mono text-[11px] uppercase tracking-wider text-white/40">
            <th className="px-3 pb-3">Pair</th>
            <th className="px-3 pb-3">Dir</th>
            <th className="px-3 pb-3">Date</th>
            <th className="px-3 pb-3">Entry</th>
            <th className="px-3 pb-3">Exit</th>
            <th className="px-3 pb-3">R</th>
            <th className="px-3 pb-3">P&amp;L</th>
            <th className="px-3 pb-3"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => {
            const win = num(t.pnl) >= 0;
            return (
              <tr key={t.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                <td className="px-3 py-3 font-display font-semibold">
                  <Link href={'/dashboard/trades/' + t.id} className="hover:text-cyan-400">{t.pair}</Link>
                </td>
                <td className="px-3 py-3">
                  <span className={'rounded px-2 py-0.5 font-mono text-[11px] ' + (t.direction === 'long' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300')}>
                    {(t.direction || '').toUpperCase()}
                  </span>
                </td>
                <td className="px-3 py-3 font-mono text-white/60">{fmtDate(t.closed_at || t.created_at)}</td>
                <td className="px-3 py-3 font-mono text-white/60">{t.entry_price != null ? t.entry_price : '—'}</td>
                <td className="px-3 py-3 font-mono text-white/60">{t.exit_price != null ? t.exit_price : '—'}</td>
                <td className={'px-3 py-3 font-mono ' + (win ? 'text-emerald-400' : 'text-red-400')}>{fmtR(t.r_multiple)}</td>
                <td className={'px-3 py-3 font-mono ' + (win ? 'text-emerald-400' : 'text-red-400')}>{fmtMoney(t.pnl)}</td>
                <td className="px-3 py-3 text-right">
                  <Link href={'/dashboard/trades/' + t.id} className="font-mono text-xs text-cyan-400 hover:underline">Details &rarr;</Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
