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

export default function TradeTable({ rows, showFilters = false, compact = false, totalCount = 0 }) {
  if (!rows || rows.length === 0) {
    return <div className="py-6 text-center text-sm text-white/40">No trades to show yet.</div>;
  }
  return (
    <>
      {/* Mobile card list — visible only below sm breakpoint */}
      <div className="space-y-2 sm:hidden">
        {rows.map((t, idx) => {
          const win = num(t.pnl) >= 0;
          const hasNote = t._journal && t._journal.hasNote;
          const hasImages = t._journal && t._journal.hasImages;
          const hasJournal = hasNote || hasImages;
          const leftBorderColor = win ? 'border-l-emerald-400/50' : 'border-l-red-400/50';
          const tradeNum = totalCount > 0 ? totalCount - idx : rows.length - idx;
          return (
            <Link
              key={t.id}
              href={'/dashboard/trades/' + t.id}
              data-trade-id={t.id}
              className={'block rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3 border-l-[3px] ' + leftBorderColor}
            >
              {/* Row 1: Pair + P&L */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-display text-base font-semibold">{t.pair}</span>
                  <span className={'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ' + (t.direction === 'long' ? 'border-emerald-400/25 bg-emerald-500/10 text-emerald-300' : 'border-red-400/25 bg-red-500/10 text-red-300')}>
                    <svg width="10" height="7" viewBox="0 0 14 10" fill="none" className="shrink-0">{t.direction === 'long' ? <path d="M1 9L4.5 4L7.5 6.5L13 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /> : <path d="M1 1L4.5 6L7.5 3.5L13 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />}</svg>
                    {t.direction === 'long' ? 'Long' : 'Short'}
                  </span>
                  {hasJournal && (
                    <span className="text-xs text-amber-400/60">📝</span>
                  )}
                </div>
                <span className={'font-mono text-base font-bold ' + (win ? 'text-emerald-400' : 'text-red-400')}>
                  {fmtMoneyCompact(t.pnl)}
                </span>
              </div>
              {/* Row 2: Meta info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-mono text-[11px] text-white/40">
                  <span className="text-white/25">#{tradeNum}</span>
                  <span>{fmtDate(t.trade_date || t.closed_at || t.created_at)}</span>
                  {t.session && <><span className="text-white/20">·</span><span>{t.session}</span></>}
                  {t.setup && <><span className="text-white/20">·</span><span className="truncate max-w-[100px]">{t.setup.split(', ')[0]}</span></>}
                </div>
                <span className="text-white/25 text-xs">›</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Desktop table — hidden below sm breakpoint */}
      <div className="hidden sm:block overflow-x-auto">
      <table className="w-full min-w-[900px] border-collapse text-sm">
        <caption className="sr-only">Trade history</caption>
        <thead>
          <tr className="text-left font-mono text-xs uppercase tracking-wider text-white/55">
            <th scope="col" className="px-2 pb-3 w-10">#</th>
            <th scope="col" className="px-3 pb-3">Pair</th>
            <th scope="col" className="px-3 pb-3">Dir</th>
            <th scope="col" className="px-3 pb-3">Date</th>
            <th scope="col" className="px-3 pb-3">Session</th>
            <th scope="col" className="px-3 pb-3">Result</th>
            <th scope="col" className="px-3 pb-3">P&amp;L</th>
            <th scope="col" className="px-3 pb-3">Entry</th>
            <th scope="col" className="px-3 pb-3">Exit</th>
            {!compact && <th scope="col" className="px-3 pb-3">Setup</th>}
            {!compact && <th scope="col" className="px-3 pb-3">Tags</th>}
            {!compact && <th scope="col" className="px-3 pb-3">Emotions</th>}
            <th scope="col" className="px-3 pb-3">Conf</th>
            <th scope="col" className="px-3 pb-3"></th>
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
                data-trade-id={t.id}
                className={
                  'border-t border-white/5 transition-colors hover:bg-white/[0.04] ' +
                  zebra + ' ' + leftBorder
                }
              >
                {/* Trade number */}
                <td className="px-2 py-3.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/[0.06] font-mono text-[10px] text-white/30">
                    {totalCount > 0 ? totalCount - idx : rows.length - idx}
                  </span>
                </td>

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
                  <span className={'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ' + (t.direction === 'long' ? 'border-blue-400/30 bg-blue-500/15 text-blue-300' : 'border-red-400/30 bg-red-500/15 text-red-300')}>
                    <svg width="14" height="10" viewBox="0 0 14 10" fill="none" className="shrink-0">{t.direction === 'long' ? <path d="M1 9L4.5 4L7.5 6.5L13 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /> : <path d="M1 1L4.5 6L7.5 3.5L13 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />}</svg>
                    {t.direction === 'long' ? 'Long' : 'Short'}
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

                {/* Setup — hidden in compact mode */}
                {!compact && (
                <td className="px-3 py-3.5">
                  {setupNames.length > 0 ? (
                    <div className="flex items-center gap-1">
                      <span className={'rounded-full border px-2 py-0.5 text-xs ' + (setupNames[0] === 'No Setup' ? 'border-red-400/20 bg-red-500/10 text-red-300' : 'border-cyan-400/20 bg-cyan-500/10 text-cyan-300')}>{setupNames[0]}</span>
                      {setupNames.length > 1 && (
                        <span className="group relative cursor-default">
                          <span className="rounded-full border border-white/10 bg-white/5 px-1.5 py-0.5 text-xs text-white/50">+{setupNames.length - 1}</span>
                          <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-[#12121a] px-3 py-2 text-xs text-white/80 shadow-lg group-hover:block">
                            {setupNames.slice(1).join(', ')}
                          </span>
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-white/40">—</span>
                  )}
                </td>
                )}

                {/* Tags — hidden in compact mode */}
                {!compact && (() => {
                  const tags = (t._journal && t._journal.tags) || [];
                  return (
                    <td className="px-3 py-3.5">
                      {tags.length > 0 ? (
                        <div className="flex items-center gap-1">
                          <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2 py-0.5 text-xs text-cyan-200">{tags[0]}</span>
                          {tags.length > 1 && (
                            <span className="group relative cursor-default">
                              <span className="rounded-full border border-white/10 bg-white/5 px-1.5 py-0.5 text-xs text-white/50">+{tags.length - 1}</span>
                              <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-[#12121a] px-3 py-2 text-xs text-white/80 shadow-lg group-hover:block">
                                {tags.slice(1).join(', ')}
                              </span>
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-white/40">—</span>
                      )}
                    </td>
                  );
                })()}

                {/* Emotions — hidden in compact mode */}
                {!compact && (
                <td className="px-3 py-3.5">
                  {emotions.length > 0 ? (
                    <div className="flex items-center gap-1">
                      <span className="rounded-full border border-violet-400/20 bg-violet-500/10 px-2 py-0.5 text-xs text-violet-200">{emotions[0]}</span>
                      {emotions.length > 1 && (
                        <span className="group relative cursor-default">
                          <span className="rounded-full border border-white/10 bg-white/5 px-1.5 py-0.5 text-xs text-white/50">+{emotions.length - 1}</span>
                          <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-[#12121a] px-3 py-2 text-xs text-white/80 shadow-lg group-hover:block">
                            {emotions.slice(1).join(', ')}
                          </span>
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-white/40">—</span>
                  )}
                </td>
                )}

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
