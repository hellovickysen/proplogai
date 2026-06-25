"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import ShareCard from '@/components/share/ShareCard';
import { getQuote } from '@/lib/quotes';

export default function ShareModal({ type, data, onClose }) {
  const [ratio, setRatio] = useState('9:16');
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const [quote] = useState(() => getQuote(data.pnl));
  const [previewUrl, setPreviewUrl] = useState(null);
  const [rendering, setRendering] = useState(true);
  const cardRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!window.html2canvas) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
        script.async = true;
        script.onload = () => renderPreview();
        document.head.appendChild(script);
      }
      setCanShare(!!navigator.share && !!navigator.canShare);
    }
  }, []);

  const renderPreview = useCallback(async () => {
    if (!cardRef.current || !window.html2canvas) return;
    setRendering(true);
    try {
      const canvas = await window.html2canvas(cardRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#07070b',
      });
      canvasRef.current = canvas;
      setPreviewUrl(canvas.toDataURL('image/png'));
    } catch (e) {
      console.error('Preview render failed:', e);
    }
    setRendering(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => renderPreview(), 100);
    return () => clearTimeout(timer);
  }, [ratio, renderPreview]);

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const getFilename = useCallback(() => {
    const dateStr = (data.date || data.trade_date || 'trade').replace(/\//g, '-');
    return 'proplogai-' + type + '-' + dateStr + '-' + ratio.replace(':', 'x') + '.png';
  }, [ratio, type, data]);

  const download = useCallback(async () => {
    setDownloading(true);
    try {
      if (!cardRef.current || !window.html2canvas) return;
      const canvas = await window.html2canvas(cardRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#07070b',
      });
      const link = document.createElement('a');
      link.download = getFilename();
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error('Download failed:', e);
    }
    setDownloading(false);
  }, [getFilename]);

  const share = useCallback(async () => {
    setSharing(true);
    try {
      if (!cardRef.current || !window.html2canvas) return;
      const canvas = await window.html2canvas(cardRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#07070b',
      });
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      const file = new File([blob], getFilename(), { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'My PropLogAI P&L',
          text: type === 'daily'
            ? 'Today\'s P&L: ' + (data.pnl >= 0 ? '+' : '-') + '$' + Math.abs(data.pnl || 0).toFixed(2)
            : (data.pair || 'Trade') + ' P&L: ' + (data.pnl >= 0 ? '+' : '-') + '$' + Math.abs(data.pnl || 0).toFixed(2),
        });
      } else {
        const link = document.createElement('a');
        link.download = getFilename();
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
    } catch (e) {
      if (e.name !== 'AbortError') console.error('Share failed:', e);
    }
    setSharing(false);
  }, [getFilename, type, data]);

  const isStory = ratio === '9:16';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm" onClick={onClose}>
      <div className="relative flex max-h-[95vh] w-full max-w-3xl flex-col items-center gap-5 overflow-y-auto p-4 sm:p-6" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-2 top-2 grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-black/60 text-white/70 hover:text-white">&#10005;</button>

        <div className="text-center">
          <h2 className="font-display text-lg font-bold">Share your results</h2>
          <p className="mt-1 text-xs text-white/40">Download or share to social media</p>
        </div>

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

        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
          <ShareCard ref={cardRef} type={type} ratio={ratio} data={data} quote={quote} />
        </div>

        <div className="w-fit max-w-full overflow-hidden rounded-xl border border-white/10 shadow-2xl">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="P&L Card Preview"
              className="max-w-full"
              style={{
                width: isStory ? 306 : 544,
                height: isStory ? 544 : 306,
                display: 'block',
              }}
            />
          ) : (
            <div
              className="flex max-w-full items-center justify-center bg-white/[0.03]"
              style={{ width: isStory ? 306 : 544, height: isStory ? 544 : 306 }}
            >
              <span className="text-sm text-white/40">{rendering ? 'Rendering...' : 'Loading...'}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {canShare && (
            <button
              onClick={share}
              disabled={sharing}
              className="rounded-xl px-6 py-3 text-sm font-semibold text-[#08080f] disabled:opacity-60 transition-transform hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}
            >
              {sharing ? 'Preparing...' : '📤 Share'}
            </button>
          )}

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
            {downloading ? 'Generating...' : '⬇ Download PNG'}
          </button>
        </div>

        <p className="text-[10px] text-white/25">HD export &middot; Share on Twitter, Instagram Stories, or TikTok</p>
      </div>
    </div>
  );
}
