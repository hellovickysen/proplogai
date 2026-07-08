"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteTrade } from '@/app/dashboard/trades/actions';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

export default function DeleteTradeButton({ tradeId, pair, compact }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setLoading(true);
    const result = await deleteTrade(tradeId);
    if (result?.error) {
      setLoading(false);
      setOpen(false);
      alert(result.error);
    } else {
      router.push('/dashboard/trades');
      router.refresh();
    }
  }

  return (
    <>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}
        className={compact
          ? 'rounded-lg p-1.5 text-white/25 hover:text-red-400 hover:bg-red-500/10 transition-colors'
          : 'inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-red-400/20 bg-red-500/[0.05] text-sm text-red-400 hover:bg-red-500/10 transition-colors'
        }
        title="Delete trade"
      >
        {compact ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14" />
          </svg>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14" />
            </svg>
            Delete Trade
          </>
        )}
      </button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleDelete}
        title="Delete trade"
        message={`Are you sure you want to delete ${pair || 'this trade'}? This will also remove the journal entry, AI analysis, and any screenshots. This action cannot be undone.`}
        confirmLabel="Delete"
        loadingLabel="Deleting..."
        loading={loading}
      />
    </>
  );
}
