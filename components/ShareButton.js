"use client";

import { useState } from 'react';
import ShareModal from '@/components/ShareModal';

/**
 * ShareButton — renders a share icon button that opens the ShareModal.
 * type: "daily" | "trade"
 * data: stats object for the card
 */
export default function ShareButton({ type, data, className = '' }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={'rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/60 hover:text-white ' + className}
        title="Share as image"
      >
        📤 Share
      </button>
      {open && <ShareModal type={type} data={data} onClose={() => setOpen(false)} />}
    </>
  );
}
