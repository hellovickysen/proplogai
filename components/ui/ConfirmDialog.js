"use client";

import { useEffect, useRef } from 'react';

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel, loading }) {
  const cancelRef = useRef(null);

  // Escape key handler to dismiss
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Auto-focus on Cancel button when opened
  useEffect(() => {
    if (open && cancelRef.current) {
      cancelRef.current.focus();
    }
  }, [open]);

  if (!open) return null;

  const titleId = 'confirm-dialog-title';
  const messageId = 'confirm-dialog-message';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        className="mx-4 w-full max-w-sm rounded-2xl border border-white/10 bg-[#0e0e18] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Warning icon */}
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-red-500/15">
          <svg className="h-6 w-6 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>

        <h2 id={titleId} className="text-center font-display text-lg font-bold">{title || 'Are you sure?'}</h2>
        <p id={messageId} className="mt-2 text-center text-sm text-white/55">{message || "This action can't be undone."}</p>

        <div className="mt-6 flex gap-3">
          <button
            ref={cancelRef}
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/70 hover:bg-white/[0.08] disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-xl border border-red-400/30 bg-red-500/20 px-4 py-2.5 text-sm font-semibold text-red-300 hover:bg-red-500/30 disabled:opacity-60"
          >
            {loading ? 'Deleting...' : confirmLabel || 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
