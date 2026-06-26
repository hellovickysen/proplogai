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
    <>
      {/* Mobile card list — visible only below sm breakpoint */}
      <div className="space-y-2 sm:hidden">
        {rows.map((t) => {
          const win = num(t.pnl) >= 0;
          const hasNote = t._journal && t._journal.hasNote;
          const hasImages = t._journal && t._journal.hasImages;
          const hasJournal = hasNote || hasImages;
          const leftBorderColor = win ? 'border-l-emerald-400/50' : 'border-l-red-400/50';
          return (
            <Link
              key={t.id}
              href={'/dashboard/trades/' + t.id}
              className={'flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 border-l-[3px] ' + leftBorderColor}
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Direction arrow */}
                <span className={'shrink-0 font-mono text-base ' + (t.direction === 'long' ? 'text-emerald-400' : 'text-red-400')}>
                  {t.direction === 'long' ? '▲' : '▼'}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-display font-semibold">{t.pair}</span>
                    {hasJournal && (
                      <span className="text-xs text-amber-400/70" title="Has journal entry">&#128221;</span>
                    )}
                  </div>
                  <div className="font-mono text-xs text-white/50">
                    {fmtDate(t.trade_date || t.closed_at || t.created_at)}
                    {t.session ? <span className="ml-1.5">{t.session}</span> : null}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-3">
                <span className={'font-mono text-base font-bold ' + (win ? 'text-emerald-400' : 'text-red-400')}>
                  {fmtMoneyCompact(t.pnl)}
                </span>
                <span className="font-mono text-xs text-white/40">&rsaquo;</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Desktop table — hidden below sm breakpoint */}
      <div className="hidden sm:block overflow-x-auto">
      <table className="w-full min-w-[900px] border-collapse text-sm">
        <thead>
          <tr className="text-left font-mono text-xs uppercase tracking-wider text-white/55">
            <th className="px-3 pb-3">Pair</th>
            <th className="px-3 pb-3">Dir</th>
            <th className="px-3 pb-3">Date</th>
            <th className="px-3 pb-3">Session</th>
            <th className="px-3 pb-3">Result</th>
            <th className="px-3 pb-3">P&amp;L</th>
            <th className="px-3 pb-3">Entry</th>
            <th className="px-3 pb-3">Exit</th>
            <th className="px-3 pb-3">Setup</th>
            <th className="px-3 pb-3">Emotions</th>
            <th className="px-3 pb-3">Conf</th>
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
            const confidence = t._journal && t._journal.confidence != null ? t._journal.confidence : null;
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
                {/* Pair + journal icon */}
                <td className="px-3 py-3.5 font-display font-semibold">
                  <Link href={'/dashboard/trades/' + t.id} className="hover:text-cyan-400">
                    {t.pair}
                    {hasJournal && (
                      <span className="ml-1.5 text-xs text-amber-400/70 align-middle" title="Has journal entry">&#128221;</span>
                    )}
                  </Link>
                </td>

                {/* Direction */}
                <td className="px-3 py-3.5">
                  <span className={'rounded px-2 py-0.5 font-mono text-xs ' + (t.direction === 'long' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300')}>
                    {(t.direction || '').toUpperCase()}
                  </span>
                </td>

                {/* Date — just the date */}
                <td className="px-3 py-3.5 font-mono text-white/60">
                  {fmtDate(t.trade_date || t.closed_at || t.created_at)}
                </td>

                {/* Session — separate column */}
                <td className="px-3 py-3.5 font-mono text-xs text-white/50">
                  {t.session || '—'}
                </td>

                {/* Result */}
                <td className="px-3 py-3.5">
                  <span className={'rounded-full px-2.5 py-0.5 font-mono text-xs font-semibold ' + (win ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300')}>
                    {win ? 'WIN' : 'LOSS'}
                  </span>
                </td>

                {/* P&L */}
                <td className={'px-3 py-3.5 font-mono text-base font-bold ' + (win ? 'text-emerald-400' : 'text-red-400')}>{fmtMoneyCompact(t.pnl)}</td>

                {/* Entry */}
                <td className="px-3 py-3.5 font-mono text-white/60">{t.entry_price != null ? t.entry_price : '—'}</td>

                {/* Exit */}
                <td className="px-3 py-3.5 font-mono text-white/60">{t.exit_price != null ? t.exit_price : '—'}</td>

                {/* Setup — compact: first tag + count */}
                <td className="px-3 py-3.5">
                  {setupNames.length > 0 ? (
                    <div className="flex items-center gap-1">
                      <span className={'rounded-full border px-2 py-0.5 text-xs ' + (setupNames[0] === 'No Setup' ? 'border-red-400/20 bg-red-500/10 text-red-300' : 'border-cyan-400/20 bg-cyan-500/10 text-cyan-300')}>{setupNames[0]}</span>
                      {setupNames.length > 1 && <span className="rounded-full border border-white/10 bg-white/5 px-1.5 py-0.5 text-xs text-white/50">+{setupNames.length - 1}</span>}
                    </div>
                  ) : (
                    <span className="text-white/40">—</span>
                  )}
                </td>

                {/* Emotions — compact: first tag + count */}
                <td className="px-3 py-3.5">
                  {emotions.length > 0 ? (
                    <div className="flex items-center gap-1">
                      <span className="rounded-full border border-violet-400/20 bg-violet-500/10 px-2 py-0.5 text-xs text-violet-200">{emotions[0]}</span>
                      {emotions.length > 1 && <span className="rounded-full border border-white/10 bg-white/5 px-1.5 py-0.5 text-xs text-white/50">+{emotions.length - 1}</span>}
                    </div>
                  ) : (
                    <span className="text-white/40">—</span>
                  )}
                </td>

                {/* Confidence */}
                <td className="px-3 py-3.5 font-mono text-xs text-white/60">
                  {confidence != null ? (
                    <span className={'rounded-full px-2 py-0.5 ' + (confidence >= 4 ? 'bg-emerald-500/15 text-emerald-300' : confidence >= 2 ? 'bg-amber-500/15 text-amber-300' : 'bg-red-500/15 text-red-300')}>{confidence}/5</span>
                  ) : (
                    <span className="text-white/40">—</span>
                  )}
                </td>

                {/* Details link */}
                <td className="px-3 py-3.5 text-right">
                  <Link href={'/dashboard/trades/' + t.id} className="font-mono text-xs text-cyan-400 hover:underline">Details &rarr;</Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </>
  );
}
