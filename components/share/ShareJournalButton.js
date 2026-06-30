"use client";

import { useState, useEffect } from 'react';
import { shareTrade, unshareTrade } from '@/app/dashboard/trades/actions';
import { useToast } from '@/components/ui/Toast';

function timeRemaining(sharedUntil) {
  if (!sharedUntil) return '';
  const diff = new Date(sharedUntil) - new Date();
  if (diff <= 0) return 'Expired';
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hours > 0) return hours + 'h ' + mins + 'm left';
  return mins + 'm left';
}

export default function ShareJournalButton({ tradeId, initialShareId, initialSharedUntil }) {
  const toast = useToast();
  const [shareId, setShareId] = useState(initialShareId || null);
  const [sharedUntil, setSharedUntil] = useState(initialSharedUntil || null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [remaining, setRemaining] = useState('');
  const [origin, setOrigin] = useState('');

  const isActive = shareId && sharedUntil && new Date(sharedUntil) > new Date();
  const shareUrl = shareId ? origin + '/trade/' + shareId : '';

  // Set origin client-side to avoid SSR hydration mismatch
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  // Update countdown every minute
  useEffect(() => {
    if (!isActive) return;
    setRemaining(timeRemaining(sharedUntil));
    const interval = setInterval(() => {
      const r = timeRemaining(sharedUntil);
      setRemaining(r);
      if (r === 'Expired') {
        setShareId(null);
        setSharedUntil(null);
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [isActive, sharedUntil]);

  async function handleShare() {
    setLoading(true);
    const res = await shareTrade(tradeId);
    setLoading(false);
    if (res.error) { if (toast) toast.error(res.error); return; }
    setShareId(res.shareId);
    setSharedUntil(res.sharedUntil);
    setRemaining(timeRemaining(res.sharedUntil));
    setShowModal(true);
  }

  async function handleRevoke() {
    setLoading(true);
    const res = await unshareTrade(tradeId);
    setLoading(false);
    if (res.error) { if (toast) toast.error(res.error); return; }
    setShareId(null);
    setSharedUntil(null);
    setShowModal(false);
    if (toast) toast.success('Share link revoked');
  }

  function handleCopy() {
    navigator.clipboard.writeText(shareUrl);
    if (toast) toast.success('Link copied!');
  }

  return (
    <>
      <button
        onClick={isActive ? () => setShowModal(true) : handleShare}
        disabled={loading}
        className={'rounded-lg border px-3 py-2 text-xs font-semibold transition-all disabled:opacity-60 ' + (isActive ? 'border-cyan-400/30 bg-cyan-500/10 text-cyan-300' : 'border-white/15 bg-white/5 text-white/60 hover:text-white')}
      >
        {loading ? 'Sharing...' : isActive ? '🔗 Shared' : '📤 Share Journal'}
      </button>

      {/* Share modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center sm:items-center" onClick={() => setShowModal(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative mx-4 w-full max-w-md rounded-2xl border border-white/10 bg-[#0e0e18] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-display text-base font-bold">Share Trade Journal</h3>
              <button onClick={() => setShowModal(false)} className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/5 text-xs text-white/60">&#10005;</button>
            </div>

            {/* Status */}
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-cyan-400/20 bg-cyan-500/[0.06] px-3 py-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
              <span className="font-mono text-xs text-cyan-300">Live — {remaining}</span>
            </div>

            {/* Info */}
            <p className="mb-4 text-xs text-white/45">
              Anyone with this link can view your trade details, journal entry, and AI analysis for the next 24 hours. After that, the link expires automatically.
            </p>

            {/* URL */}
            <div className="mb-4 flex gap-2">
              <input
                className="flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 font-mono text-xs text-white/70 outline-none"
                value={shareUrl}
                readOnly
                onClick={(e) => e.target.select()}
              />
              <button onClick={handleCopy} className="flex-shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold text-[#08080f]" style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}>
                Copy
              </button>
            </div>

            {/* Revoke */}
            <button onClick={handleRevoke} disabled={loading} className="w-full rounded-lg border border-red-400/20 bg-red-500/[0.06] py-2.5 text-xs font-semibold text-red-300 transition-colors hover:bg-red-500/15 disabled:opacity-60">
              {loading ? 'Revoking...' : 'Revoke link early'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
