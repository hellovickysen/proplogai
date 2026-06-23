import Link from 'next/link';
import { fmtMoney, fmtMoneyCompact, num } from '@/lib/stats';

function fmtDate(d) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch (e) {
    return '—';
  }
}

export default function TradeTable({ rows, showFilters = false }) {
  if (!rows || rows.length === 0) {
    return <div className="py-6 text-center text-sm text-white/40">No trades to show yet.</div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[800px] border-collapse text-sm">
        <thead>
          <tr className="text-left font-mono text-xs uppercase tracking-wider text-white/55">
            <th className="px-3 pb-3">Pair</th>
            <th className="px-3 pb-3">Dir</th>
            <th className="px-3 pb-3">Date</th>
            <th className="px-3 pb-3">Result</th>
            <th className="px-3 pb-3">P&amp;L</th>
            <th className="px-3 pb-3">Entry</th>
            <th className="px-3 pb-3">Exit</th>
            <th className="px-3 pb-3">Setup</th>
            <th className="px-3 pb-3">Emotions</th>
            <th className="px-3 pb-3"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t, idx) => {
            const win = num(t.pnl) >= 0;
            const emotions = (t._journal && t._journal.emotions) || [];
            const hasNote = t._journal && t._journal.hasNote;
            const hasImages = t._journal && t._journal.hasImages;
            const hasJournal = hasNote || hasImages;
            const zebra = idx % 2 === 1 ? 'bg-white/[0.02]' : '';
            const leftBorder = win
              ? 'border-l-[3px] border-l-emerald-400/40'
              : 'border-l-[3px] border-l-red-400/40';

            const setupNames = t.setup ? t.setup.split(', ').filter(Boolean) : [];

            return (
              <tr
                key={t.id}
                className={
                  'border-t border-white/5 transition-colors hover:bg-white/[0.04] ' +
                  zebra + ' ' + leftBorder
                }
              >
                <td className="px-3 py-3.5 font-display font-semibold">
                  <Link href={'/dashboard/trades/' + t.id} className="hover:text-cyan-400">
                    {t.pair}
                    {hasJournal && (
                      <span className="ml-1.5 inline-flex gap-1 align-middle">
                        {hasNote && <span className="text-xs text-amber-400/70" title="Has journal note">&#128221;</span>}
                        {hasImages && <span className="text-xs text-cyan-400/70" title="Has screenshots">&#128444;</span>}
                      </span>
                    )}
                  </Link>
                </td>
                <td className="px-3 py-3.5">
                  <span className={'rounded px-2 py-0.5 font-mono text-xs ' + (t.direction === 'long' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300')}>
                    {(t.direction || '').toUpperCase()}
                  </span>
                </td>
                <td className="px-3 py-3.5 font-mono text-white/60">
                  {fmtDate(t.trade_date || t.closed_at || t.created_at)}
                  {t.session ? <span className="ml-1.5 text-xs text-white/50">{t.session}</span> : null}
                </td>
                <td className="px-3 py-3.5">
                  <span className={'rounded-full px-2.5 py-0.5 font-mono text-xs font-semibold ' + (win ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300')}>
                    {win ? 'WIN' : 'LOSS'}
                  </span>
                </td>
                <td className={'px-3 py-3.5 font-mono text-base font-bold ' + (win ? 'text-emerald-400' : 'text-red-400')}>{fmtMoneyCompact(t.pnl)}</td>
                <td className="px-3 py-3.5 font-mono text-white/60">{t.entry_price != null ? t.entry_price : '—'}</td>
                <td className="px-3 py-3.5 font-mono text-white/60">{t.exit_price != null ? t.exit_price : '—'}</td>
                <td className="px-3 py-3.5">
                  {setupNames.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {setupNames.slice(0, 3).map((s, i) => (
                        <span key={i} className={'rounded-full border px-2 py-0.5 text-xs ' + (s === 'No Setup' ? 'border-red-400/20 bg-red-500/10 text-red-300' : 'border-cyan-400/20 bg-cyan-500/10 text-cyan-300')}>{s}</span>
                      ))}
                      {setupNames.length > 3 && <span className="text-xs text-white/50">+{setupNames.length - 3}</span>}
                    </div>
                  ) : (
                    <span className="text-white/40">—</span>
                  )}
                </td>
                <td className="px-3 py-3.5">
                  {emotions.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {emotions.slice(0, 3).map((em, i) => (
                        <span key={i} className="rounded-full border border-violet-400/20 bg-violet-500/10 px-2 py-0.5 text-xs text-violet-200">{em}</span>
                      ))}
                      {emotions.length > 3 && <span className="text-xs text-white/50">+{emotions.length - 3}</span>}
                    </div>
                  ) : (
                    <span className="text-white/40">—</span>
                  )}
                </td>
                <td className="px-3 py-3.5 text-right">
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
