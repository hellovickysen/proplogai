"use client";

import { useState } from 'react';
import Link from 'next/link';
import { num, fmtMoneyCompact } from '@/lib/stats';

function fmtDate(d) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch { return '—'; }
}

function ChevronIcon({ open }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={'shrink-0 transition-transform duration-200 ' + (open ? 'rotate-180' : '')}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function DetailPanel({ trade }) {
  const j = trade._journal || {};
  const emotions = j.emotions || [];
  const tags = j.tags || [];
  const note = j.note || '';
  const confidence = j.confidence;
  const screenshots = j.screenshotUrls || [];

  const hasContent = note || emotions.length > 0 || tags.length > 0 || screenshots.length > 0 || confidence != null;

  return (
    <div className="px-4 pb-4 pt-2 border-t border-white/5 bg-white/[0.02] rounded-b-xl space-y-3">
      {!hasContent && (
        <p className="text-xs text-white/30 italic">No journal entry for this trade.</p>
      )}

      {/* Emotions + Tags row */}
      {(emotions.length > 0 || tags.length > 0) && (
        <div className="flex flex-wrap gap-1.5">
          {emotions.map((em, i) => (
            <span key={'em-' + i} className="rounded-full border border-violet-400/20 bg-violet-500/10 px-2 py-0.5 text-[11px] text-violet-200">{em}</span>
          ))}
          {tags.map((tag, i) => (
            <span key={'tag-' + i} className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2 py-0.5 text-[11px] text-cyan-200">{tag}</span>
          ))}
        </div>
      )}

      {/* Confidence */}
      {confidence != null && (
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-white/40">Confidence</span>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <span key={i} className={'text-sm ' + (i <= confidence ? 'text-amber-400' : 'text-white/15')}>&#9733;</span>
            ))}
          </div>
        </div>
      )}

      {/* Journal note */}
      {note && (
        <div>
          <span className="font-mono text-[10px] uppercase tracking-wider text-white/40">Journal note</span>
          <p className="mt-1 text-sm text-white/70 leading-relaxed whitespace-pre-line line-clamp-4">{note}</p>
        </div>
      )}

      {/* Screenshots */}
      {screenshots.length > 0 && (
        <div>
          <span className="font-mono text-[10px] uppercase tracking-wider text-white/40">Screenshots</span>
          <div className="mt-1 flex gap-2 overflow-x-auto">
            {screenshots.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                <img src={url} alt={'Screenshot ' + (i + 1)} className="h-16 w-24 rounded-lg border border-white/10 object-cover hover:border-cyan-400/40 transition-colors" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Full details link */}
      <div className="pt-1">
        <Link href={'/dashboard/trades/' + trade.id} className="inline-flex items-center gap-1 font-mono text-xs text-cyan-400 hover:underline">
          Open full details <span>&rarr;</span>
        </Link>
      </div>
    </div>
  );
}

export default function CalendarTradeList({ trades }) {
  const [expandedId, setExpandedId] = useState(null);

  if (!trades || trades.length === 0) {
    return <p className="text-white/40 text-sm">No trades on this date.</p>;
  }

  function toggle(id) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <>
      {/* ── Mobile cards ── */}
      <div className="space-y-2 sm:hidden">
        {trades.map((t) => {
          const win = num(t.pnl) >= 0;
          const isOpen = expandedId === t.id;
          const leftBorderColor = win ? 'border-l-emerald-400/50' : 'border-l-red-400/50';
          return (
            <div key={t.id} className={'rounded-xl border border-white/10 bg-white/[0.03] border-l-[3px] ' + leftBorderColor}>
              <button
                type="button"
                onClick={() => toggle(t.id)}
                className="flex w-full items-center justify-between px-3.5 py-3 text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-display text-base font-semibold">{t.pair}</span>
                    <span className={'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ' + (t.direction === 'long' ? 'border-emerald-400/25 bg-emerald-500/10 text-emerald-300' : 'border-red-400/25 bg-red-500/10 text-red-300')}>
                      {t.direction === 'long' ? 'Long' : 'Short'}
                    </span>
                    <span className={'font-mono text-sm font-bold ' + (win ? 'text-emerald-400' : 'text-red-400')}>
                      {fmtMoneyCompact(t.pnl)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px] text-white/40">
                    {t.session && <span>{t.session}</span>}
                    {t.setup && <><span className="text-white/20">·</span><span className="truncate max-w-[120px]">{t.setup.split(', ')[0]}</span></>}
                  </div>
                </div>
                <span className="text-white/30 ml-2"><ChevronIcon open={isOpen} /></span>
              </button>
              {isOpen && <DetailPanel trade={t} />}
            </div>
          );
        })}
      </div>

      {/* ── Desktop table ── */}
      <div className="hidden sm:block">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-left font-mono text-xs uppercase tracking-wider text-white/55">
              <th className="px-3 pb-3 w-8"></th>
              <th className="px-3 pb-3">Pair</th>
              <th className="px-3 pb-3">Dir</th>
              <th className="px-3 pb-3">Session</th>
              <th className="px-3 pb-3">Result</th>
              <th className="px-3 pb-3">P&amp;L</th>
              <th className="px-3 pb-3">Entry</th>
              <th className="px-3 pb-3">Exit</th>
              <th className="px-3 pb-3">Setup</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((t) => {
              const win = num(t.pnl) >= 0;
              const isOpen = expandedId === t.id;
              const leftBorder = win ? 'border-l-[3px] border-l-emerald-400/40' : 'border-l-[3px] border-l-red-400/40';
              const setupNames = t.setup ? t.setup.split(', ').filter(Boolean) : [];

              return (
                <tr key={t.id} className="group">
                  {/* Main row — single cell spanning full width so accordion works */}
                  <td colSpan={9} className="p-0">
                    <div>
                      {/* Clickable row */}
                      <button
                        type="button"
                        onClick={() => toggle(t.id)}
                        className={'flex w-full items-center border-t border-white/5 transition-colors hover:bg-white/[0.04] text-left ' + leftBorder + (isOpen ? ' bg-white/[0.03]' : '')}
                      >
                        {/* Chevron */}
                        <div className="px-3 py-3.5 text-white/30">
                          <ChevronIcon open={isOpen} />
                        </div>
                        {/* Pair */}
                        <div className="px-3 py-3.5 font-display font-semibold min-w-[100px]">
                          {t.pair}
                          {t._journal && (t._journal.hasNote || t._journal.hasImages) && (
                            <span className="ml-1.5 text-xs text-amber-400/70">&#128221;</span>
                          )}
                        </div>
                        {/* Direction */}
                        <div className="px-3 py-3.5 min-w-[90px]">
                          <span className={'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ' + (t.direction === 'long' ? 'border-blue-400/30 bg-blue-500/15 text-blue-300' : 'border-red-400/30 bg-red-500/15 text-red-300')}>
                            {t.direction === 'long' ? 'Long' : 'Short'}
                          </span>
                        </div>
                        {/* Session */}
                        <div className="px-3 py-3.5 font-mono text-xs text-white/50 min-w-[80px]">
                          {t.session || '—'}
                        </div>
                        {/* Result */}
                        <div className="px-3 py-3.5 min-w-[70px]">
                          <span className={'rounded-full px-2.5 py-0.5 font-mono text-xs font-semibold ' + (win ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300')}>
                            {win ? 'WIN' : 'LOSS'}
                          </span>
                        </div>
                        {/* P&L */}
                        <div className={'px-3 py-3.5 font-mono text-base font-bold min-w-[100px] ' + (win ? 'text-emerald-400' : 'text-red-400')}>
                          {fmtMoneyCompact(t.pnl)}
                        </div>
                        {/* Entry */}
                        <div className="px-3 py-3.5 font-mono text-white/60 min-w-[80px]">
                          {t.entry_price != null ? t.entry_price : '—'}
                        </div>
                        {/* Exit */}
                        <div className="px-3 py-3.5 font-mono text-white/60 min-w-[80px]">
                          {t.exit_price != null ? t.exit_price : '—'}
                        </div>
                        {/* Setup */}
                        <div className="px-3 py-3.5 flex-1">
                          {setupNames.length > 0 ? (
                            <div className="flex items-center gap-1">
                              <span className={'rounded-full border px-2 py-0.5 text-xs ' + (setupNames[0] === 'No Setup' ? 'border-red-400/20 bg-red-500/10 text-red-300' : 'border-cyan-400/20 bg-cyan-500/10 text-cyan-300')}>{setupNames[0]}</span>
                              {setupNames.length > 1 && (
                                <span className="rounded-full border border-white/10 bg-white/5 px-1.5 py-0.5 text-xs text-white/50">+{setupNames.length - 1}</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-white/40">—</span>
                          )}
                        </div>
                      </button>
                      {/* Expanded detail panel */}
                      {isOpen && <DetailPanel trade={t} />}
                    </div>
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
