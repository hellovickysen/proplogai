"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import ShareCard from '@/components/share/ShareCard';
import { getQuote } from '@/lib/quotes';

/**
 * ShareModal — fullscreen overlay with:
 * - Aspect ratio toggle (Story 9:16 / Landscape 16:9)
 * - Live preview of the share card
 * - Download PNG button (html2canvas from CDN)
 * - Mobile share button (Web Share API)
 */
export default function ShareModal({ type, data, onClose }) {
  const [ratio, setRatio] = useState('9:16');
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const [quote] = useState(() => getQuote(data.pnl));
  const cardRef = useRef(null);

  // Load html2canvas from CDN on mount + detect Web Share API
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!window.html2canvas) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
        script.async = true;
        document.head.appendChild(script);
      }
      // Check if Web Share API with file sharing is available (mainly mobile)
      setCanShare(!!navigator.share && !!navigator.canShare);
    }
  }, []);

  // ESC to close
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Generate canvas from card DOM
  const generateCanvas = useCallback(async () => {
    if (!cardRef.current || !window.html2canvas) return null;
    return window.html2canvas(cardRef.current, {
      scale: 3,
      useCORS: true,
      backgroundColor: '#07070b',
    });
  }, []);

  const getFilename = useCallback(() => {
    const dateStr = (data.date || data.trade_date || 'trade').replace(/\//g, '-');
    return 'propjournal-' + type + '-' + dateStr + '-' + ratio.replace(':', 'x') + '.png';
  }, [ratio, type, data]);

  // Download PNG
  const download = useCallback(async () => {
    setDownloading(true);
    try {
      const canvas = await generateCanvas();
      if (!canvas) return;
      const link = document.createElement('a');
      link.download = getFilename();
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error('Download failed:', e);
    }
    setDownloading(false);
  }, [generateCanvas, getFilename]);

  // Share via Web Share API (mobile)
  const share = useCallback(async () => {
    setSharing(true);
    try {
      const canvas = await generateCanvas();
      if (!canvas) return;
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      const file = new File([blob], getFilename(), { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'My PropJournal P&L',
          text: type === 'daily'
            ? `Today's P&L: ${data.pnl >= 0 ? '+' : '-'}$${Math.abs(data.pnl || 0).toFixed(2)} 📈`
            : `${data.pair || 'Trade'} P&L: ${data.pnl >= 0 ? '+' : '-'}$${Math.abs(data.pnl || 0).toFixed(2)}`,
        });
      } else {
        // Fallback: download instead
        const link = document.createElement('a');
        link.download = getFilename();
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
    } catch (e) {
      if (e.name !== 'AbortError') console.error('Share failed:', e);
    }
    setSharing(false);
  }, [generateCanvas, getFilename, type, data]);

  const isStory = ratio === '9:16';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm" onClick={onClose}>
      <div className="relative flex max-h-[95vh] max-w-3xl flex-col items-center gap-5 overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        {/* Close */}
        <button onClick={onClose} className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-black/60 text-white/70 hover:text-white">✕</button>

        {/* Title */}
        <div className="text-center">
          <h2 className="font-display text-lg font-bold">Share your results</h2>
          <p className="mt-1 text-xs text-white/40">Download or share to social media</p>
        </div>

        {/* Ratio toggle */}
        <div className="flex gap-1 rounded-lg border border-white/10 bg-white/[0.03] p-0.5">
          <button
            onClick={() => setRatio('9:16')}
            className={'rounded-md px-4 py-2 text-xs font-semibold transition-colors ' + (isStory ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60')}
          >
            Story (9:16)
          </button>
          <button
            onClick={() => setRatio('16:9')}
            className={'rounded-md px-4 py-2 text-xs font-semibold transition-colors ' + (!isStory ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60')}
          >
            Landscape (16:9)
          </button>
        </div>

        {/* Card preview */}
        <div className="rounded-xl border border-white/10 overflow-hidden shadow-2xl" style={{ transform: 'scale(0.85)', transformOrigin: 'top center' }}>
          <ShareCard ref={cardRef} type={type} ratio={ratio} data={data} quote={quote} />
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          {/* Share button (mobile) */}
          {canShare && (
            <button
              onClick={share}
              disabled={sharing}
              className="rounded-xl px-6 py-3 text-sm font-semibold text-[#08080f] disabled:opacity-60 transition-transform hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}
            >
              {sharing ? 'Preparing…' : '📤 Share'}
            </button>
          )}

          {/* Download button */}
          <button
            onClick={download}
            disabled={downloading}
            className={'rounded-xl px-6 py-3 text-sm font-semibold disabled:opacity-60 transition-transform hover:-translate-y-0.5 ' +
              (canShare
                ? 'border border-white/15 bg-white/5 text-white/80 hover:bg-white/10'
                : 'text-[#08080f]'
              )
            }
            style={canShare ? {} : { background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}
          >
            {downloading ? 'Generating…' : '⬇ Download PNG'}
          </button>
        </div>

        <p className="text-[10px] text-white/25">HD export · Share on Twitter, Instagram Stories, or TikTok</p>
      </div>
    </div>
  );
}
