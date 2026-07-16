"use client";

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TradeForm from '@/components/trades/TradeForm';
import JournalInlineEdit from '@/components/trades/JournalInlineEdit';

export default function EditTradeClient({ tradeId, trade, prefs, setups, journal, screenshots, userId, accounts, activeAccountId }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function handleSaveAll() {
    setSaving(true);
    // 1. Submit the trade form (it has id="trade-form")
    const form = document.getElementById('trade-form');
    if (form) form.requestSubmit();
    // 2. Save journal via exposed window function
    if (window.__journalSave) {
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
        />
      </div>

      {/* Single combined Save/Cancel at the bottom */}
      <div className="mt-6 flex items-center gap-3">
        <Link href={'/dashboard/trades/' + tradeId} className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white/70">
          Cancel
        </Link>
        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="rounded-xl px-5 py-3 text-sm font-semibold text-[#08080f] disabled:opacity-60"
          style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}
        >
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </div>
    </>
  );
}
