"use client";

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { shareTrade, unshareTrade } from '@/app/dashboard/trades/actions';
import { useToast } from '@/components/ui/Toast';

const ShareModal = dynamic(() => import('@/components/share/ShareModal'), {
  ssr: false,
  loading: () => null,
});

function timeRemaining(sharedUntil) {
  if (!sharedUntil) return '';
  const diff = new Date(sharedUntil) - new Date();
  if (diff <= 0) return 'Expired';
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hours > 0) return hours + 'h ' + mins + 'm left';
  return mins + 'm left';
}

export default function TradeShareMenu({ tradeId, tradeData, initialShareId, initialSharedUntil }) {
  const [open, setOpen] = useState(false);
  const [showPnlModal, setShowPnlModal] = useState(false);
  const [shareId, setShareId] = useState(initialShareId || null);
  const [sharedUntil, setSharedUntil] = useState(initialSharedUntil || null);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);
  const toast = useToast?.() || { success: () => {}, error: () => {} };

  const isShared = shareId && sharedUntil && new Date(sharedUntil) > new Date();

  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  async function handleShareJournal() {
    setOpen(false);
    setLoading(true);
    try {
      if (isShared) {
        const res = await unshareTrade(tradeId);
        if (res.ok) {
          setShareId(null);
          setSharedUntil(null);
          toast.success?.('Share link removed');
        }
      } else {
        const res = await shareTrade(tradeId);
        if (res.ok) {
          setShareId(res.shareId);
          setSharedUntil(res.sharedUntil);
          const url = `${window.location.origin}/trade/${res.shareId}`;
          await navigator.clipboard?.writeText(url);
          toast.success?.('Link copied! Expires in 24h');
        }
      }
    } catch (e) {
      toast.error?.('Share failed');
    }
    setLoading(false);
  }

  function handleSharePnl() {
    setOpen(false);
    setShowPnlModal(true);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/60 hover:text-white transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
        </svg>
        Share
        {isShared && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-52 rounded-xl border border-white/10 bg-[#12121a] py-1.5 shadow-xl z-50">
          <button
            onClick={handleSharePnl}
            className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm text-white/70 hover:bg-white/[0.06] hover:text-white transition-colors text-left"
          >
            <span className="text-base">📊</span>
            <div>
              <div className="font-medium">P&L Card</div>
              <div className="text-[10px] text-white/35">Image for social media</div>
            </div>
          </button>
          <button
            onClick={handleShareJournal}
            disabled={loading}
            className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm text-white/70 hover:bg-white/[0.06] hover:text-white transition-colors text-left disabled:opacity-50"
          >
            <span className="text-base">🔗</span>
            <div>
              <div className="font-medium flex items-center gap-1.5">
                Journal Link
                {isShared && <span className="text-[9px] font-mono text-emerald-400">{timeRemaining(sharedUntil)}</span>}
              </div>
              <div className="text-[10px] text-white/35">{isShared ? 'Click to unshare' : '24h shareable link'}</div>
            </div>
          </button>
        </div>
      )}

      {/* P&L Card Modal */}
      {showPnlModal && <ShareModal type="trade" data={tradeData} onClose={() => setShowPnlModal(false)} />}
    </div>
  );
}
