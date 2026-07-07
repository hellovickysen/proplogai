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

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Hide FAB when modal is open
  useEffect(() => {
    const fab = document.querySelector('[data-fab-menu]');
    if (fab) fab.style.display = showPnlModal ? 'none' : '';
    return () => { if (fab) fab.style.display = ''; };
  }, [showPnlModal]);

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

      {/* Backdrop blur */}
      {open && (
        <div className="fixed inset-0 z-[998] bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
      )}

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-56 rounded-2xl py-2 z-[999]"
          style={{
            background: 'rgba(18, 18, 26, 0.95)',
            border: '1px solid rgba(167, 139, 250, 0.25)',
            boxShadow: '0 0 30px rgba(167, 139, 250, 0.15), 0 20px 60px rgba(0, 0, 0, 0.5)',
          }}
        >
          <div className="px-4 py-1.5 font-mono text-[10px] uppercase tracking-wider text-white/30">Share Trade</div>

          {/* P&L Card */}
          <button
            onClick={handleSharePnl}
            className="flex w-full items-center gap-3 px-4 py-3 text-sm text-white/75 hover:bg-white/[0.08] hover:text-white transition-colors text-left"
          >
            <span className="grid w-8 h-8 place-items-center rounded-lg bg-violet-400/[0.12] text-base">📊</span>
            <div>
              <div className="font-medium">P&L Card</div>
              <div className="text-[10px] text-white/35">Image for social media</div>
            </div>
          </button>

          {/* Divider */}
          <div className="mx-4 my-1 border-t border-white/[0.06]" />

          {/* Journal Link */}
          <button
            onClick={handleShareJournal}
            disabled={loading}
            className="flex w-full items-center gap-3 px-4 py-3 text-sm text-white/75 hover:bg-white/[0.08] hover:text-white transition-colors text-left disabled:opacity-50"
          >
            <span className="grid w-8 h-8 place-items-center rounded-lg bg-cyan-400/[0.1] text-base">🔗</span>
            <div>
              <div className="font-medium flex items-center gap-2">
                Journal Link
                {isShared && <span className="text-[9px] font-mono text-emerald-400 bg-emerald-400/[0.1] px-1.5 py-0.5 rounded">{timeRemaining(sharedUntil)}</span>}
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
