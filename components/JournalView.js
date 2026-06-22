"use client";

import { useState } from 'react';
import Lightbox from '@/components/Lightbox';

/** Merge legacy screenshot_url + new screenshot_urls into one array. */
function mergeUrls(journal) {
  if (!journal) return [];
  const arr = Array.isArray(journal.screenshot_urls) ? journal.screenshot_urls.filter(Boolean) : [];
  if (arr.length > 0) return arr;
  if (journal.screenshot_url) return [journal.screenshot_url];
  return [];
}

export default function JournalView({ journal }) {
  const [lightboxIdx, setLightboxIdx] = useState(null);

  if (!journal) return null;

  const emotions = journal.emotions || [];
  const confidence = journal.confidence || 0;
  const note = journal.note || '';
  const screenshots = mergeUrls(journal);
  const isEmpty = !note && emotions.length === 0 && confidence === 0 && screenshots.length === 0;

  if (isEmpty) return null;

  return (
    <div className="space-y-4">
      {/* Emotions */}
      {emotions.length > 0 && (
        <div>
          <div className="mb-2 font-mono text-xs uppercase tracking-wider text-white/50">Emotions</div>
          <div className="flex flex-wrap gap-1.5">
            {emotions.map((em, i) => (
              <span key={i} className="rounded-full border border-violet-400/25 bg-violet-500/10 px-2.5 py-1 text-xs text-violet-200">
                {em}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Confidence */}
      {confidence > 0 && (
        <div>
          <div className="mb-1 font-mono text-xs uppercase tracking-wider text-white/50">Confidence</div>
          <div className="flex gap-0.5 text-lg">
            {[1, 2, 3, 4, 5].map((i) => (
              <span key={i} className={i <= confidence ? 'text-amber-400' : 'text-white/40'}>★</span>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {note && (
        <div>
          <div className="mb-1 font-mono text-xs uppercase tracking-wider text-white/50">Notes</div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/70">{note}</p>
        </div>
      )}

      {/* Screenshots — large, full-width */}
      {screenshots.length > 0 && (
        <div>
          <div className="mb-2 font-mono text-xs uppercase tracking-wider text-white/50">
            Screenshots ({screenshots.length})
          </div>
          <div className="space-y-2">
            {screenshots.map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`Trade screenshot ${i + 1}`}
                onClick={() => setLightboxIdx(i)}
                className="w-full cursor-pointer rounded-lg border border-white/10 object-contain transition-opacity hover:opacity-90"
              />
            ))}
          </div>
        </div>
      )}

      {lightboxIdx !== null && (
        <Lightbox images={screenshots} startIndex={lightboxIdx} onClose={() => setLightboxIdx(null)} />
      )}
    </div>
  );
}
