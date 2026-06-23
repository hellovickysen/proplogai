"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import ShareCard from '@/components/ShareCard';
import { getQuote } from '@/lib/quotes';

/**
 * ShareModal — opens a fullscreen overlay with:
 * - Aspect ratio toggle (Story 9:16 / Landscape 16:9)
 * - Live preview of the share card
 * - Download PNG button (uses html2canvas from CDN)
 *
 * Props:
 *   type: "daily" | "trade"
 *   data: { pnl, date, trades, winRate, bestTrade, worstTrade, pair, direction, ... }
 *   onClose: () => void
 */
export default function ShareModal({ type, data, onClose }) {
  const [ratio, setRatio] = useState('9:16');
  const [downloading, setDownloading] = useState(false);
  const [quote] = useState(() => getQuote(data.pnl));
  const cardRef = useRef(null);

  // Load html2canvas from CDN on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.html2canvas) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  // ESC to close
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const download = useCallback(async () => {
    if (!cardRef.current || !window.html2canvas) return;
    setDownloading(true);
    try {
      const canvas = await window.html2canvas(cardRef.current, {
        scale: 3, // High-res export
        useCORS: true,
        backgroundColor: '#07070b',
      });
      const link = document.createElement('a');
      const dateStr = (data.date || data.trade_date || 'trade').replace(/\//g, '-');
      link.download = 'propjournal-' + type + '-' + dateStr + '-' + ratio.replace(':', 'x') + '.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error('Download failed:', e);
    }
    setDownloading(false);
  }, [ratio, type, data]);

  const isStory = ratio === '9:16';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm" onClick={onClose}>
      <div className="relative flex max-h-[95vh] max-w-3xl flex-col items-center gap-5 overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        {/* Close */}
        <button onClick={onClose} className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-black/60 text-white/70 hover:text-white">✕</button>

        {/* Title */}
        <div className="text-center">
          <h2 className="font-display text-lg font-bold">Share your results</h2>
          <p className="mt-1 text-xs text-white/40">Download and post to social media</p>
        </div>

        {/* Ratio toggle */}
        <div className="flex gap-1 rounded-lg border border-white/10 bg-white/[0.03] p-0.5">
          <button
            onClick={() => setRatio('9:16')}
            className={'rounded-md px-4 py-2 text-xs font-semibold ' + (isStory ? 'bg-white/10 text-white' : 'text-white/40')}
          >
            📱 Story (9:16)
          </button>
          <button
            onClick={() => setRatio('16:9')}
            className={'rounded-md px-4 py-2 text-xs font-semibold ' + (!isStory ? 'bg-white/10 text-white' : 'text-white/40')}
          >
            🖥 Landscape (16:9)
          </button>
        </div>

        {/* Card preview */}
        <div className="rounded-xl border border-white/10 overflow-hidden shadow-2xl" style={{ transform: 'scale(0.85)', transformOrigin: 'top center' }}>
          <ShareCard ref={cardRef} type={type} ratio={ratio} data={data} quote={quote} />
        </div>

        {/* Download button */}
        <button
          onClick={download}
          disabled={downloading}
          className="rounded-xl px-6 py-3 text-sm font-semibold text-[#08080f] disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg,#ffc42d,#ff9f1c)' }}
        >
          {downloading ? 'Generating…' : '⬇ Download PNG'}
        </button>

        <p className="text-[10px] text-white/25">Tip: Share on Twitter, Instagram Stories, or TikTok to flex your trading results</p>
      </div>
    </div>
  );
}
