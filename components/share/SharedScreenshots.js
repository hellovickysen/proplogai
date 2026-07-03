"use client";

import { useState } from 'react';

export default function SharedScreenshots({ urls }) {
  const [lightboxIdx, setLightboxIdx] = useState(null);

  if (!urls || urls.length === 0) return null;

  return (
    <>
      <div className={'grid gap-2 ' + (urls.length === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2')}>
        {urls.map((url, i) => (
          <button key={i} onClick={() => setLightboxIdx(i)} className="block w-full text-left">
            <img
              src={url}
              alt={'Chart ' + (i + 1)}
              className="max-h-80 w-full rounded-xl border border-white/10 object-contain cursor-pointer transition-all hover:border-white/25 hover:brightness-110"
            />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md"
          onClick={() => setLightboxIdx(null)}
        >
          {/* Close button */}
          <button
            onClick={() => setLightboxIdx(null)}
            className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-black/50 text-lg text-white/70 hover:text-white"
          >
            &#10005;
          </button>

          {/* Navigation arrows */}
          {urls.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setLightboxIdx((lightboxIdx - 1 + urls.length) % urls.length); }}
                className="absolute left-4 z-10 grid h-12 w-12 place-items-center rounded-full border border-white/20 bg-black/50 text-xl text-white/70 hover:text-white"
              >
                &larr;
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setLightboxIdx((lightboxIdx + 1) % urls.length); }}
                className="absolute right-4 z-10 grid h-12 w-12 place-items-center rounded-full border border-white/20 bg-black/50 text-xl text-white/70 hover:text-white"
              >
                &rarr;
              </button>
            </>
          )}

          {/* Image */}
          <img
            src={urls[lightboxIdx]}
            alt={'Chart ' + (lightboxIdx + 1)}
            className="max-h-[90vh] max-w-[95vw] rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Counter */}
          {urls.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-black/60 px-3 py-1 font-mono text-xs text-white/50">
              {lightboxIdx + 1} / {urls.length}
            </div>
          )}
        </div>
      )}
    </>
  );
}
