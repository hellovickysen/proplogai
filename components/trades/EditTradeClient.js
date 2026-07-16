"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TradeForm from '@/components/trades/TradeForm';
import JournalInlineEdit from '@/components/trades/JournalInlineEdit';

export default function EditTradeClient({ tradeId, trade, prefs, setups, journal, screenshots, userId, accounts, activeAccountId }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [journalDirty, setJournalDirty] = useState(false);
  const [tradeDirty, setTradeDirty] = useState(false);
  const formRef = useRef(null);

  const onJournalDirtyChange = useCallback((d) => setJournalDirty(d), []);

  // Track trade form changes via input/change events
  useEffect(() => {
    const form = document.getElementById('trade-form');
    if (!form) return;
    formRef.current = form;
    function markDirty() { setTradeDirty(true); }
    form.addEventListener('input', markDirty);
    form.addEventListener('change', markDirty);
    return () => {
      form.removeEventListener('input', markDirty);
      form.removeEventListener('change', markDirty);
    };
  }, []);

  const isDirty = tradeDirty || journalDirty;

  async function handleSaveAll() {
    setSaving(true);
    // 1. Submit the trade form
    const form = document.getElementById('trade-form');
    if (form) form.requestSubmit();
    // 2. Save journal via exposed window function
    if (journalDirty && window.__journalSave) {
      await window.__journalSave();
    }
    setSaving(false);
  }

  return (
    <>
      <TradeForm mode="edit" tradeId={tradeId} initial={trade} prefs={prefs} setups={setups || []} accounts={accounts || []} activeAccountId={activeAccountId} hideButtons />

      {/* Journal — buttons hidden, save exposed via window ref */}
      <div className="mt-6 lg:pr-[324px]">
        <JournalInlineEdit
          tradeId={tradeId}
          journal={journal}
          userId={userId}
          prefs={prefs}
          screenshots={screenshots}
          startInEditMode
          hideButtons
          onDirtyChange={onJournalDirtyChange}
        />
      </div>

      {/* Single combined Save/Cancel at the bottom */}
      <div className="mt-6 flex items-center gap-3">
        <Link href={'/dashboard/trades/' + tradeId} className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white/70">
          Cancel
        </Link>
        <button
          onClick={handleSaveAll}
          disabled={saving || !isDirty}
          className="rounded-xl px-5 py-3 text-sm font-semibold text-[#08080f] disabled:opacity-40"
          style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}
        >
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </div>
    </>
  );
}
