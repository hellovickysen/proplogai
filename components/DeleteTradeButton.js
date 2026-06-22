"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteTrade } from '@/app/dashboard/trades/actions';

export default function DeleteTradeButton({ tradeId }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    if (!window.confirm('Delete this trade? This cannot be undone.')) return;
    setBusy(true);
    const res = await deleteTrade(tradeId);
    if (res && res.error) {
      window.alert(res.error);
      setBusy(false);
    } else {
      router.push('/dashboard/trades');
      router.refresh();
    }
  }

  return (
    <button
      onClick={onDelete}
      disabled={busy}
      className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-sm font-semibold text-red-300 transition-colors hover:bg-red-500/20 disabled:opacity-60"
    >
      {busy ? 'Deleting…' : 'Delete'}
    </button>
  );
}
