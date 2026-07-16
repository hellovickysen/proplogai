"use client";

import React, { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { num, fmtMoneyCompact } from '@/lib/stats';

/* ─── Lightbox Carousel ──────────────────────────────────────── */
function ImageCarousel({ images, startIndex, onClose }) {
  const [idx, setIdx] = useState(startIndex);

  const prev = useCallback(() => setIdx((i) => (i > 0 ? i - 1 : images.length - 1)), [images.length]);
  const next = useCallback(() => setIdx((i) => (i < images.length - 1 ? i + 1 : 0)), [images.length]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, prev, next]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="relative max-h-[90vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
        {/* Close */}
        <button onClick={onClose} className="absolute -top-10 right-0 text-white/60 hover:text-white text-2xl font-light">&times;</button>

        {/* Image */}
        <img src={images[idx]} alt={'Screenshot ' + (idx + 1)} className="max-h-[85vh] max-w-[85vw] rounded-xl border border-white/10 object-contain" />

        {/* Nav arrows */}
        {images.length > 1 && (
          <>
            <button onClick={prev} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white text-lg transition-colors">&#8249;</button>
            <button onClick={next} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white text-lg transition-colors">&#8250;</button>
          </>
        )}

        {/* Counter */}
        <div className="mt-3 text-center font-mono text-xs text-white/40">{idx + 1} / {images.length}</div>
      </div>
    </div>
  );
}

/* ─── Chevron icon ───────────────────────────────────────────── */
function ChevronIcon({ open }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={'shrink-0 transition-transform duration-200 ' + (open ? 'rotate-180' : '')}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

/* ─── Expanded detail panel ──────────────────────────────────── */
function DetailPanel({ trade, colSpan, onImageClick }) {
  const j = trade._journal || {};
  const emotions = j.emotions || [];
  const tags = j.tags || [];
  const note = j.note || '';
  const confidence = j.confidence;
  const screenshots = j.screenshotUrls || [];

  const hasContent = note || emotions.length > 0 || tags.length > 0 || screenshots.length > 0 || confidence != null;

  return (
    <tr>
      <td colSpan={colSpan} className="p-0">
        <div className="px-5 pb-5 pt-3 border-t border-white/5 bg-white/[0.02] space-y-3">
          {!hasContent && (
            <p className="text-xs text-white/30 italic">No journal entry for this trade.</p>
          )}

          {/* Emotions + Tags row */}
          {(emotions.length > 0 || tags.length > 0) && (
            <div className="flex flex-wrap gap-1.5">
              {emotions.map((em, i) => (
                <span key={'em-' + i} className="rounded-full border border-violet-400/20 bg-violet-500/10 px-2.5 py-1 text-xs text-violet-200">{em}</span>
              ))}
              {tags.map((tag, i) => (
                <span key={'tag-' + i} className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-1 text-xs text-cyan-200">{tag}</span>
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
              <p className="mt-1 text-sm text-white/70 leading-relaxed whitespace-pre-line">{note}</p>
            </div>
          )}

          {/* Screenshots — clickable thumbnails open carousel */}
          {screenshots.length > 0 && (
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-white/40">Screenshots</span>
              <div className="mt-1.5 flex gap-2 overflow-x-auto">
                {screenshots.map((url, i) => (
                  <button key={i} type="button" onClick={() => onImageClick(screenshots, i)} className="shrink-0 rounded-lg border border-white/10 hover:border-cyan-400/40 transition-colors overflow-hidden">
                    <img src={url} alt={'Screenshot ' + (i + 1)} className="h-20 w-32 object-cover" />
                  </button>
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
      </td>
    </tr>
  );
}

/* ─── Main component ─────────────────────────────────────────── */
export default function CalendarTradeList({ trades }) {
  const [expandedId, setExpandedId] = useState(null);
  const [carousel, setCarousel] = useState(null); // { images, startIndex }

  if (!trades || trades.length === 0) {
    return <p className="text-white/40 text-sm">No trades on this date.</p>;
  }

  function toggle(id) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  function openCarousel(images, startIndex) {
    setCarousel({ images, startIndex });
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
            <div key={t.id} className={'rounded-xl border border-white/10 bg-white/[0.03] border-l-[3px] overflow-hidden ' + leftBorderColor}>
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
              {isOpen && (
                <div className="px-3.5 pb-4 pt-2 border-t border-white/5 bg-white/[0.02] space-y-3">
                  {(() => {
                    const j = t._journal || {};
                    const emotions = j.emotions || [];
                    const tags = j.tags || [];
                    const note = j.note || '';
                    const confidence = j.confidence;
                    const screenshots = j.screenshotUrls || [];
                    const hasContent = note || emotions.length > 0 || tags.length > 0 || screenshots.length > 0 || confidence != null;
                    return (
                      <>
                        {!hasContent && <p className="text-xs text-white/30 italic">No journal entry for this trade.</p>}
                        {(emotions.length > 0 || tags.length > 0) && (
                          <div className="flex flex-wrap gap-1.5">
                            {emotions.map((em, i) => <span key={'em-' + i} className="rounded-full border border-violet-400/20 bg-violet-500/10 px-2.5 py-1 text-xs text-violet-200">{em}</span>)}
                            {tags.map((tag, i) => <span key={'tag-' + i} className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-1 text-xs text-cyan-200">{tag}</span>)}
                          </div>
                        )}
                        {confidence != null && (
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] uppercase tracking-wider text-white/40">Confidence</span>
                            <div className="flex gap-0.5">{[1,2,3,4,5].map((i) => <span key={i} className={'text-sm ' + (i <= confidence ? 'text-amber-400' : 'text-white/15')}>&#9733;</span>)}</div>
                          </div>
                        )}
                        {note && (
                          <div>
                            <span className="font-mono text-[10px] uppercase tracking-wider text-white/40">Journal note</span>
                            <p className="mt-1 text-sm text-white/70 leading-relaxed whitespace-pre-line">{note}</p>
                          </div>
                        )}
                        {screenshots.length > 0 && (
                          <div>
                            <span className="font-mono text-[10px] uppercase tracking-wider text-white/40">Screenshots</span>
                            <div className="mt-1.5 flex gap-2 overflow-x-auto">
                              {screenshots.map((url, i) => (
                                <button key={i} type="button" onClick={() => openCarousel(screenshots, i)} className="shrink-0 rounded-lg border border-white/10 hover:border-cyan-400/40 transition-colors overflow-hidden">
                                  <img src={url} alt={'Screenshot ' + (i + 1)} className="h-20 w-32 object-cover" />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="pt-1">
                          <Link href={'/dashboard/trades/' + t.id} className="inline-flex items-center gap-1 font-mono text-xs text-cyan-400 hover:underline">Open full details <span>&rarr;</span></Link>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Desktop table ── */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr className="text-left font-mono text-xs uppercase tracking-wider text-white/55">
              <th className="px-2 pb-3 w-8"></th>
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
            {trades.map((t, idx) => {
              const win = num(t.pnl) >= 0;
              const isOpen = expandedId === t.id;
              const zebra = idx % 2 === 1 ? 'bg-white/[0.02]' : '';
              const leftBorder = win ? 'border-l-[3px] border-l-emerald-400/40' : 'border-l-[3px] border-l-red-400/40';
              const setupNames = t.setup ? t.setup.split(', ').filter(Boolean) : [];
              const hasJournal = t._journal && (t._journal.hasNote || t._journal.hasImages);

              return (
                <React.Fragment key={t.id}>
                  {/* Data row */}
                  <tr
                    onClick={() => toggle(t.id)}
                    className={'border-t border-white/5 transition-colors hover:bg-white/[0.04] cursor-pointer select-none ' + zebra + ' ' + leftBorder + (isOpen ? ' bg-white/[0.04]' : '')}
                  >
                    {/* Chevron */}
                    <td className="px-2 py-3.5 text-white/30">
                      <ChevronIcon open={isOpen} />
                    </td>

                    {/* Pair */}
                    <td className="px-3 py-3.5 font-display font-semibold">
                      {t.pair}
                      {hasJournal && <span className="ml-1.5 text-xs text-amber-400/70">&#128221;</span>}
                    </td>

                    {/* Direction */}
                    <td className="px-3 py-3.5">
                      <span className={'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ' + (t.direction === 'long' ? 'border-blue-400/30 bg-blue-500/15 text-blue-300' : 'border-red-400/30 bg-red-500/15 text-red-300')}>
                        <svg width="14" height="10" viewBox="0 0 14 10" fill="none" className="shrink-0">{t.direction === 'long' ? <path d="M1 9L4.5 4L7.5 6.5L13 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /> : <path d="M1 1L4.5 6L7.5 3.5L13 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />}</svg>
                        {t.direction === 'long' ? 'Long' : 'Short'}
                      </span>
                    </td>

                    {/* Session */}
                    <td className="px-3 py-3.5 font-mono text-xs text-white/50">{t.session || '—'}</td>

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

                    {/* Setup */}
                    <td className="px-3 py-3.5">
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
                    </td>
                  </tr>

                  {/* Expanded detail panel row */}
                  {isOpen && <DetailPanel trade={t} colSpan={9} onImageClick={openCarousel} />}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Lightbox carousel */}
      {carousel && <ImageCarousel images={carousel.images} startIndex={carousel.startIndex} onClose={() => setCarousel(null)} />}
    </>
  );
}
