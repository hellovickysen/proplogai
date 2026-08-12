"use client";

import { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';

/* ─── Lightbox Carousel ──────────────────────────────────────── */
function Lightbox({ images, startIndex, onClose }) {
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

  return createPortal(
    <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="relative max-h-[90vh] max-w-full" onClick={(e) => e.stopPropagation()}>
        {/* Close */}
        <button onClick={onClose} aria-label="Close screenshot" className="absolute -top-10 right-0 text-3xl font-light text-white/75 hover:text-white">&times;</button>

        {/* Image */}
        <img src={images[idx]} alt={'Screenshot ' + (idx + 1)} className="max-h-[70vh] max-w-[calc(100vw-2rem)] rounded-xl border border-white/10 object-contain sm:max-h-[85vh] sm:max-w-[85vw]" />

        {/* Nav arrows */}
        {images.length > 1 && (
          <>
            <button onClick={(e) => { e.stopPropagation(); prev(); }} aria-label="Previous screenshot" className="absolute left-2 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/65 text-3xl text-white shadow-lg transition-colors hover:bg-black/85 sm:left-0 sm:-translate-x-12">&#8249;</button>
            <button onClick={(e) => { e.stopPropagation(); next(); }} aria-label="Next screenshot" className="absolute right-2 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/65 text-3xl text-white shadow-lg transition-colors hover:bg-black/85 sm:right-0 sm:translate-x-12">&#8250;</button>
          </>
        )}

        {/* Counter */}
        {images.length > 1 && (
          <div className="mt-3 text-center font-mono text-xs text-white/60">{idx + 1} / {images.length}</div>
        )}
      </div>
    </div>,
    document.body
  );
}

/**
 * Screenshot gallery with lightbox carousel.
 *
 * @param {string[]} urls - Array of screenshot URLs
 * @param {string} layout - 'grid' (default, for trade detail) or 'row' (horizontal scroll, for compact panels)
 */
export default function ScreenshotGallery({ urls, layout = 'grid' }) {
  const [lightbox, setLightbox] = useState(null);

  if (!urls || urls.length === 0) return null;

  const gridClass = layout === 'row'
    ? 'flex gap-2 overflow-x-auto'
    : 'grid grid-cols-1 sm:grid-cols-2 gap-3';

  const imgClass = layout === 'row'
    ? 'h-20 w-32 object-cover'
    : 'w-full h-auto max-h-80 object-contain bg-black/50';

  return (
    <>
      <div className={gridClass}>
        {urls.map((url, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setLightbox({ images: urls, startIndex: i })}
            className={'block rounded-xl overflow-hidden border border-white/10 hover:border-violet-400/30 transition-colors cursor-pointer ' + (layout === 'row' ? 'shrink-0' : '')}
          >
            <img src={url} alt={'Screenshot ' + (i + 1)} className={imgClass} />
          </button>
        ))}
      </div>

      {lightbox && (
        <Lightbox images={lightbox.images} startIndex={lightbox.startIndex} onClose={() => setLightbox(null)} />
      )}
    </>
  );
}
