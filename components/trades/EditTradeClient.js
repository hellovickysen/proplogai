"use client";

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TradeForm from '@/components/trades/TradeForm';
import JournalInlineEdit from '@/components/trades/JournalInlineEdit';

export default function EditTradeClient({ tradeId, trade, prefs, setups, journal, screenshots, userId, accounts, activeAccountId }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [journalDirty, setJournalDirty] = useState(false);
  const [tradeDirty, setTradeDirty] = useState(false);

  const onJournalDirtyChange = useCallback((d) => setJournalDirty(d), []);

  // Track trade form changes
  useEffect(() => {
    const form = document.getElementById('trade-form');
    if (!form) return;
    function markDirty() { setTradeDirty(true); }
    function onClickInForm(e) {
      if (e.target.closest('button[type="button"]')) markDirty();
    }
    form.addEventListener('input', markDirty);
    form.addEventListener('change', markDirty);
    form.addEventListener('click', onClickInForm);
    return () => {
      form.removeEventListener('input', markDirty);
      form.removeEventListener('change', markDirty);
      form.removeEventListener('click', onClickInForm);
    };
  }, []);

  const isDirty = tradeDirty || journalDirty;

  // Browser tab close/refresh warning
  useEffect(() => {
    function onBeforeUnload(e) {
      if (isDirty) { e.preventDefault(); e.returnValue = ''; }
    }
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty]);

  async function handleSaveAll() {
    setSaving(true);
    try {
      if (journalDirty && window.__journalSave) {
        await window.__journalSave();
      }
      const form = document.getElementById('trade-form');
      if (form) form.requestSubmit();
    } catch (e) {
      // ignore
    }
    // Reset after delay — if form validation fails, page stays
    setTimeout(() => setSaving(false), 2000);
  }

  function handleCancel() {
    router.push('/dashboard/trades/' + tradeId);
  }

  return (
    <>
      <TradeForm mode="edit" tradeId={tradeId} initial={trade} prefs={prefs} setups={setups || []} accounts={accounts || []} activeAccountId={activeAccountId} hideButtons />

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

      {/* Unsaved indicator + Save/Cancel */}
      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={handleCancel}
          className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white/70 hover:bg-white/10 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSaveAll}
          disabled={saving || !isDirty}
          className="rounded-xl px-5 py-3 text-sm font-semibold text-[#08080f] disabled:opacity-40"
          style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}
        >
          {saving ? 'Saving...' : 'Save changes'}
        </button>
        {isDirty && !saving && (
          <span className="flex items-center gap-1.5 text-xs text-amber-400/70">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
            Unsaved changes
          </span>
        )}
      </div>
    </>
  );
}
