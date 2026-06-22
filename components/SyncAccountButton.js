"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { syncAccount, removeAccount } from '@/app/dashboard/accounts/actions';

export default function SyncAccountButton({ accountId }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [error, setError] = useState(null);

  async function onSync() {
    setBusy(true);
    setError(null);
    setMsg(null);
    const res = await syncAccount(accountId);
    if (res && res.error) {
      setError(res.error);
    } else {
      setMsg(res.message || ('Synced ' + (res.imported || 0) + ' trade(s).'));
      router.refresh();
    }
    setBusy(false);
  }

  async function onRemove() {
    if (!window.confirm('Disconnect this account? Already-imported trades stay in your journal.')) return;
    setBusy(true);
    const res = await removeAccount(accountId);
    if (res && res.error) {
      setError(res.error);
      setBusy(false);
    } else {
      router.refresh();
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        <button onClick={onSync} disabled={busy} className="rounded-lg px-4 py-1.5 text-sm font-semibold text-[#08080f] disabled:opacity-60" style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}>
          {busy ? 'Syncing…' : 'Sync'}
        </button>
        <button onClick={onRemove} disabled={busy} className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-white/60 hover:text-white">Remove</button>
      </div>
      {msg ? <p className="text-xs text-emerald-400">{msg}</p> : null}
      {error ? <p className="max-w-[260px] text-right text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
