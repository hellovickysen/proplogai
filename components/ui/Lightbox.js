"use client";

import { useState, useEffect, useCallback } from 'react';

export default function Lightbox({ images, startIndex = 0, onClose }) {
  const [idx, setIdx] = useState(startIndex);

  const prev = useCallback(() => setIdx((i) => (i > 0 ? i - 1 : images.length - 1)), [images.length]);
  const next = useCallback(() => setIdx((i) => (i < images.length - 1 ? i + 1 : 0)), [images.length]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, prev, next]);

  if (!images || images.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm" onClick={onClose}>
      <div className="relative flex h-full w-full max-w-5xl flex-col items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-black/60 text-white/80 hover:text-white"
        >
          ✕
        </button>

        {/* Counter */}
        {images.length > 1 && (
          <div className="absolute top-5 left-1/2 -translate-x-1/2 font-mono text-xs text-white/50">
            {idx + 1} / {images.length}
          </div>
        )}

        {/* Prev arrow */}
        {images.length > 1 && (
          <button
            onClick={prev}
            className="absolute left-2 sm:left-4 top-1/2 z-10 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/60 text-xl text-white/80 hover:text-white"
          >
            ‹
          </button>
        )}

        {/* Image */}
        <img
          src={images[idx]}
          alt={`Screenshot ${idx + 1}`}
          className="max-h-[85vh] max-w-full rounded-lg object-contain"
        />

        {/* Next arrow */}
        {images.length > 1 && (
          <button
            onClick={next}
            className="absolute right-2 sm:right-4 top-1/2 z-10 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/60 text-xl text-white/80 hover:text-white"
          >
            ›
          </button>
        )}

        {/* Thumbnail strip */}
        {images.length > 1 && (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
            {images.map((url, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={'h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border-2 ' + (i === idx ? 'border-cyan-400' : 'border-white/10 opacity-50 hover:opacity-80')}
              >
                <img src={url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
