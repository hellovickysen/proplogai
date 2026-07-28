'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import ShareCalendarCard from '@/components/share/ShareCalendarCard';

export default function ShareCalendarModal({ trades, year, month, monthlyPnl, onClose }) {
  const [ratio] = useState('1:1');
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [rendering, setRendering] = useState(true);
  const cardRef = useRef(null);

  useEffect(function () {
    if (typeof window !== 'undefined') {
      if (!window.html2canvas) {
        var script = document.createElement('script');
        script.src =
          'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
        script.async = true;
        script.onload = function () {
          renderPreview();
        };
        document.head.appendChild(script);
      }
      setCanShare(!!navigator.share && !!navigator.canShare);
    }
  }, []);

  var renderPreview = useCallback(
    async function () {
      if (!cardRef.current || !window.html2canvas) return;
      setRendering(true);
      try {
        /* Wait for Poppins (and all other fonts) to finish loading */
        if (document.fonts && document.fonts.ready) {
          await document.fonts.ready;
        }
        var canvas = await window.html2canvas(cardRef.current, {
          scale: 3,
          useCORS: true,
          backgroundColor: '#07070b',
        });
        setPreviewUrl(canvas.toDataURL('image/png'));
      } catch (e) {
        console.error('Calendar preview render failed:', e);
      }
      setRendering(false);
    },
    []
  );

  useEffect(
    function () {
      var timer = setTimeout(function () {
        renderPreview();
      }, 200);
      return function () {
        clearTimeout(timer);
      };
    },
    [ratio, renderPreview]
  );

  useEffect(function () {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return function () {
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  var monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];

  var getFilename = useCallback(
    function () {
      return (
        'proplogai-calendar-' +
        monthNames[month] +
        year +
        '-' +
        ratio.replace(':', 'x') +
        '.png'
      );
    },
    [ratio, month, year]
  );

  var download = useCallback(
    async function () {
      setDownloading(true);
      try {
        if (!cardRef.current || !window.html2canvas) return;
        if (document.fonts && document.fonts.ready) await document.fonts.ready;
        var canvas = await window.html2canvas(cardRef.current, {
          scale: 3,
          useCORS: true,
          backgroundColor: '#07070b',
        });
        var link = document.createElement('a');
        link.download = getFilename();
        link.href = canvas.toDataURL('image/png');
        link.click();
      } catch (e) {
        console.error('Calendar download failed:', e);
      }
      setDownloading(false);
    },
    [getFilename]
  );

  var share = useCallback(
    async function () {
      setSharing(true);
      try {
        if (!cardRef.current || !window.html2canvas) return;
        if (document.fonts && document.fonts.ready) await document.fonts.ready;
        var canvas = await window.html2canvas(cardRef.current, {
          scale: 3,
          useCORS: true,
          backgroundColor: '#07070b',
        });
        var blob = await new Promise(function (resolve) {
          canvas.toBlob(resolve, 'image/png');
        });
        var file = new File([blob], getFilename(), { type: 'image/png' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'My PropLogAI Calendar',
            text: monthNames[month] + ' ' + year + ' trading calendar',
          });
        } else {
          var link = document.createElement('a');
          link.download = getFilename();
          link.href = canvas.toDataURL('image/png');
          link.click();
        }
      } catch (e) {
        if (e.name !== 'AbortError') console.error('Calendar share failed:', e);
      }
      setSharing(false);
    },
    [getFilename, month, year]
  );

  var isSquare = ratio === '1:1';
  var previewW = isSquare ? 400 : 544;
  var previewH = isSquare ? 400 : 306;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[95vh] w-full max-w-3xl flex-col items-center gap-5 overflow-y-auto p-4 sm:p-6"
        onClick={function (e) { e.stopPropagation(); }}
      >
        {/* close */}
        <button
          onClick={onClose}
          className="absolute right-2 top-2 grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-black/60 text-white/70 hover:text-white"
        >
          &#10005;
        </button>

        {/* title */}
        <div className="text-center">
          <h2 className="font-display text-lg font-bold">Share your calendar</h2>
          <p className="mt-1 text-xs text-white/40">
            Download or share your monthly performance
          </p>
        </div>

        {/* offscreen card for html2canvas */}
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
          <ShareCalendarCard
            ref={cardRef}
            trades={trades}
            year={year}
            month={month}
            ratio={ratio}
            monthlyPnl={monthlyPnl}
          />
        </div>

        {/* preview */}
        <div className="w-fit max-w-full overflow-hidden rounded-xl border border-white/10 shadow-2xl">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Calendar Preview"
              className="max-w-full"
              style={{ width: previewW, height: previewH, display: 'block' }}
            />
          ) : (
            <div
              className="flex max-w-full items-center justify-center bg-white/[0.03]"
              style={{ width: previewW, height: previewH }}
            >
              <span className="text-sm text-white/40">
                {rendering ? 'Rendering...' : 'Loading...'}
              </span>
            </div>
          )}
        </div>

        {/* action buttons */}
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
            className={
              'rounded-xl px-6 py-3 text-sm font-semibold disabled:opacity-60 transition-transform hover:-translate-y-0.5 ' +
              (canShare
                ? 'border border-white/15 bg-white/5 text-white/80 hover:bg-white/10'
                : 'text-[#08080f]')
            }
            style={canShare ? {} : { background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}
          >
            {downloading ? 'Generating...' : '⬇ Download PNG'}
          </button>
        </div>

        <p className="text-[10px] text-white/40">
          HD export &middot; Share on Twitter, Instagram, or TikTok
        </p>
      </div>
    </div>
  );
}
