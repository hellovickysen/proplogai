"use client";

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

const ShareModal = dynamic(() => import('@/components/share/ShareModal'), {
  ssr: false,
  loading: () => null,
});

export default function DashboardShareMenu({ dailyData, totalData, hasTodayTrades }) {
  const [open, setOpen] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [modalData, setModalData] = useState(null);
  const ref = useRef(null);

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
    if (fab) fab.style.display = modalType ? 'none' : '';
    return () => { if (fab) fab.style.display = ''; };
  }, [modalType]);

  function openModal(type, data) {
    setOpen(false);
    setModalType(type);
    setModalData(data);
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
          <div className="px-4 py-1.5 font-mono text-[10px] uppercase tracking-wider text-white/30">Share P&L</div>

          {/* Today's P&L */}
          {hasTodayTrades ? (
            <button
              onClick={() => openModal('daily', dailyData)}
              className="flex w-full items-center gap-3 px-4 py-3 text-sm text-white/75 hover:bg-white/[0.08] hover:text-white transition-colors text-left"
            >
              <span className="grid w-8 h-8 place-items-center rounded-lg bg-emerald-400/[0.1] text-base">📈</span>
              <div>
                <div className="font-medium">Today&apos;s P&L</div>
                <div className="text-[10px] text-white/35">Share today&apos;s results</div>
              </div>
            </button>
          ) : (
            <div className="flex items-center gap-3 px-4 py-3 text-sm text-white/30">
              <span className="grid w-8 h-8 place-items-center rounded-lg bg-white/[0.04] text-base opacity-40">📈</span>
              <div>
                <div className="font-medium">Today&apos;s P&L</div>
                <div className="text-[10px] text-white/25">No trades today</div>
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="mx-4 my-1 border-t border-white/[0.06]" />

          {/* Total P&L */}
          <button
            onClick={() => openModal('total', totalData)}
            className="flex w-full items-center gap-3 px-4 py-3 text-sm text-white/75 hover:bg-white/[0.08] hover:text-white transition-colors text-left"
          >
            <span className="grid w-8 h-8 place-items-center rounded-lg bg-violet-400/[0.12] text-base">📊</span>
            <div>
              <div className="font-medium">Total P&L</div>
              <div className="text-[10px] text-white/35">Share overall performance</div>
            </div>
          </button>
        </div>
      )}

      {/* Share Modal */}
      {modalType && <ShareModal type={modalType} data={modalData} onClose={() => { setModalType(null); setModalData(null); }} />}
    </div>
  );
}
